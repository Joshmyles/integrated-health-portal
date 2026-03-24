"use client";

import { useEffect, useState } from "react";
import { useCreateRrtDeployment } from "@/src/features/portal/hooks/use-create-rrt-deployment";
import { useDeleteRrtDeployment } from "@/src/features/portal/hooks/use-delete-rrt-deployment";
import { useUpdateRrtDeployment } from "@/src/features/portal/hooks/use-update-rrt-deployment";
import type { PortalRrtDeploymentEntry } from "@/src/features/portal/types/portal";
import styles from "./rrt-deployments-management-workspace.module.css";

interface RrtDeploymentsManagementWorkspaceProps {
  deployments: PortalRrtDeploymentEntry[];
  title: string;
}

interface RrtDeploymentFormState {
  actual_return_date: string;
  assigned_driver: string;
  assigned_vehicle: string;
  deployment_date: string;
  deployment_notes: string;
  deployment_purpose: string;
  deployment_status: string;
  expected_return_date: string;
  outbreak_id: string;
  team_id: string;
}

const INITIAL_FORM_STATE: RrtDeploymentFormState = {
  actual_return_date: "",
  assigned_driver: "",
  assigned_vehicle: "",
  deployment_date: "",
  deployment_notes: "",
  deployment_purpose: "",
  deployment_status: "",
  expected_return_date: "",
  outbreak_id: "",
  team_id: ""
};

function toDateInputValue(value: string) {
  return value && value !== "Not set" ? value.slice(0, 10) : "";
}

function getStatusClassName(status: string) {
  return status.toLowerCase() === "deployed" ? styles.statusActive : styles.statusInactive;
}

export function RrtDeploymentsManagementWorkspace({
  deployments,
  title
}: RrtDeploymentsManagementWorkspaceProps) {
  const createMutation = useCreateRrtDeployment();
  const deleteMutation = useDeleteRrtDeployment();
  const updateMutation = useUpdateRrtDeployment();

  const [searchValue, setSearchValue] = useState("");
  const [openMenuDeploymentId, setOpenMenuDeploymentId] = useState<number | null>(null);
  const [editingDeployment, setEditingDeployment] = useState<PortalRrtDeploymentEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortalRrtDeploymentEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<RrtDeploymentFormState>(INITIAL_FORM_STATE);

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredDeployments = deployments.filter((deployment) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      `${deployment.id}`,
      deployment.teamName,
      `${deployment.teamId}`,
      deployment.outbreakName,
      `${deployment.outbreakId}`,
      deployment.status,
      deployment.assignedVehicle,
      deployment.assignedDriver,
      deployment.purpose,
      deployment.notes
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const activeCount = deployments.filter(
    (deployment) => deployment.status.toLowerCase() === "deployed"
  ).length;
  const vehiclesAssigned = deployments.filter(
    (deployment) => deployment.assignedVehicle !== "Not set"
  ).length;
  const actualReturnsLogged = deployments.filter(
    (deployment) => deployment.actualReturnDate !== "Not set"
  ).length;

  const isModalOpen = isCreateOpen || Boolean(editingDeployment);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const deleteError =
    deleteMutation.isError && deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : null;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuDeploymentId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuDeploymentId(null);
      setIsCreateOpen(false);
      setEditingDeployment(null);
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

  function openCreateModal() {
    setOpenMenuDeploymentId(null);
    setEditingDeployment(null);
    setIsCreateOpen(true);
    setFormError(null);
    setStatusMessage(null);
    setFormState(INITIAL_FORM_STATE);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(deployment: PortalRrtDeploymentEntry) {
    setOpenMenuDeploymentId(null);
    setIsCreateOpen(false);
    setEditingDeployment(deployment);
    setFormError(null);
    setStatusMessage(null);
    setFormState({
      actual_return_date: toDateInputValue(deployment.actualReturnDate),
      assigned_driver: deployment.assignedDriver === "Not set" ? "" : deployment.assignedDriver,
      assigned_vehicle:
        deployment.assignedVehicle === "Not set" ? "" : deployment.assignedVehicle,
      deployment_date: toDateInputValue(deployment.deploymentDate),
      deployment_notes: deployment.notes === "Not set" ? "" : deployment.notes,
      deployment_purpose: deployment.purpose === "Not set" ? "" : deployment.purpose,
      deployment_status: deployment.status === "Not set" ? "" : deployment.status,
      expected_return_date: toDateInputValue(deployment.expectedReturnDate),
      outbreak_id: `${deployment.outbreakId}`,
      team_id: `${deployment.teamId}`
    });
    createMutation.reset();
    updateMutation.reset();
  }

  function closeFormModal() {
    setOpenMenuDeploymentId(null);
    setIsCreateOpen(false);
    setEditingDeployment(null);
    setFormError(null);
    setFormState(INITIAL_FORM_STATE);
    createMutation.reset();
    updateMutation.reset();
  }

  function updateFormField<Key extends keyof RrtDeploymentFormState>(
    key: Key,
    value: RrtDeploymentFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));

    if (formError) {
      setFormError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    const teamId = Number(formState.team_id);
    const outbreakId = Number(formState.outbreak_id);

    if (!Number.isInteger(teamId) || teamId < 1 || !Number.isInteger(outbreakId) || outbreakId < 1) {
      setFormError("Team ID and outbreak ID must be whole numbers.");
      return;
    }

    if (!formState.deployment_date || !formState.deployment_status.trim()) {
      setFormError("Deployment date and status are required.");
      return;
    }

    const payload = {
      actual_return_date: formState.actual_return_date || undefined,
      assigned_driver: formState.assigned_driver.trim() || undefined,
      assigned_vehicle: formState.assigned_vehicle.trim() || undefined,
      deployment_date: formState.deployment_date,
      deployment_notes: formState.deployment_notes.trim() || undefined,
      deployment_purpose: formState.deployment_purpose.trim() || undefined,
      deployment_status: formState.deployment_status.trim(),
      expected_return_date: formState.expected_return_date || undefined,
      outbreak_id: outbreakId,
      team_id: teamId
    };

    try {
      if (editingDeployment) {
        await updateMutation.mutateAsync({
          deploymentId: editingDeployment.id,
          payload
        });
        setStatusMessage(`RRT deployment ${editingDeployment.id} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage("RRT deployment created successfully.");
      }

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : editingDeployment
            ? "The deployment could not be updated."
            : "The deployment could not be created."
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync(deleteTarget.id);
    setStatusMessage(`RRT deployment ${deleteTarget.id} deleted successfully.`);
    setOpenMenuDeploymentId(null);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.toolbarCopy}>
            Track live field assignments with the same focused workflow used across deployment management.
          </p>
        </div>
        <input
          className={styles.searchInput}
          name="deployment-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search deployments, teams, outbreaks, vehicles, or status"
          value={searchValue}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Deployment
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Deployments</div>
          <div className={styles.summaryValue}>{deployments.length}</div>
          <p className={styles.summaryNote}>Live rows from `/api/resource-management/rrt-deployments`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Currently Deployed</div>
          <div className={styles.summaryValue}>{activeCount}</div>
          <p className={styles.summaryNote}>Deployments currently marked as deployed.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Vehicles Assigned</div>
          <div className={styles.summaryValue}>{vehiclesAssigned}</div>
          <p className={styles.summaryNote}>Deployments with a linked vehicle.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Returns Logged</div>
          <div className={styles.summaryValue}>{actualReturnsLogged}</div>
          <p className={styles.summaryNote}>Deployments with an actual return date recorded.</p>
        </article>
      </div>

      {createMutation.isError || updateMutation.isError || deleteMutation.isError ? (
        <div className={styles.errorBanner}>
          {formError ??
            (createMutation.error instanceof Error
              ? createMutation.error.message
              : updateMutation.error instanceof Error
                ? updateMutation.error.message
                : deleteMutation.error instanceof Error
                  ? deleteMutation.error.message
                  : "The deployment request could not be completed.")}
        </div>
      ) : null}

      {statusMessage ? <div className={styles.statusRow}>{statusMessage}</div> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Deployment</th>
              <th scope="col">Team</th>
              <th scope="col">Outbreak</th>
              <th scope="col">Deployment Date</th>
              <th scope="col">Expected Return</th>
              <th scope="col">Actual Return</th>
              <th scope="col">Status</th>
              <th scope="col">Vehicle / Driver</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeployments.length ? (
              filteredDeployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td>#{deployment.id}</td>
                  <td>
                    {deployment.teamName}
                    <br />
                    Team ID: {deployment.teamId}
                  </td>
                  <td>
                    {deployment.outbreakName}
                    <br />
                    Outbreak ID: {deployment.outbreakId}
                  </td>
                  <td>{deployment.deploymentDate}</td>
                  <td>{deployment.expectedReturnDate}</td>
                  <td>{deployment.actualReturnDate}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClassName(deployment.status)}`}>
                      {deployment.status}
                    </span>
                  </td>
                  <td>
                    {deployment.assignedVehicle}
                    {deployment.assignedDriver !== "Not set"
                      ? ` / ${deployment.assignedDriver}`
                      : ""}
                  </td>
                  <td>{deployment.updatedAt}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuDeploymentId === deployment.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuDeploymentId((current) =>
                            current === deployment.id ? null : deployment.id
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

                      {openMenuDeploymentId === deployment.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(deployment)}
                            type="button"
                          >
                            Edit deployment
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuDeploymentId(null);
                              setDeleteTarget(deployment);
                            }}
                            type="button"
                          >
                            Delete deployment
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
                  No deployments match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="rrt-deployments-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="rrt-deployments-modal-title">
                  {editingDeployment ? "Edit Deployment" : "Create Deployment"}
                </h2>
                <p className={styles.modalText}>
                  This form sends the full deployment write payload expected by the upstream
                  resource-management service.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Team ID</span>
                    <input
                      onChange={(event) => updateFormField("team_id", event.target.value)}
                      type="number"
                      value={formState.team_id}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Outbreak ID</span>
                    <input
                      onChange={(event) => updateFormField("outbreak_id", event.target.value)}
                      type="number"
                      value={formState.outbreak_id}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Deployment Date</span>
                    <input
                      onChange={(event) => updateFormField("deployment_date", event.target.value)}
                      type="date"
                      value={formState.deployment_date}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Status</span>
                    <input
                      onChange={(event) => updateFormField("deployment_status", event.target.value)}
                      type="text"
                      value={formState.deployment_status}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Expected Return</span>
                    <input
                      onChange={(event) =>
                        updateFormField("expected_return_date", event.target.value)
                      }
                      type="date"
                      value={formState.expected_return_date}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Actual Return</span>
                    <input
                      onChange={(event) =>
                        updateFormField("actual_return_date", event.target.value)
                      }
                      type="date"
                      value={formState.actual_return_date}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Purpose</span>
                    <input
                      onChange={(event) =>
                        updateFormField("deployment_purpose", event.target.value)
                      }
                      type="text"
                      value={formState.deployment_purpose}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Vehicle</span>
                    <input
                      onChange={(event) => updateFormField("assigned_vehicle", event.target.value)}
                      type="text"
                      value={formState.assigned_vehicle}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Driver</span>
                    <input
                      onChange={(event) => updateFormField("assigned_driver", event.target.value)}
                      type="text"
                      value={formState.assigned_driver}
                    />
                  </label>
                  <label className={styles.fieldWide}>
                    <span>Notes</span>
                    <textarea
                      onChange={(event) => updateFormField("deployment_notes", event.target.value)}
                      value={formState.deployment_notes}
                    />
                  </label>
                </div>

                <p className={styles.helperText}>
                  Team and outbreak links are stored by ID so the deployment stays tied to the
                  current roster and outbreak register.
                </p>

                {formError ? <p className={styles.inlineError}>{formError}</p> : null}
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={closeFormModal} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingDeployment ? "Save Changes" : "Create Deployment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="rrt-deployments-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="rrt-deployments-delete-title">
                  Delete Deployment
                </h2>
                <p className={styles.modalText}>
                  Remove deployment <strong>#{deleteTarget.id}</strong> from the resource-management
                  deployment list.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This action calls `DELETE /api/resource-management/rrt-deployments/{deleteTarget.id}`.
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
                onClick={() => {
                  void confirmDelete();
                }}
                type="button"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Deployment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
