"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useCreateRequisition } from "@/src/features/resource-management/hooks/use-create-requisition";
import { useDeleteRequisition } from "@/src/features/resource-management/hooks/use-delete-requisition";
import { useRequisitions } from "@/src/features/resource-management/hooks/use-requisitions";
import { useUpdateRequisition } from "@/src/features/resource-management/hooks/use-update-requisition";
import { ResourceManagementRequestError } from "@/src/features/resource-management/lib/resource-management-client";
import type {
  CreateRequisitionPayload,
  NullableTimeValue,
  RequisitionRecord
} from "@/src/features/resource-management/types/resource-management";
import { useOutbreaks } from "@/src/features/outbreak/hooks/use-outbreaks";
import { useUsers } from "@/src/features/users/hooks/use-users";
import styles from "./deployment-requisitions-workspace.module.css";

const PRIORITY_OPTIONS = ["normal", "high", "low", "urgent"] as const;
const STATUS_OPTIONS = ["pending", "approved", "in_progress", "fulfilled", "cancelled"] as const;

const INITIAL_FORM_STATE: CreateRequisitionPayload = {
  deployment_id: 0,
  notes: "",
  outbreak_id: 0,
  priority: "normal",
  requested_by: 0,
  required_date: "",
  requisition_number: "",
  status: "pending"
};

function readOptionalDate(value: NullableTimeValue | undefined) {
  if (!value?.Valid || !value.Time || value.Time === "0001-01-01T00:00:00Z") {
    return "";
  }

  return value.Time.slice(0, 10);
}

function formatDate(value: string) {
  if (!value || value === "0001-01-01T00:00:00Z") {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(date);
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return styles.statusPending;
    case "approved":
      return styles.statusApproved;
    case "fulfilled":
      return styles.statusFulfilled;
    default:
      return styles.statusDefault;
  }
}

function getPriorityClass(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent":
      return styles.priorityUrgent;
    case "high":
      return styles.priorityHigh;
    case "low":
      return styles.priorityLow;
    default:
      return styles.priorityNormal;
  }
}

function buildSearchText(requisition: RequisitionRecord) {
  return [
    `${requisition.id}`,
    requisition.requisition_number,
    `${requisition.outbreak_id}`,
    requisition.deployment_id.Valid ? `${requisition.deployment_id.Int64}` : "",
    `${requisition.requested_by}`,
    requisition.priority,
    requisition.status,
    requisition.notes.Valid ? requisition.notes.String : ""
  ]
    .join(" ")
    .toLowerCase();
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ResourceManagementRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function DeploymentRequisitionsWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<RequisitionRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RequisitionRecord | null>(null);
  const [formState, setFormState] = useState<CreateRequisitionPayload>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const requisitionsQuery = useRequisitions();
  const createMutation = useCreateRequisition();
  const updateMutation = useUpdateRequisition();
  const deleteMutation = useDeleteRequisition();
  const outbreaksQuery = useOutbreaks();
  const usersQuery = useUsers(1, 100);

  const requisitions = requisitionsQuery.data?.requisitions ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const statusOptions = Array.from(new Set(requisitions.map((item) => item.status)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  const filteredRequisitions = requisitions.filter((requisition) => {
    const matchesSearch = !normalizedSearch || buildSearchText(requisition).includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" || requisition.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requisitions.filter((item) => item.status.toLowerCase() === "pending").length;
  const urgentCount = requisitions.filter((item) => item.priority.toLowerCase() === "urgent").length;
  const fulfilledCount = requisitions.filter(
    (item) => item.status.toLowerCase() === "fulfilled"
  ).length;
  const linkedDeploymentsCount = requisitions.filter((item) => item.deployment_id.Valid).length;

  const isModalOpen = isCreateOpen || Boolean(editingRequisition);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const mutationError =
    formError ??
    (createMutation.isError
      ? getMutationErrorMessage(createMutation.error, "The requisition could not be created.")
      : updateMutation.isError
        ? getMutationErrorMessage(updateMutation.error, "The requisition could not be updated.")
        : null);
  const deleteError = deleteMutation.isError
    ? getMutationErrorMessage(deleteMutation.error, "The requisition could not be deleted.")
    : null;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuId(null);
      setIsCreateOpen(false);
      setEditingRequisition(null);
      setDeleteTarget(null);
      setFormError(null);
      setFormState(INITIAL_FORM_STATE);
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createMutation, deleteMutation, updateMutation]);

  function updateFormField<Key extends keyof CreateRequisitionPayload>(
    key: Key,
    value: CreateRequisitionPayload[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));

    if (formError) {
      setFormError(null);
    }
  }

  function closeFormModal() {
    setOpenMenuId(null);
    setEditingRequisition(null);
    setIsCreateOpen(false);
    setFormError(null);
    setFormState(INITIAL_FORM_STATE);
    createMutation.reset();
    updateMutation.reset();
  }

  function openCreateModal() {
    setOpenMenuId(null);
    setEditingRequisition(null);
    setIsCreateOpen(true);
    setStatusMessage(null);
    setFormError(null);
    setFormState(INITIAL_FORM_STATE);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(requisition: RequisitionRecord) {
    setOpenMenuId(null);
    setIsCreateOpen(false);
    setEditingRequisition(requisition);
    setStatusMessage(null);
    setFormError(null);
    setFormState({
      deployment_id: requisition.deployment_id.Valid ? requisition.deployment_id.Int64 : 0,
      notes: requisition.notes.Valid ? requisition.notes.String : "",
      outbreak_id: requisition.outbreak_id,
      priority: requisition.priority,
      requested_by: requisition.requested_by,
      required_date: readOptionalDate(requisition.required_date),
      requisition_number: requisition.requisition_number,
      status: requisition.status
    });
    createMutation.reset();
    updateMutation.reset();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    if (!formState.requisition_number.trim()) {
      setFormError("Requisition number is required.");
      return;
    }

    if (!Number.isInteger(formState.outbreak_id) || formState.outbreak_id < 1) {
      setFormError("Select a valid outbreak.");
      return;
    }

    if (!Number.isInteger(formState.requested_by) || formState.requested_by < 1) {
      setFormError("Select the requesting user.");
      return;
    }

    if (!Number.isInteger(formState.deployment_id) || formState.deployment_id < 0) {
      setFormError("Deployment ID must be zero or a positive whole number.");
      return;
    }

    if (!formState.required_date) {
      setFormError("Required date is needed.");
      return;
    }

    const payload: CreateRequisitionPayload = {
      deployment_id: formState.deployment_id,
      notes: formState.notes.trim(),
      outbreak_id: formState.outbreak_id,
      priority: formState.priority,
      requested_by: formState.requested_by,
      required_date: formState.required_date,
      requisition_number: formState.requisition_number.trim(),
      status: formState.status
    };

    try {
      if (editingRequisition) {
        await updateMutation.mutateAsync({
          id: editingRequisition.id,
          payload
        });
        setStatusMessage(`Requisition ${editingRequisition.requisition_number} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage(`Requisition ${payload.requisition_number} created successfully.`);
      }

      closeFormModal();
    } catch {
      return;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync(deleteTarget.id);
    setOpenMenuId(null);
    setDeleteTarget(null);
    setStatusMessage(`Requisition ${deleteTarget.requisition_number} deleted successfully.`);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.workspaceHeader}>
        <div className={styles.toolbarIntro}>
          <p className={styles.eyebrow}>Deployment Workspace</p>
          <h2 className={styles.sectionTitle}>Requisitions</h2>
          <p className={styles.toolbarCopy}>
            Manage deployment requests in the same focused flow as pillars: review the live list,
            open an action menu, and create or update records from one consistent modal.
          </p>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            name="requisition-search"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search requisitions, statuses, priorities, or notes"
            value={searchValue}
          />
          <select
            className={styles.fieldSelect}
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button className={styles.primaryButton} onClick={openCreateModal} type="button">
            New Requisition
          </button>
          <button
            className={styles.secondaryButton}
            disabled={requisitionsQuery.isFetching}
            onClick={() => requisitionsQuery.refetch()}
            type="button"
          >
            {requisitionsQuery.isFetching ? "Refreshing..." : "Refresh"}
          </button>
          {(searchValue || statusFilter !== "all") ? (
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setSearchValue("");
                setStatusFilter("all");
              }}
              type="button"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Requisitions</div>
          <div className={styles.summaryValue}>{requisitions.length}</div>
          <p className={styles.summaryNote}>Live rows from `/api/resource-management/requisitions`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Pending</div>
          <div className={styles.summaryValue}>{pendingCount}</div>
          <p className={styles.summaryNote}>Requests still waiting on review or action.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Urgent</div>
          <div className={styles.summaryValue}>{urgentCount}</div>
          <p className={styles.summaryNote}>High-pressure requests that need attention fastest.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Linked Deployments</div>
          <div className={styles.summaryValue}>{linkedDeploymentsCount}</div>
          <p className={styles.summaryNote}>Rows already attached to a deployment record.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Fulfilled</div>
          <div className={styles.summaryValue}>{fulfilledCount}</div>
          <p className={styles.summaryNote}>Requests that have already completed the full flow.</p>
        </article>
      </div>

      {statusMessage ? <div className={styles.statusRow}>{statusMessage}</div> : null}
      {mutationError ? <div className={styles.errorBanner}>{mutationError}</div> : null}
      {requisitionsQuery.isError ? (
        <div className={styles.errorBanner}>
          {getMutationErrorMessage(
            requisitionsQuery.error,
            "The requisitions list could not be loaded."
          )}
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Requisition</th>
              <th scope="col">Outbreak</th>
              <th scope="col">Deployment</th>
              <th scope="col">Requested By</th>
              <th scope="col">Required</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Notes</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requisitionsQuery.isLoading ? (
              <tr>
                <td className={styles.emptyState} colSpan={10}>
                  Loading requisitions...
                </td>
              </tr>
            ) : filteredRequisitions.length ? (
              filteredRequisitions.map((requisition) => (
                <tr key={requisition.id}>
                  <td>
                    <div className={styles.primaryCell}>{requisition.requisition_number}</div>
                    <div className={styles.secondaryCell}>ID {requisition.id}</div>
                  </td>
                  <td>#{requisition.outbreak_id}</td>
                  <td>
                    {requisition.deployment_id.Valid ? requisition.deployment_id.Int64 : "-"}
                  </td>
                  <td>#{requisition.requested_by}</td>
                  <td>{formatDate(readOptionalDate(requisition.required_date))}</td>
                  <td>
                    <span className={`${styles.priorityBadge} ${getPriorityClass(requisition.priority)}`}>
                      {requisition.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(requisition.status)}`}>
                      {requisition.status}
                    </span>
                  </td>
                  <td>{requisition.notes.Valid ? requisition.notes.String : "-"}</td>
                  <td>{formatDate(requisition.updated_at)}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuId === requisition.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === requisition.id ? null : requisition.id
                          )
                        }
                        type="button"
                      >
                        <span aria-hidden="true" className={styles.moreDots}>
                          <svg fill="currentColor" height="16" viewBox="0 0 20 20" width="16">
                            <circle cx="10" cy="4.2" r="1.4" />
                            <circle cx="10" cy="10" r="1.4" />
                            <circle cx="10" cy="15.8" r="1.4" />
                          </svg>
                        </span>
                      </button>

                      {openMenuId === requisition.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(requisition)}
                            type="button"
                          >
                            Edit requisition
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeleteTarget(requisition);
                            }}
                            type="button"
                          >
                            Delete requisition
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyState} colSpan={10}>
                  {requisitions.length
                    ? "No requisitions match the current search."
                    : "No requisitions found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="requisitions-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="requisitions-modal-title">
                  {editingRequisition ? "Edit Requisition" : "Create Requisition"}
                </h2>
                <p className={styles.modalText}>
                  Submit the live requisition payload with outbreak, requester, deployment, status,
                  priority, and notes in one place.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Requisition Number</span>
                    <input
                      name="requisition_number"
                      onChange={(event) =>
                        updateFormField("requisition_number", event.target.value)
                      }
                      placeholder="REQ-2026-001"
                      value={formState.requisition_number}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Deployment ID</span>
                    <input
                      inputMode="numeric"
                      min="0"
                      name="deployment_id"
                      onChange={(event) =>
                        updateFormField("deployment_id", Number(event.target.value))
                      }
                      value={formState.deployment_id}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Outbreak</span>
                    <select
                      name="outbreak_id"
                      onChange={(event) => updateFormField("outbreak_id", Number(event.target.value))}
                      value={formState.outbreak_id || ""}
                    >
                      <option value="">Select outbreak</option>
                      {outbreaksQuery.data?.map((outbreak) => (
                        <option key={outbreak.id} value={outbreak.id}>
                          {outbreak.name?.Valid ? outbreak.name.String : `Outbreak #${outbreak.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Requested By</span>
                    <select
                      name="requested_by"
                      onChange={(event) =>
                        updateFormField("requested_by", Number(event.target.value))
                      }
                      value={formState.requested_by || ""}
                    >
                      <option value="">Select user</option>
                      {usersQuery.data?.users?.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Required Date</span>
                    <input
                      name="required_date"
                      onChange={(event) => updateFormField("required_date", event.target.value)}
                      type="date"
                      value={formState.required_date}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Priority</span>
                    <select
                      name="priority"
                      onChange={(event) => updateFormField("priority", event.target.value)}
                      value={formState.priority}
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Status</span>
                    <select
                      name="status"
                      onChange={(event) => updateFormField("status", event.target.value)}
                      value={formState.status}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.fieldWide}>
                    <span>Notes</span>
                    <textarea
                      name="notes"
                      onChange={(event) => updateFormField("notes", event.target.value)}
                      placeholder="Add logistics or approval notes"
                      value={formState.notes}
                    />
                  </label>
                </div>

                {mutationError ? <div className={styles.inlineError}>{mutationError}</div> : null}
                <p className={styles.helperText}>
                  Deployment ID can stay `0` when the requisition is not yet linked to a deployment.
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={closeFormModal} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving
                    ? editingRequisition
                      ? "Saving..."
                      : "Creating..."
                    : editingRequisition
                      ? "Save Changes"
                      : "Create Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="delete-requisition-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="delete-requisition-title">
                  Delete Requisition
                </h2>
                <p className={styles.modalText}>
                  This will remove requisition {deleteTarget.requisition_number} from the live
                  deployment workflow.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.helperText}>
                Confirm before deleting. This action will call the live requisitions API.
              </p>
              {deleteError ? <div className={styles.inlineError}>{deleteError}</div> : null}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                disabled={deleteMutation.isPending}
                onClick={() => void confirmDelete()}
                type="button"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Requisition"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
