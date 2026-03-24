"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useState } from "react";
import { useCreateRequisition } from "@/src/features/resource-management/hooks/use-create-requisition";
import { useDeleteRequisition } from "@/src/features/resource-management/hooks/use-delete-requisition";
import { useRequisitions } from "@/src/features/resource-management/hooks/use-requisitions";
import { useUpdateRequisition } from "@/src/features/resource-management/hooks/use-update-requisition";
import { ResourceManagementRequestError } from "@/src/features/resource-management/lib/resource-management-client";
import type { CreateRequisitionPayload, RequisitionRecord } from "@/src/features/resource-management/types/resource-management";
import { useOutbreaks } from "@/src/features/outbreak/hooks/use-outbreaks";
import { useUsers } from "@/src/features/users/hooks/use-users";
import styles from "./deployment-requisitions-workspace.module.css";

const PRIORITY_OPTIONS = ["normal", "high", "low", "urgent"] as const;
const STATUS_OPTIONS = ["pending", "approved", "in_progress", "fulfilled", "cancelled"] as const;

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "pending": return styles.statusPending;
    case "approved": return styles.statusApproved;
    case "fulfilled": return styles.statusFulfilled;
    default: return styles.statusDefault;
  }
}

function getPriorityClass(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
    case "urgent": return styles.priorityHigh;
    case "low": return styles.priorityLow;
    default: return styles.priorityNormal;
  }
}

function buildSearchText(r: RequisitionRecord) {
  return [r.id.toString(), r.requisition_number, r.status, r.priority, r.notes.String]
    .join(" ")
    .toLowerCase();
}

const emptyForm: CreateRequisitionPayload = {
  deployment_id: 0,
  notes: "",
  outbreak_id: 0,
  priority: "normal",
  requested_by: 0,
  required_date: "",
  requisition_number: "",
  status: "pending"
};

export function DeploymentRequisitionsWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [viewingRequisition, setViewingRequisition] = useState<RequisitionRecord | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateRequisitionPayload>(emptyForm);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  const query = useRequisitions();
  const createMutation = useCreateRequisition();
  const updateMutation = useUpdateRequisition();
  const deleteMutation = useDeleteRequisition();
  const outbreaksQuery = useOutbreaks();
  const usersQuery = useUsers(1, 100);

  const requisitions = query.data?.requisitions ?? [];

  const statusOptions = Array.from(new Set(requisitions.map((r) => r.status)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filtered = requisitions.filter((r) => {
    const matchesSearch = !deferredSearch || buildSearchText(r).includes(deferredSearch);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const mutationError =
    (createMutation.error || updateMutation.error || deleteMutation.error) instanceof
      ResourceManagementRequestError
      ? (createMutation.error || updateMutation.error || deleteMutation.error)?.message
      : (createMutation.error || updateMutation.error || deleteMutation.error)
        ? "The operation could not be completed. Please try again."
        : null;

  function handleFieldChange(field: keyof CreateRequisitionPayload, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload: form });
        setSuccessMessage(`Requisition "${form.requisition_number}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(form);
        setSuccessMessage(`Requisition "${form.requisition_number}" created successfully.`);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } catch {
      // error shown via mutation error
    }
  }

  function handleEdit(r: RequisitionRecord) {
    setEditingId(r.id);
    setForm({
      deployment_id: r.deployment_id.Valid ? r.deployment_id.Int64 : 0,
      notes: r.notes.String,
      outbreak_id: r.outbreak_id,
      priority: r.priority,
      requested_by: r.requested_by,
      required_date: r.required_date.Valid ? r.required_date.Time.split("T")[0] : "",
      requisition_number: r.requisition_number,
      status: r.status
    });
    setSuccessMessage(null);
    setShowForm(true);
    setViewingRequisition(null);
  }

  async function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this requisition?")) {
      try {
        await deleteMutation.mutateAsync(id);
        setSuccessMessage("Requisition deleted successfully.");
      } catch {
        // error shown via mutation
      }
    }
  }

  function handleReset() {
    setSearchValue("");
    setStatusFilter("all");
  }

  return (
    <div className={styles.workspace}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <div className={styles.endpointLabel}>
            GET /api/resource-management/requisitions — response.health.go.ug
          </div>
          <div className={styles.toolbarStatus}>
            {query.isLoading
              ? "Loading…"
              : query.isError
                ? "Failed to load"
                : `${requisitions.length} requisition${requisitions.length !== 1 ? "s" : ""} · ${filtered.length} shown`}
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <button
            className={styles.secondaryButton}
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            type="button"
          >
            {query.isFetching ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => {
              setShowForm((v) => !v);
              setSuccessMessage(null);
              setEditingId(null);
              setForm(emptyForm);
              createMutation.reset();
              updateMutation.reset();
            }}
            type="button"
          >
            {showForm ? "Cancel" : "+ New Requisition"}
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMessage ? (
        <div className={styles.successBanner}>{successMessage}</div>
      ) : null}

      {/* Create form */}
      {showForm ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <p className={styles.formTitle}>{editingId ? "Edit Requisition" : "New Requisition"}</p>
            {mutationError ? <div className={styles.errorBanner}>{mutationError}</div> : null}
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-number">
                    Requisition Number
                  </label>
                  <input
                    className={styles.fieldInput}
                    id="req-number"
                    onChange={(e) => handleFieldChange("requisition_number", e.target.value)}
                    placeholder="REQ-2025-001"
                    required
                    type="text"
                    value={form.requisition_number}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-deployment-id">
                    Deployment ID
                  </label>
                  <input
                    className={styles.fieldInput}
                    id="req-deployment-id"
                    min="0"
                    onChange={(e) => handleFieldChange("deployment_id", Number(e.target.value))}
                    required
                    type="number"
                    value={form.deployment_id}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-outbreak-id">
                    Outbreak
                  </label>
                  <select
                    className={styles.fieldSelect}
                    id="req-outbreak-id"
                    onChange={(e) => handleFieldChange("outbreak_id", Number(e.target.value))}
                    required
                    value={form.outbreak_id || ""}
                  >
                    <option value="" disabled>Select Outbreak</option>
                    {outbreaksQuery.data?.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name?.String || `Outbreak #${o.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-requested-by">
                    Requested By
                  </label>
                  <select
                    className={styles.fieldSelect}
                    id="req-requested-by"
                    onChange={(e) => handleFieldChange("requested_by", Number(e.target.value))}
                    required
                    value={form.requested_by || ""}
                  >
                    <option value="" disabled>Select User</option>
                    {usersQuery.data?.users?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-required-date">
                    Required Date
                  </label>
                  <input
                    className={styles.fieldInput}
                    id="req-required-date"
                    onChange={(e) => handleFieldChange("required_date", e.target.value)}
                    required
                    type="date"
                    value={form.required_date}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-priority">
                    Priority
                  </label>
                  <select
                    className={styles.fieldSelect}
                    id="req-priority"
                    onChange={(e) => handleFieldChange("priority", e.target.value)}
                    value={form.priority}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="req-status">
                    Status
                  </label>
                  <select
                    className={styles.fieldSelect}
                    id="req-status"
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    value={form.status}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                  <label className={styles.fieldLabel} htmlFor="req-notes">
                    Notes
                  </label>
                  <textarea
                    className={styles.fieldTextarea}
                    id="req-notes"
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    placeholder="Enter any notes or description…"
                    value={form.notes}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.primaryButton}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  type="submit"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Submitting…" : (editingId ? "Update Requisition" : "Submit Requisition")}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                    createMutation.reset();
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Details modal */}
      {viewingRequisition ? (
        <div className={styles.modalOverlay} onClick={() => setViewingRequisition(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <p className={styles.formTitle}>Requisition Details</p>
            <div className={styles.detailsGrid}>
              <span className={styles.detailsLabel}>ID</span>
              <span className={styles.detailsValue}>{viewingRequisition.id}</span>

              <span className={styles.detailsLabel}>Requisition Number</span>
              <span className={styles.detailsValue}>{viewingRequisition.requisition_number}</span>

              <span className={styles.detailsLabel}>Status</span>
              <span className={styles.detailsValue}>
                <span className={[styles.statusPill, getStatusClass(viewingRequisition.status)].join(" ")}>
                  {viewingRequisition.status}
                </span>
              </span>

              <span className={styles.detailsLabel}>Priority</span>
              <span className={styles.detailsValue}>
                <span className={getPriorityClass(viewingRequisition.priority)}>{viewingRequisition.priority}</span>
              </span>

              <span className={styles.detailsLabel}>Outbreak</span>
              <span className={styles.detailsValue}>
                {outbreaksQuery.data?.find((o) => o.id === viewingRequisition.outbreak_id)?.name?.String || `ID: ${viewingRequisition.outbreak_id}`}
              </span>

              <span className={styles.detailsLabel}>Deployment ID</span>
              <span className={styles.detailsValue}>{viewingRequisition.deployment_id.Valid ? viewingRequisition.deployment_id.Int64 : "—"}</span>

              <span className={styles.detailsLabel}>Requested By</span>
              <span className={styles.detailsValue}>
                {(() => {
                  const u = usersQuery.data?.users?.find((u) => u.id === viewingRequisition.requested_by);
                  return u ? `${u.first_name} ${u.last_name} (${u.username})` : `User #${viewingRequisition.requested_by}`;
                })()}
              </span>

              <span className={styles.detailsLabel}>Required Date</span>
              <span className={styles.detailsValue}>{viewingRequisition.required_date.Valid ? viewingRequisition.required_date.Time.split("T")[0] : "—"}</span>

              <span className={styles.detailsLabel}>Created At</span>
              <span className={styles.detailsValue}>{new Date(viewingRequisition.created_at).toLocaleString()}</span>

              <div className={styles.detailsNotes}>
                <strong>Notes:</strong>
                <div style={{ marginTop: "6px" }}>
                  {viewingRequisition.notes.String || "No notes recorded."}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.primaryButton}
                onClick={() => handleEdit(viewingRequisition)}
                type="button"
              >
                Edit Requisition
              </button>
              <button
                className={styles.dangerButton}
                disabled={deleteMutation.isPending}
                onClick={() => {
                  handleDelete(viewingRequisition.id);
                  setViewingRequisition(null);
                }}
                type="button"
              >
                Delete Requisition
              </button>
              <button className={styles.secondaryButton} onClick={() => setViewingRequisition(null)} type="button">
                Close Window
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="req-search">
            Search
          </label>
          <input
            className={styles.fieldInput}
            id="req-search"
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Number, status, notes…"
            type="search"
            value={searchValue}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="req-status-filter">
            Status
          </label>
          <select
            className={styles.fieldSelect}
            id="req-status-filter"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {(searchValue || statusFilter !== "all") ? (
          <button className={styles.secondaryButton} onClick={handleReset} type="button">
            Reset
          </button>
        ) : null}
      </div>

      {/* Load error */}
      {!query.isLoading && query.isError ? (
        <div className={styles.errorBanner}>
          The requisitions list could not be loaded. Please refresh or try again later.
        </div>
      ) : null}

      {/* Table */}
      <p className={styles.sectionTitle}>Requisition Records</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Requisition #</th>
              <th scope="col">Outbreak ID</th>
              <th scope="col">Deployment ID</th>
              <th scope="col">Requested By</th>
              <th scope="col">Required Date</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Notes</th>
              <th className={styles.actionsHeader} scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td className={styles.stateMessage} colSpan={10}>Loading requisitions…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={styles.stateMessage} colSpan={10}>
                  {requisitions.length === 0
                    ? "No requisitions found."
                    : "No requisitions match the current filters."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.requisition_number}</td>
                  <td>{r.outbreak_id}</td>
                  <td>{r.deployment_id.Valid ? r.deployment_id.Int64 : "—"}</td>
                  <td>{r.requested_by}</td>
                  <td>{r.required_date.Valid ? r.required_date.Time.split("T")[0] : "—"}</td>
                  <td>
                    <span className={getPriorityClass(r.priority)}>{r.priority}</span>
                  </td>
                  <td>
                    <span className={[styles.statusPill, getStatusClass(r.status)].join(" ")}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.notes.String}</td>
                  <td className={styles.actionsCell}>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                      <button
                        className={styles.smallAction}
                        onClick={() => setViewingRequisition(r)}
                        type="button"
                      >
                        Details
                      </button>
                      <button
                        className={styles.smallAction}
                        onClick={() => handleEdit(r)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={styles.smallAction}
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(r.id)}
                        style={{ color: "#8f2f2f" }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
