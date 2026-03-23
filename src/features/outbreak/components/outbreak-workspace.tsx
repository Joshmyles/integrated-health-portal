"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAssignOutbreak } from "@/src/features/outbreak/hooks/use-assign-outbreak";
import { useAssignableUsers } from "@/src/features/outbreak/hooks/use-assignable-users";
import { useCreateOutbreak } from "@/src/features/outbreak/hooks/use-create-outbreak";
import { useOutbreaks } from "@/src/features/outbreak/hooks/use-outbreaks";
import { OutbreakRequestError } from "@/src/features/outbreak/lib/outbreak-client";
import type {
  AssignOutbreakPayload,
  CreateOutbreakPayload,
  NullableStringValue,
  NullableTimeValue,
  OutbreakRecord
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

function readNullableString(value: NullableStringValue | undefined, fallback = "-") {
  if (!value?.Valid) {
    return fallback;
  }

  const trimmed = value.String.trim();
  return trimmed || fallback;
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
  const outbreaksQuery = useOutbreaks();
  const createMutation = useCreateOutbreak();
  const assignMutation = useAssignOutbreak();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const assignableUsersQuery = useAssignableUsers(isAssignModalOpen);
  const [assignOutbreakId, setAssignOutbreakId] = useState<number | null>(null);
  const [formState, setFormState] = useState<OutbreakFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
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
  const createError =
    createMutation.error instanceof OutbreakRequestError
      ? createMutation.error.message
      : createMutation.error
        ? "The outbreak could not be created."
        : null;
  const assignError =
    assignMutation.error instanceof OutbreakRequestError
      ? assignMutation.error.message
      : assignMutation.error
        ? "The outbreak could not be assigned."
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setIsModalOpen(false);
      setIsAssignModalOpen(false);
      setFormError(null);
      setAssignFormError(null);
      createMutation.reset();
      assignMutation.reset();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignMutation, createMutation]);

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

  function openAssignModal(outbreakId: number) {
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

  function updateField<Key extends keyof OutbreakFormState>(key: Key, value: OutbreakFormState[Key]) {
    setFormState((current) => ({
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

    const name = formState.name.trim();
    const outbreakType = formState.outbreakType.trim();
    const startDate = formState.startDate.trim();

    if (!name || !outbreakType || !startDate) {
      setFormError("Name, outbreak type, and start date are required.");
      return;
    }

    const payload: CreateOutbreakPayload = {
      description: formState.description.trim(),
      end_date: formState.endDate.trim(),
      name,
      outbreak_category: formState.outbreakCategory.trim() || outbreakType,
      outbreak_type: outbreakType,
      start_date: startDate,
      status: formState.status.trim() || "active"
    };

    setFormError(null);
    createMutation.mutate(payload, {
      onSuccess: () => {
        closeModal();
      }
    });
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

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <div className={styles.endpointLabel}>Live source: GET /api/outbreaks</div>
          <div className={styles.toolbarStatus}>
            {outbreaksQuery.isFetching ? "Refreshing outbreak list..." : "Showing latest outbreak list."}
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <button
            className={styles.secondaryButton}
            disabled={outbreaksQuery.isFetching}
            onClick={() => outbreaksQuery.refetch()}
            type="button"
          >
            {outbreaksQuery.isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <button className={styles.primaryButton} onClick={openModal} type="button">
            Add Outbreak
          </button>
        </div>
      </div>

      {loadError ? <div className={styles.errorBanner}>{loadError}</div> : null}

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
                <th scope="col">Action</th>
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
                  <td>
                    <button
                      className={styles.tableActionButton}
                      onClick={() => openAssignModal(outbreak.id)}
                      type="button"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

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
    </section>
  );
}
