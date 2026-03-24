"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useActivityLogs } from "@/src/features/resource-management/hooks/use-activity-logs";
import { useCreateActivityLog } from "@/src/features/resource-management/hooks/use-create-activity-log";
import { useUpdateActivityLog } from "@/src/features/resource-management/hooks/use-update-activity-log";
import { useDeleteActivityLog } from "@/src/features/resource-management/hooks/use-delete-activity-log";
import { ResourceManagementRequestError } from "@/src/features/resource-management/lib/resource-management-client";
import type {
  ActivityLogRecord,
  ActivityLogWritePayload
} from "@/src/features/resource-management/types/resource-management";
import styles from "./resources-workspace.module.css";
import ownStyles from "./activity-logs-workspace.module.css";

interface ActivityLogFormState {
  deploymentId: string;
  activityDate: string;
  activityType: string;
  activityDescription: string;
  location: string;
  startTime: string;
  endTime: string;
  participantsCount: string;
  resourcesUsed: string;
  challenges: string;
  outcomes: string;
  recommendations: string;
}

const INITIAL_FORM: ActivityLogFormState = {
  deploymentId: "",
  activityDate: "",
  activityType: "",
  activityDescription: "",
  location: "",
  startTime: "",
  endTime: "",
  participantsCount: "",
  resourcesUsed: "",
  challenges: "",
  outcomes: "",
  recommendations: ""
};

function createFormState(log: ActivityLogRecord): ActivityLogFormState {
  const participants = readInt(log.participants_count);
  return {
    deploymentId: `${readInt(log.deployment_id) ?? ""}`,
    activityDate: readStr(log.activity_date),
    activityType: readStr(log.activity_type),
    activityDescription: readStr(log.activity_description),
    location: readStr(log.location),
    startTime: readTime(log.start_time),
    endTime: readTime(log.end_time),
    participantsCount: participants != null ? `${participants}` : "",
    resourcesUsed: readStr(log.resources_used),
    challenges: readStr(log.challenges),
    outcomes: readStr(log.outcomes),
    recommendations: readStr(log.recommendations)
  };
}

function buildPayload(form: ActivityLogFormState): ActivityLogWritePayload {
  return {
    deployment_id: Number(form.deploymentId.trim()) || 0,
    activity_date: form.activityDate.trim(),
    activity_type: form.activityType.trim(),
    activity_description: form.activityDescription.trim(),
    location: form.location.trim(),
    start_time: form.startTime.trim(),
    end_time: form.endTime.trim(),
    participants_count: Number(form.participantsCount.trim()) || 0,
    resources_used: form.resourcesUsed.trim(),
    challenges: form.challenges.trim(),
    outcomes: form.outcomes.trim(),
    recommendations: form.recommendations.trim()
  };
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ResourceManagementRequestError) return error.message;
  return fallback;
}

/** Handles both plain strings and nullable Go SQL values { String, Valid }. */
function readStr(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "Valid" in (value as object) && "String" in (value as object)) {
    const v = value as { String: string; Valid: boolean };
    return v.Valid ? v.String : "";
  }
  return String(value);
}

/** Same for nullable integer fields { Int64, Valid }. */
function readInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "Valid" in (value as object) && "Int64" in (value as object)) {
    const v = value as { Int64: number; Valid: boolean };
    return v.Valid ? v.Int64 : null;
  }
  return null;
}

/** Extracts HH:MM from nullable time fields { Time: "0000-01-01T07:32:00Z", Valid }. */
function readTime(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const m = value.match(/T(\d{2}:\d{2})/);
    return m ? m[1] : value;
  }
  if (typeof value === "object" && "Valid" in (value as object) && "Time" in (value as object)) {
    const v = value as { Time: string; Valid: boolean };
    if (!v.Valid) return "";
    const m = v.Time.match(/T(\d{2}:\d{2})/);
    return m ? m[1] : "";
  }
  return "";
}

function formatDate(value: unknown): string {
  const s = readStr(value);
  if (!s || s === "0001-01-01" || s.startsWith("0001-01-01T")) return "—";
  return s.slice(0, 10);
}

function formatDateTime(value: unknown): string {
  const s = readStr(value);
  if (!s || s === "0001-01-01T00:00:00Z") return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function ActivityLogsWorkspace() {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingLog, setEditingLog] = useState<ActivityLogRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityLogRecord | null>(null);
  const [formState, setFormState] = useState<ActivityLogFormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const logsQuery = useActivityLogs();
  const createMutation = useCreateActivityLog();
  const updateMutation = useUpdateActivityLog();
  const deleteMutation = useDeleteActivityLog();

  const logs = logsQuery.data?.activity_logs ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredLogs = logs.filter((log) => {
    if (!normalizedSearch) return true;
    return [
      readStr(log.activity_type),
      readStr(log.activity_description),
      readStr(log.location),
      readStr(log.activity_date)
    ].some((v) => v.toLowerCase().includes(normalizedSearch));
  });

  const isModalOpen = isCreateOpen || Boolean(editingLog);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeMutationError =
    formError ??
    (createMutation.isError
      ? getMutationErrorMessage(createMutation.error, "The activity log could not be created.")
      : updateMutation.isError
        ? getMutationErrorMessage(updateMutation.error, "The activity log could not be updated.")
        : null);
  const deleteError = deleteMutation.isError
    ? getMutationErrorMessage(deleteMutation.error, "The activity log could not be deleted.")
    : null;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("[data-actions-menu]")) setOpenMenuId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenMenuId(null);
      setIsCreateOpen(false);
      setEditingLog(null);
      setDeleteTarget(null);
      setFormError(null);
      setFormState(INITIAL_FORM);
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

  function openCreateModal() {
    setOpenMenuId(null);
    setEditingLog(null);
    setIsCreateOpen(true);
    setFormState(INITIAL_FORM);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(log: ActivityLogRecord) {
    setOpenMenuId(null);
    setIsCreateOpen(false);
    setEditingLog(log);
    setFormState(createFormState(log));
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function closeFormModal() {
    setOpenMenuId(null);
    setIsCreateOpen(false);
    setEditingLog(null);
    setFormState(INITIAL_FORM);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function updateField<K extends keyof ActivityLogFormState>(key: K, value: ActivityLogFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
    if (formError) setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildPayload(formState);

    if (!payload.activity_date) {
      setFormError("Activity date is required.");
      return;
    }

    if (!payload.activity_type) {
      setFormError("Activity type is required.");
      return;
    }

    if (editingLog) {
      await updateMutation.mutateAsync({ id: editingLog.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    closeFormModal();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setOpenMenuId(null);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          name="activity-log-search"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by type, description, location, or date"
          value={search}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Activity Log
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Logs</div>
          <div className={styles.summaryValue}>{logs.length}</div>
          <p className={styles.summaryNote}>All activity logs from `/api/resource-management/activity-logs`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Showing</div>
          <div className={styles.summaryValue}>{filteredLogs.length}</div>
          <p className={styles.summaryNote}>Filtered by current search term.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Deployments</div>
          <div className={styles.summaryValue}>
            {new Set(logs.map((l) => readInt(l.deployment_id)).filter(Boolean)).size}
          </div>
          <p className={styles.summaryNote}>Distinct deployments referenced in logged activities.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Participants</div>
          <div className={styles.summaryValue}>
            {logs.reduce((sum, l) => sum + (readInt(l.participants_count) ?? 0), 0)}
          </div>
          <p className={styles.summaryNote}>Total participant count across all logged activities.</p>
        </article>
      </div>

      {logsQuery.isError ? (
        <div className={styles.errorBanner}>
          {getMutationErrorMessage(logsQuery.error, "The activity logs could not be loaded.")}
        </div>
      ) : null}

      <div className={ownStyles.tableOuter}>
      <div className={ownStyles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Type</th>
              <th scope="col">Description</th>
              <th scope="col">Location</th>
              <th scope="col">Time</th>
              <th scope="col">Participants</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logsQuery.isLoading ? (
              <tr>
                <td colSpan={8}>Loading activity logs...</td>
              </tr>
            ) : filteredLogs.length ? (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.activity_date)}</td>
                  <td>{readStr(log.activity_type) || "—"}</td>
                  <td>{readStr(log.activity_description) || "—"}</td>
                  <td>{readStr(log.location) || "—"}</td>
                  <td>
                    {readTime(log.start_time) && readTime(log.end_time)
                      ? `${readTime(log.start_time)} – ${readTime(log.end_time)}`
                      : readTime(log.start_time) || "—"}
                  </td>
                  <td>{readInt(log.participants_count) ?? "—"}</td>
                  <td>{formatDateTime(log.updated_at)}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuId === log.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuId((current) => (current === log.id ? null : log.id))
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

                      {openMenuId === log.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(log)}
                            type="button"
                          >
                            Edit log
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeleteTarget(log);
                            }}
                            type="button"
                          >
                            Delete log
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyState} colSpan={8}>
                  No activity logs match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="activity-log-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="activity-log-modal-title">
                  {editingLog ? "Edit Activity Log" : "Create Activity Log"}
                </h2>
                <p className={styles.modalText}>
                  Record field activity details including type, participants, resources used,
                  challenges encountered, and recommendations.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Activity Date</span>
                    <input
                      name="activityDate"
                      onChange={(e) => updateField("activityDate", e.target.value)}
                      placeholder="2025-03-01"
                      type="date"
                      value={formState.activityDate}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Activity Type</span>
                    <input
                      name="activityType"
                      onChange={(e) => updateField("activityType", e.target.value)}
                      placeholder="e.g. investigation"
                      value={formState.activityType}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Deployment ID</span>
                    <input
                      inputMode="numeric"
                      name="deploymentId"
                      onChange={(e) => updateField("deploymentId", e.target.value)}
                      value={formState.deploymentId}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Location</span>
                    <input
                      name="location"
                      onChange={(e) => updateField("location", e.target.value)}
                      value={formState.location}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Start Time</span>
                    <input
                      name="startTime"
                      onChange={(e) => updateField("startTime", e.target.value)}
                      placeholder="09:00"
                      type="time"
                      value={formState.startTime}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>End Time</span>
                    <input
                      name="endTime"
                      onChange={(e) => updateField("endTime", e.target.value)}
                      placeholder="17:00"
                      type="time"
                      value={formState.endTime}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Participants Count</span>
                    <input
                      inputMode="numeric"
                      name="participantsCount"
                      onChange={(e) => updateField("participantsCount", e.target.value)}
                      value={formState.participantsCount}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Resources Used</span>
                    <input
                      name="resourcesUsed"
                      onChange={(e) => updateField("resourcesUsed", e.target.value)}
                      value={formState.resourcesUsed}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>Activity Description</span>
                    <textarea
                      name="activityDescription"
                      onChange={(e) => updateField("activityDescription", e.target.value)}
                      value={formState.activityDescription}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>Challenges</span>
                    <textarea
                      name="challenges"
                      onChange={(e) => updateField("challenges", e.target.value)}
                      value={formState.challenges}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>Outcomes</span>
                    <textarea
                      name="outcomes"
                      onChange={(e) => updateField("outcomes", e.target.value)}
                      value={formState.outcomes}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>Recommendations</span>
                    <textarea
                      name="recommendations"
                      onChange={(e) => updateField("recommendations", e.target.value)}
                      value={formState.recommendations}
                    />
                  </label>
                </div>

                {activeMutationError ? (
                  <p className={styles.inlineError}>{activeMutationError}</p>
                ) : null}
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.secondaryButton}
                  onClick={closeFormModal}
                  type="button"
                >
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingLog ? "Save Changes" : "Create Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="activity-log-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="activity-log-delete-title">
                  Delete Activity Log
                </h2>
                <p className={styles.modalText}>
                  Remove the{" "}
                  <strong>{readStr(deleteTarget.activity_type) || `log #${deleteTarget.id}`}</strong>{" "}
                  entry from {formatDate(deleteTarget.activity_date)}.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This calls `DELETE /api/resource-management/activity-logs/{deleteTarget.id}` and
                cannot be undone.
              </p>
              {deleteError ? <p className={styles.inlineError}>{deleteError}</p> : null}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setDeleteTarget(null);
                  deleteMutation.reset();
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                disabled={deleteMutation.isPending}
                onClick={confirmDelete}
                type="button"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Log"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
