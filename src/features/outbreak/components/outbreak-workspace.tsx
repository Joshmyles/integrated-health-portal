"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAssignOutbreak } from "@/src/features/outbreak/hooks/use-assign-outbreak";
import { useAssignableUsers } from "@/src/features/outbreak/hooks/use-assignable-users";
import { useOutbreakAssignments } from "@/src/features/outbreak/hooks/use-outbreak-assignments";
import { useCreateOutbreak } from "@/src/features/outbreak/hooks/use-create-outbreak";
import { useDeleteOutbreak } from "@/src/features/outbreak/hooks/use-delete-outbreak";
import { useUpdateOutbreak } from "@/src/features/outbreak/hooks/use-update-outbreak";
import { useOutbreaks } from "@/src/features/outbreak/hooks/use-outbreaks";
import { OutbreakRequestError } from "@/src/features/outbreak/lib/outbreak-client";
import type {
  AssignOutbreakPayload,
  OutbreakAssignmentRecord,
  NullableStringValue,
  NullableTimeValue,
  OutbreakRecord,
  UpdateOutbreakPayload
} from "@/src/features/outbreak/types/outbreak";
import { UsersRequestError } from "@/src/features/users/lib/users-client";
import type { UserListItem } from "@/src/features/users/types/users";
import styles from "./outbreak-workspace.module.css";

interface OutbreakFormState {
  description: string;
  endDate: string;
  name: string;
  outbreakCategory: string;
  outbreakType: string;
  startDate: string;
  status: string;
}

interface AssignFormState {
  userId: string;
}

interface AssignmentListRow {
  assignedAt: string;
  id: string;
  outbreakId: string;
  outbreakName: string;
  status: string;
  userId: string;
  userLabel: string;
}

type WorkspaceTab = "assignments" | "outbreaks";

const INITIAL_FORM_STATE: OutbreakFormState = {
  description: "",
  endDate: "",
  name: "",
  outbreakCategory: "",
  outbreakType: "vhf",
  startDate: "",
  status: "active"
};

const INITIAL_ASSIGN_FORM_STATE: AssignFormState = {
  userId: ""
};

function getUserDisplayName(user: UserListItem) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNullableString(value: NullableStringValue | undefined, fallback = "-") {
  if (!value?.Valid) {
    return fallback;
  }

  const trimmed = value.String.trim();
  return trimmed || fallback;
}

function readUnknownString(value: unknown, fallback = "-"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (isRecord(value)) {
    if ("String" in value && typeof value.String === "string") {
      const valid = "Valid" in value ? Boolean(value.Valid) : true;
      return valid ? readUnknownString(value.String, fallback) : fallback;
    }

    if ("name" in value) {
      return readUnknownString(value.name, fallback);
    }

    if ("username" in value) {
      return readUnknownString(value.username, fallback);
    }

    if ("id" in value) {
      return readUnknownString(value.id, fallback);
    }
  }

  return fallback;
}

function toNullableDate(value: NullableTimeValue | undefined) {
  if (!value?.Valid) {
    return null;
  }

  const date = new Date(value.Time);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatNullableDate(value: NullableTimeValue | undefined) {
  const date = toNullableDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium"
  }).format(date);
}

function toDateInputValue(value: NullableTimeValue | undefined) {
  if (!value?.Valid) {
    return "";
  }

  const rawValue = value.Time.trim();
  const dateOnlyMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);

  if (dateOnlyMatch?.[1]) {
    return dateOnlyMatch[1];
  }

  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function formatUnknownDate(value: unknown) {
  if (isRecord(value) && "Time" in value && typeof value.Time === "string") {
    const valid = "Valid" in value ? Boolean(value.Valid) : true;

    if (!valid) {
      return "-";
    }

    return formatUnknownDate(value.Time);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return readUnknownString(value, "-");
    }

    return new Intl.DateTimeFormat("en-UG", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(parsed);
  }

  return readUnknownString(value, "-");
}

function getRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function toAssignmentRow(item: OutbreakAssignmentRecord, index: number): AssignmentListRow {
  if (!isRecord(item)) {
    return {
      assignedAt: "-",
      id: `assignment-${index}`,
      outbreakId: "-",
      outbreakName: "-",
      status: "-",
      userId: "-",
      userLabel: "-"
    };
  }

  const outbreakRef = getRecordValue(item, ["outbreak", "outbreak_ref"]);
  const userRef = getRecordValue(item, ["user", "assignee"]);
  const outbreakId = readUnknownString(
    getRecordValue(item, ["outbreak_id", "outbreakId", "outbreak_id_fk"]) ??
      (isRecord(outbreakRef) ? getRecordValue(outbreakRef, ["id"]) : undefined),
    "-"
  );
  const userId = readUnknownString(
    getRecordValue(item, ["user_id", "userId", "assigned_user_id"]) ??
      (isRecord(userRef) ? getRecordValue(userRef, ["id"]) : undefined),
    "-"
  );
  const id = readUnknownString(
    getRecordValue(item, ["id"]),
    `${outbreakId}-${userId}-${index}`
  );
  const outbreakName = readUnknownString(
    getRecordValue(item, ["outbreak_name", "outbreakName", "outbreak_title"]) ??
      (isRecord(outbreakRef) ? getRecordValue(outbreakRef, ["name", "title"]) : undefined),
    "-"
  );
  const userLabel = readUnknownString(
    getRecordValue(item, ["user_name", "username", "user_email"]) ??
      (isRecord(userRef)
        ? getRecordValue(userRef, ["name", "username", "email"])
        : undefined),
    "-"
  );
  const assignedAt = formatUnknownDate(
    getRecordValue(item, ["assigned_at", "assignedAt", "created_at", "timestamp"])
  );
  const status = readUnknownString(
    getRecordValue(item, ["status", "assignment_status", "state"]),
    "-"
  );

  return {
    assignedAt,
    id,
    outbreakId,
    outbreakName,
    status,
    userId,
    userLabel
  };
}

function createFormStateFromOutbreak(outbreak: OutbreakRecord): OutbreakFormState {
  const outbreakType = readNullableString(outbreak.outbreak_type, "").trim();
  const category = readNullableString(outbreak.outbreak_category, "").trim();

  return {
    description: readNullableString(outbreak.description, ""),
    endDate: toDateInputValue(outbreak.end_date),
    name: readNullableString(outbreak.name, ""),
    outbreakCategory: category,
    outbreakType: outbreakType || "vhf",
    startDate: toDateInputValue(outbreak.start_date),
    status: readNullableString(outbreak.status, "active")
  };
}

function buildOutbreakPayload(formState: OutbreakFormState): UpdateOutbreakPayload {
  const outbreakType = formState.outbreakType.trim();

  return {
    description: formState.description.trim(),
    end_date: formState.endDate.trim(),
    name: formState.name.trim(),
    outbreak_category: formState.outbreakCategory.trim() || outbreakType,
    outbreak_type: outbreakType,
    start_date: formState.startDate.trim(),
    status: formState.status.trim() || "active"
  };
}

function createOutbreakSortValue(outbreak: OutbreakRecord) {
  return toNullableDate(outbreak.start_date)?.getTime() ?? 0;
}

function getActiveOutbreakCount(outbreaks: OutbreakRecord[]) {
  return outbreaks.filter(
    (outbreak) => readNullableString(outbreak.status, "").toLowerCase() === "active"
  ).length;
}

function getClosedOutbreakCount(outbreaks: OutbreakRecord[]) {
  return outbreaks.filter(
    (outbreak) => readNullableString(outbreak.status, "").toLowerCase() === "closed"
  ).length;
}

function getLatestStartDate(outbreaks: OutbreakRecord[]) {
  const timestamps = outbreaks
    .map((outbreak) => createOutbreakSortValue(outbreak))
    .filter((value) => value > 0)
    .sort((left, right) => right - left);

  if (!timestamps.length) {
    return "No valid date";
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium"
  }).format(new Date(timestamps[0]));
}

export function OutbreakWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("outbreaks");
  const isAssignmentsTab = activeTab === "assignments";
  const outbreaksQuery = useOutbreaks();
  const assignmentsQuery = useOutbreakAssignments(isAssignmentsTab);
  const createMutation = useCreateOutbreak();
  const updateMutation = useUpdateOutbreak();
  const assignMutation = useAssignOutbreak();
  const deleteMutation = useDeleteOutbreak();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const assignableUsersQuery = useAssignableUsers(isAssignModalOpen);
  const [openMenuOutbreakId, setOpenMenuOutbreakId] = useState<number | null>(null);
  const [detailsOutbreak, setDetailsOutbreak] = useState<OutbreakRecord | null>(null);
  const [editTargetOutbreak, setEditTargetOutbreak] = useState<OutbreakRecord | null>(null);
  const [deleteTargetOutbreak, setDeleteTargetOutbreak] = useState<OutbreakRecord | null>(null);
  const [assignOutbreakId, setAssignOutbreakId] = useState<number | null>(null);
  const [formState, setFormState] = useState<OutbreakFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<OutbreakFormState>(INITIAL_FORM_STATE);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [assignFormState, setAssignFormState] = useState<AssignFormState>(
    INITIAL_ASSIGN_FORM_STATE
  );
  const [assignFormError, setAssignFormError] = useState<string | null>(null);
  const outbreaks = useMemo(
    () => {
      const rows = Array.isArray(outbreaksQuery.data) ? outbreaksQuery.data : [];

      return [...rows].sort(
        (left, right) => createOutbreakSortValue(right) - createOutbreakSortValue(left)
      );
    },
    [outbreaksQuery.data]
  );
  const activeCount = getActiveOutbreakCount(outbreaks);
  const closedCount = getClosedOutbreakCount(outbreaks);
  const diseaseTypeCount = new Set(
    outbreaks
      .map((outbreak) => readNullableString(outbreak.outbreak_type, ""))
      .filter(Boolean)
      .map((value) => value.toLowerCase())
  ).size;
  const loadError =
    outbreaksQuery.error instanceof OutbreakRequestError
      ? outbreaksQuery.error.message
      : outbreaksQuery.error
        ? "The outbreak list could not be loaded."
        : null;
  const assignmentsLoadError =
    assignmentsQuery.error instanceof OutbreakRequestError
      ? assignmentsQuery.error.message
      : assignmentsQuery.error
        ? "The outbreak assignments could not be loaded."
        : null;
  const createError =
    createMutation.error instanceof OutbreakRequestError
      ? createMutation.error.message
      : createMutation.error
        ? "The outbreak could not be created."
        : null;
  const updateError =
    updateMutation.error instanceof OutbreakRequestError
      ? updateMutation.error.message
      : updateMutation.error
        ? "The outbreak could not be updated."
        : null;
  const assignError =
    assignMutation.error instanceof OutbreakRequestError
      ? assignMutation.error.message
      : assignMutation.error
        ? "The outbreak could not be assigned."
        : null;
  const deleteError =
    deleteMutation.error instanceof OutbreakRequestError
      ? deleteMutation.error.message
      : deleteMutation.error
        ? "The outbreak could not be deleted."
        : null;
  const assignableUsersLoadError =
    assignableUsersQuery.error instanceof UsersRequestError
      ? assignableUsersQuery.error.message
      : assignableUsersQuery.error
        ? "The user list could not be loaded."
        : null;
  const assignableUsers = useMemo(
    () =>
      [...(assignableUsersQuery.data?.users ?? [])].sort((left, right) =>
        getUserDisplayName(left).localeCompare(getUserDisplayName(right))
      ),
    [assignableUsersQuery.data?.users]
  );
  const assignmentRows = useMemo(
    () => (assignmentsQuery.data ?? []).map((item, index) => toAssignmentRow(item, index)),
    [assignmentsQuery.data]
  );
  const assignmentOutbreakCount = new Set(
    assignmentRows.map((row) => row.outbreakId).filter((value) => value && value !== "-")
  ).size;
  const assignmentUserCount = new Set(
    assignmentRows.map((row) => row.userId).filter((value) => value && value !== "-")
  ).size;
  const currentLoadError = isAssignmentsTab ? assignmentsLoadError : loadError;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuOutbreakId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuOutbreakId(null);
      setDetailsOutbreak(null);
      setEditTargetOutbreak(null);
      setDeleteTargetOutbreak(null);
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setIsAssignModalOpen(false);
      setFormError(null);
      setEditFormError(null);
      setAssignFormError(null);
      createMutation.reset();
      updateMutation.reset();
      assignMutation.reset();
      deleteMutation.reset();
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignMutation, createMutation, deleteMutation, updateMutation]);

  useEffect(() => {
    setOpenMenuOutbreakId(null);

    if (activeTab === "assignments") {
      setDetailsOutbreak(null);
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setIsAssignModalOpen(false);
      setDeleteTargetOutbreak(null);
    }
  }, [activeTab]);

  function openModal() {
    setIsModalOpen(true);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    createMutation.reset();
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormError(null);
    createMutation.reset();
  }

  function openEditModal(outbreak: OutbreakRecord) {
    setOpenMenuOutbreakId(null);
    setEditTargetOutbreak(outbreak);
    setEditFormState(createFormStateFromOutbreak(outbreak));
    setEditFormError(null);
    updateMutation.reset();
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditTargetOutbreak(null);
    setEditFormState(INITIAL_FORM_STATE);
    setEditFormError(null);
    updateMutation.reset();
  }

  function openAssignModal(outbreakId: number) {
    setOpenMenuOutbreakId(null);
    setIsAssignModalOpen(true);
    setAssignOutbreakId(outbreakId);
    setAssignFormState({
      userId: ""
    });
    setAssignFormError(null);
    assignMutation.reset();
  }

  function closeAssignModal() {
    setIsAssignModalOpen(false);
    setAssignOutbreakId(null);
    setAssignFormState(INITIAL_ASSIGN_FORM_STATE);
    setAssignFormError(null);
    assignMutation.reset();
  }

  function openDetailsModal(outbreak: OutbreakRecord) {
    setOpenMenuOutbreakId(null);
    setDetailsOutbreak(outbreak);
  }

  function closeDetailsModal() {
    setDetailsOutbreak(null);
  }

  function openAssignFromDetails() {
    if (!detailsOutbreak) {
      return;
    }

    const outbreakId = detailsOutbreak.id;
    closeDetailsModal();
    openAssignModal(outbreakId);
  }

  function openEditFromDetails() {
    if (!detailsOutbreak) {
      return;
    }

    const outbreak = detailsOutbreak;
    closeDetailsModal();
    openEditModal(outbreak);
  }

  function openDeleteModal(outbreak: OutbreakRecord) {
    setOpenMenuOutbreakId(null);
    setDeleteTargetOutbreak(outbreak);
    deleteMutation.reset();
  }

  function closeDeleteModal() {
    setDeleteTargetOutbreak(null);
    deleteMutation.reset();
  }

  function updateField<Key extends keyof OutbreakFormState>(key: Key, value: OutbreakFormState[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateEditField<Key extends keyof OutbreakFormState>(
    key: Key,
    value: OutbreakFormState[Key]
  ) {
    setEditFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateAssignField<Key extends keyof AssignFormState>(
    key: Key,
    value: AssignFormState[Key]
  ) {
    setAssignFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = buildOutbreakPayload(formState);

    if (!payload.name || !payload.outbreak_type || !payload.start_date) {
      setFormError("Name, outbreak type, and start date are required.");
      return;
    }

    setFormError(null);
    createMutation.mutate(payload, {
      onSuccess: () => {
        closeModal();
      }
    });
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editTargetOutbreak) {
      setEditFormError("A valid outbreak must be selected before updating.");
      return;
    }

    const payload = buildOutbreakPayload(editFormState);

    if (!payload.name || !payload.outbreak_type || !payload.start_date) {
      setEditFormError("Name, outbreak type, and start date are required.");
      return;
    }

    setEditFormError(null);
    updateMutation.mutate(
      {
        outbreakId: editTargetOutbreak.id,
        payload
      },
      {
        onSuccess: () => {
          if (detailsOutbreak?.id === editTargetOutbreak.id) {
            closeDetailsModal();
          }

          closeEditModal();
        }
      }
    );
  }

  function handleAssignSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const outbreakId = assignOutbreakId;
    const userId = Number(assignFormState.userId);

    if (!outbreakId) {
      setAssignFormError("A valid outbreak must be selected.");
      return;
    }

    if (!Number.isInteger(userId) || userId < 1) {
      setAssignFormError("User ID must be a positive whole number.");
      return;
    }

    const payload: AssignOutbreakPayload = {
      outbreak_id: outbreakId,
      user_id: userId
    };

    setAssignFormError(null);
    assignMutation.mutate(payload, {
      onSuccess: () => {
        closeAssignModal();
      }
    });
  }

  function handleDeleteOutbreak() {
    if (!deleteTargetOutbreak) {
      return;
    }

    deleteMutation.mutate(deleteTargetOutbreak.id, {
      onSuccess: () => {
        if (detailsOutbreak?.id === deleteTargetOutbreak.id) {
          closeDetailsModal();
        }

        if (editTargetOutbreak?.id === deleteTargetOutbreak.id) {
          closeEditModal();
        }

        closeDeleteModal();
      }
    });
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <div className={styles.endpointLabel}>
            {isAssignmentsTab
              ? "Live source: GET /api/outbreaks/assignments"
              : "Live source: GET /api/outbreaks"}
          </div>
          <div className={styles.toolbarStatus}>
            {isAssignmentsTab
              ? assignmentsQuery.isFetching
                ? "Refreshing assignments..."
                : "Showing latest outbreak assignments."
              : outbreaksQuery.isFetching
                ? "Refreshing outbreak list..."
                : "Showing latest outbreak list."}
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <button
            className={styles.secondaryButton}
            disabled={isAssignmentsTab ? assignmentsQuery.isFetching : outbreaksQuery.isFetching}
            onClick={() =>
              isAssignmentsTab ? assignmentsQuery.refetch() : outbreaksQuery.refetch()
            }
            type="button"
          >
            {isAssignmentsTab
              ? assignmentsQuery.isFetching
                ? "Refreshing..."
                : "Refresh Assignments"
              : outbreaksQuery.isFetching
                ? "Refreshing..."
                : "Refresh"}
          </button>
          {!isAssignmentsTab ? (
            <button className={styles.primaryButton} onClick={openModal} type="button">
              Add Outbreak
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${!isAssignmentsTab ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("outbreaks")}
          type="button"
        >
          Outbreaks
        </button>
        <button
          className={`${styles.tabButton} ${isAssignmentsTab ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("assignments")}
          type="button"
        >
          Assignments
        </button>
      </div>

      {currentLoadError ? <div className={styles.errorBanner}>{currentLoadError}</div> : null}

      {!isAssignmentsTab ? (
        <>
          <div className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total outbreaks</div>
              <div className={styles.summaryValue}>{outbreaks.length}</div>
            </article>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Active</div>
              <div className={styles.summaryValue}>{activeCount}</div>
            </article>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Closed</div>
              <div className={styles.summaryValue}>{closedCount}</div>
            </article>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Latest start</div>
              <div className={styles.summaryValue}>{getLatestStartDate(outbreaks)}</div>
              <div className={styles.summaryNote}>{diseaseTypeCount} outbreak types in list</div>
            </article>
          </div>

          <div className={styles.tableWrap}>
            {outbreaksQuery.isLoading ? (
              <div className={styles.stateMessage}>Loading outbreaks...</div>
            ) : null}

            {!outbreaksQuery.isLoading && !outbreaks.length ? (
              <div className={styles.stateMessage}>No outbreaks available right now.</div>
            ) : null}

            {!outbreaksQuery.isLoading && outbreaks.length ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Start Date</th>
                    <th scope="col">End Date</th>
                    <th scope="col">Description</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outbreaks.map((outbreak) => (
                    <tr key={outbreak.id}>
                      <td>{outbreak.id}</td>
                      <td>{readNullableString(outbreak.name)}</td>
                      <td>{readNullableString(outbreak.outbreak_category).toUpperCase()}</td>
                      <td>{readNullableString(outbreak.outbreak_type).toUpperCase()}</td>
                      <td>{readNullableString(outbreak.status)}</td>
                      <td>{formatNullableDate(outbreak.start_date)}</td>
                      <td>{formatNullableDate(outbreak.end_date)}</td>
                      <td>{readNullableString(outbreak.description)}</td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsMenuWrap} data-actions-menu="">
                          <button
                            aria-expanded={openMenuOutbreakId === outbreak.id}
                            aria-haspopup="menu"
                            className={styles.moreButton}
                            onClick={() =>
                              setOpenMenuOutbreakId((current) =>
                                current === outbreak.id ? null : outbreak.id
                              )
                            }
                            type="button"
                          >
                            <span className={styles.moreDots} aria-hidden="true">
                              <svg fill="currentColor" height="16" viewBox="0 0 20 20" width="16">
                                <circle cx="10" cy="4.2" r="1.4" />
                                <circle cx="10" cy="10" r="1.4" />
                                <circle cx="10" cy="15.8" r="1.4" />
                              </svg>
                            </span>
                          </button>

                          {openMenuOutbreakId === outbreak.id ? (
                            <div className={styles.dropdown} role="menu">
                              <button
                                className={styles.dropdownItem}
                                onClick={() => openDetailsModal(outbreak)}
                                type="button"
                              >
                                View details
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => openAssignModal(outbreak.id)}
                                type="button"
                              >
                                Assign
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => openEditModal(outbreak)}
                                type="button"
                              >
                                Edit outbreak
                              </button>
                              <button
                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                onClick={() => openDeleteModal(outbreak)}
                                type="button"
                              >
                                Delete outbreak
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total assignments</div>
              <div className={styles.summaryValue}>{assignmentRows.length}</div>
            </article>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Assigned outbreaks</div>
              <div className={styles.summaryValue}>{assignmentOutbreakCount}</div>
            </article>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Assigned users</div>
              <div className={styles.summaryValue}>{assignmentUserCount}</div>
            </article>
            <article className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Source endpoint</div>
              <div className={styles.summaryValue}>Live</div>
              <div className={styles.summaryNote}>/api/outbreaks/assignments</div>
            </article>
          </div>

          <div className={styles.tableWrap}>
            {assignmentsQuery.isLoading ? (
              <div className={styles.stateMessage}>Loading outbreak assignments...</div>
            ) : null}

            {!assignmentsQuery.isLoading && !assignmentRows.length ? (
              <div className={styles.stateMessage}>No outbreak assignments available right now.</div>
            ) : null}

            {!assignmentsQuery.isLoading && assignmentRows.length ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Assignment ID</th>
                    <th scope="col">Outbreak ID</th>
                    <th scope="col">Outbreak</th>
                    <th scope="col">User ID</th>
                    <th scope="col">User</th>
                    <th scope="col">Assigned At</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.outbreakId}</td>
                      <td>{row.outbreakName}</td>
                      <td>{row.userId}</td>
                      <td>{row.userLabel}</td>
                      <td>{row.assignedAt}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </>
      )}

      {isModalOpen ? (
        <div className={styles.modalBackdrop} onClick={closeModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="outbreak-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle} id="outbreak-modal-title">
                  Add Outbreak
                </div>
                <div className={styles.modalSubtitle}>POST /api/outbreaks</div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Name</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                  type="text"
                  value={formState.name}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Outbreak Type</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateField("outbreakType", event.target.value)}
                  placeholder="vhf"
                  required
                  type="text"
                  value={formState.outbreakType}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Outbreak Category</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateField("outbreakCategory", event.target.value)}
                  placeholder="vhf"
                  type="text"
                  value={formState.outbreakCategory}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Status</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateField("status", event.target.value)}
                  placeholder="active"
                  type="text"
                  value={formState.status}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Start Date</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateField("startDate", event.target.value)}
                  required
                  type="date"
                  value={formState.startDate}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>End Date</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateField("endDate", event.target.value)}
                  type="date"
                  value={formState.endDate}
                />
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.fieldLabel}>Description</span>
                <textarea
                  className={styles.fieldTextArea}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  value={formState.description}
                />
              </label>

              {formError ? <div className={styles.errorText}>{formError}</div> : null}
              {createError ? <div className={styles.errorText}>{createError}</div> : null}

              <div className={styles.formActions}>
                <button className={styles.secondaryButton} onClick={closeModal} type="button">
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={createMutation.isPending}
                  type="submit"
                >
                  {createMutation.isPending ? "Saving..." : "Create Outbreak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditModalOpen && editTargetOutbreak ? (
        <div className={styles.modalBackdrop} onClick={closeEditModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-outbreak-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle} id="edit-outbreak-modal-title">
                  Edit Outbreak
                </div>
                <div className={styles.modalSubtitle}>
                  PUT /api/outbreaks/{editTargetOutbreak.id}
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeEditModal} type="button">
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleEditSubmit}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Name</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateEditField("name", event.target.value)}
                  required
                  type="text"
                  value={editFormState.name}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Outbreak Type</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateEditField("outbreakType", event.target.value)}
                  placeholder="vhf"
                  required
                  type="text"
                  value={editFormState.outbreakType}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Outbreak Category</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateEditField("outbreakCategory", event.target.value)}
                  placeholder="vhf"
                  type="text"
                  value={editFormState.outbreakCategory}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Status</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateEditField("status", event.target.value)}
                  placeholder="active"
                  type="text"
                  value={editFormState.status}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Start Date</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateEditField("startDate", event.target.value)}
                  required
                  type="date"
                  value={editFormState.startDate}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>End Date</span>
                <input
                  className={styles.fieldInput}
                  onChange={(event) => updateEditField("endDate", event.target.value)}
                  type="date"
                  value={editFormState.endDate}
                />
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.fieldLabel}>Description</span>
                <textarea
                  className={styles.fieldTextArea}
                  onChange={(event) => updateEditField("description", event.target.value)}
                  rows={4}
                  value={editFormState.description}
                />
              </label>

              {editFormError ? <div className={styles.errorText}>{editFormError}</div> : null}
              {updateError ? <div className={styles.errorText}>{updateError}</div> : null}

              <div className={styles.formActions}>
                <button className={styles.secondaryButton} onClick={closeEditModal} type="button">
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={updateMutation.isPending}
                  type="submit"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Outbreak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailsOutbreak ? (
        <div className={styles.modalBackdrop} onClick={closeDetailsModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="outbreak-details-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle} id="outbreak-details-modal-title">
                  Outbreak Details
                </div>
                <div className={styles.modalSubtitle}>Outbreak #{detailsOutbreak.id}</div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeDetailsModal} type="button">
                Close
              </button>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Name</div>
                <div className={styles.detailsValue}>{readNullableString(detailsOutbreak.name)}</div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Category</div>
                <div className={styles.detailsValue}>
                  {readNullableString(detailsOutbreak.outbreak_category).toUpperCase()}
                </div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Type</div>
                <div className={styles.detailsValue}>
                  {readNullableString(detailsOutbreak.outbreak_type).toUpperCase()}
                </div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Status</div>
                <div className={styles.detailsValue}>{readNullableString(detailsOutbreak.status)}</div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Start Date</div>
                <div className={styles.detailsValue}>
                  {formatNullableDate(detailsOutbreak.start_date)}
                </div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>End Date</div>
                <div className={styles.detailsValue}>{formatNullableDate(detailsOutbreak.end_date)}</div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Description</div>
                <div className={styles.detailsValue}>
                  {readNullableString(detailsOutbreak.description)}
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.secondaryButton} onClick={closeDetailsModal} type="button">
                Close
              </button>
              <button className={styles.primaryButton} onClick={openEditFromDetails} type="button">
                Edit Outbreak
              </button>
              <button className={styles.primaryButton} onClick={openAssignFromDetails} type="button">
                Assign Outbreak
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAssignModalOpen ? (
        <div className={styles.modalBackdrop} onClick={closeAssignModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-outbreak-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle} id="assign-outbreak-modal-title">
                  Assign Outbreak
                </div>
                <div className={styles.modalSubtitle}>
                  POST /api/outbreaks/assign for outbreak #{assignOutbreakId ?? "-"}
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeAssignModal} type="button">
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleAssignSubmit}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>User</span>
                <select
                  className={styles.fieldInput}
                  disabled={
                    assignableUsersQuery.isLoading ||
                    Boolean(assignableUsersLoadError) ||
                    assignMutation.isPending
                  }
                  onChange={(event) => updateAssignField("userId", event.target.value)}
                  required
                  value={assignFormState.userId}
                >
                  <option value="">Select user</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {getUserDisplayName(user)} ({user.username}) - ID {user.id}
                    </option>
                  ))}
                </select>
              </label>

              {assignableUsersQuery.isLoading ? (
                <div className={styles.modalInfoText}>Loading users...</div>
              ) : null}

              {!assignableUsersQuery.isLoading && !assignableUsers.length ? (
                <div className={styles.modalInfoText}>No users available for assignment.</div>
              ) : null}

              {assignableUsersLoadError ? (
                <div className={styles.errorText}>{assignableUsersLoadError}</div>
              ) : null}

              {assignFormError ? <div className={styles.errorText}>{assignFormError}</div> : null}
              {assignError ? <div className={styles.errorText}>{assignError}</div> : null}

              <div className={styles.formActions}>
                <button className={styles.secondaryButton} onClick={closeAssignModal} type="button">
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={assignMutation.isPending}
                  type="submit"
                >
                  {assignMutation.isPending ? "Assigning..." : "Assign Outbreak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTargetOutbreak ? (
        <div className={styles.modalBackdrop} onClick={closeDeleteModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-outbreak-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle} id="delete-outbreak-modal-title">
                  Delete Outbreak
                </div>
                <div className={styles.modalSubtitle}>
                  DELETE /api/outbreaks/{deleteTargetOutbreak.id}
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeDeleteModal} type="button">
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.warningCopy}>
                This action will permanently remove outbreak #{deleteTargetOutbreak.id}
                {` (${readNullableString(deleteTargetOutbreak.name)})`}.
              </p>
              <p className={styles.warningCopy}>Are you sure you want to continue?</p>

              {deleteError ? <div className={styles.errorText}>{deleteError}</div> : null}
            </div>

            <div className={styles.formActions}>
              <button className={styles.secondaryButton} onClick={closeDeleteModal} type="button">
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                disabled={deleteMutation.isPending}
                onClick={handleDeleteOutbreak}
                type="button"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete outbreak"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
