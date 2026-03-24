"use client";

import { useState } from "react";
import { useCreateRrtTeam } from "@/src/features/portal/hooks/use-create-rrt-team";
import { useDeleteRrtTeam } from "@/src/features/portal/hooks/use-delete-rrt-team";
import { useUpdateRrtTeam } from "@/src/features/portal/hooks/use-update-rrt-team";
import type { PortalRrtTeamEntry } from "@/src/features/portal/types/portal";
import styles from "./portal-shell.module.css";

interface RrtTeamsManagementWorkspaceProps {
  teams: PortalRrtTeamEntry[];
  title: string;
}

interface RrtTeamFormState {
  base_location: string;
  is_active: boolean;
  specializations: string;
  team_code: string;
  team_lead_email: string;
  team_lead_name: string;
  team_lead_phone: string;
  team_name: string;
  team_size: string;
  team_type: string;
}

const INITIAL_FORM_STATE: RrtTeamFormState = {
  base_location: "",
  is_active: true,
  specializations: "",
  team_code: "",
  team_lead_email: "",
  team_lead_name: "",
  team_lead_phone: "",
  team_name: "",
  team_size: "",
  team_type: ""
};

export function RrtTeamsManagementWorkspace({
  teams,
  title
}: RrtTeamsManagementWorkspaceProps) {
  const createMutation = useCreateRrtTeam();
  const deleteMutation = useDeleteRrtTeam();
  const updateMutation = useUpdateRrtTeam();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<RrtTeamFormState>(INITIAL_FORM_STATE);

  function openCreateModal() {
    setEditingTeamId(null);
    setFormError(null);
    setStatusMessage(null);
    setFormState(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  }

  function openEditModal(team: PortalRrtTeamEntry) {
    setEditingTeamId(team.id);
    setFormError(null);
    setStatusMessage(null);
    setFormState({
      base_location: team.baseLocation === "Not set" ? "" : team.baseLocation,
      is_active: team.isActive === "Active",
      specializations: team.specializations === "Not set" ? "" : team.specializations,
      team_code: team.code === "Not set" ? "" : team.code,
      team_lead_email: team.leadEmail === "Not set" ? "" : team.leadEmail,
      team_lead_name: team.leadName === "Not set" ? "" : team.leadName,
      team_lead_phone: team.leadPhone === "Not set" ? "" : team.leadPhone,
      team_name: team.name === "Not set" ? "" : team.name,
      team_size: team.size === "Not set" ? "" : team.size,
      team_type: team.type === "Not set" ? "" : team.type
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTeamId(null);
    setFormError(null);
    setFormState(INITIAL_FORM_STATE);
  }

  async function handleSubmit() {
    setFormError(null);
    setStatusMessage(null);

    const teamSize = Number(formState.team_size);

    if (!editingTeamId) {
      setFormError("A team must be selected for update.");
      return;
    }

    if (!formState.team_name.trim() || !formState.team_code.trim() || !formState.team_type.trim()) {
      setFormError("Team name, code, and type are required.");
      return;
    }

    if (!Number.isInteger(teamSize) || teamSize < 0) {
      setFormError("Team size must be a whole number.");
      return;
    }

    const payload = {
      base_location: formState.base_location.trim() || undefined,
      is_active: formState.is_active,
      specializations: formState.specializations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      team_code: formState.team_code.trim(),
      team_lead_email: formState.team_lead_email.trim() || undefined,
      team_lead_name: formState.team_lead_name.trim(),
      team_lead_phone: formState.team_lead_phone.trim() || undefined,
      team_name: formState.team_name.trim(),
      team_size: teamSize,
      team_type: formState.team_type.trim()
    };

    try {
      if (editingTeamId) {
        const response = await updateMutation.mutateAsync({
          teamId: editingTeamId,
          payload
        });
        setStatusMessage(response.message ?? `RRT team ${editingTeamId} updated successfully.`);
      } else {
        const response = await createMutation.mutateAsync(payload);
        setStatusMessage(response.message ?? "RRT team created successfully.");
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : editingTeamId
            ? "The team could not be updated."
            : "The team could not be created."
      );
    }
  }

  async function handleDelete(teamId: number) {
    setStatusMessage(null);

    const shouldDelete = window.confirm(
      `Delete RRT team ${teamId}? This action cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await deleteMutation.mutateAsync(teamId);
      setStatusMessage(response.message ?? "deleted");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "The team could not be deleted.");
    }
  }

  return (
    <section className={styles.employeeManagementWorkspace}>
      <section className={styles.dataSection}>
        <div className={styles.employeeToolbar}>
          <div>
            <h2 className={styles.plainSectionTitle}>{title}</h2>
            <p className={styles.dataTableCaption}>
              Live RRT team records with row-level update and delete actions.
            </p>
          </div>
          <button
            className={styles.employeeSubmitButton}
            onClick={openCreateModal}
            type="button"
          >
            Create Team
          </button>
        </div>

        {statusMessage ? <div className={styles.statusMessage}>{statusMessage}</div> : null}

        <div className={styles.employeeTableViewport}>
          <div className={styles.dataTableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col">Code</th>
                  <th scope="col">Type</th>
                  <th scope="col">Lead</th>
                  <th scope="col">Lead Phone</th>
                  <th scope="col">Lead Email</th>
                  <th scope="col">Members</th>
                  <th scope="col">Specializations</th>
                  <th scope="col">Base Location</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created By</th>
                  <th scope="col">Updated</th>
                  <th className={styles.employeeActionsHeader} scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td>{team.code}</td>
                    <td>{team.type}</td>
                    <td>{team.leadName}</td>
                    <td>{team.leadPhone}</td>
                    <td>{team.leadEmail}</td>
                    <td>{team.size}</td>
                    <td>{team.specializations}</td>
                    <td>{team.baseLocation}</td>
                    <td>{team.isActive}</td>
                    <td>{team.createdBy}</td>
                    <td>{team.updatedAt}</td>
                    <td className={styles.employeeActionsCell}>
                      <div className={styles.employeeRowActions}>
                        <button
                          className={styles.employeeRowButton}
                          onClick={() => openEditModal(team)}
                          type="button"
                        >
                          Update
                        </button>
                        <button
                          className={styles.employeeDeleteButton}
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            void handleDelete(team.id);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className={styles.employeeModalBackdrop} onClick={closeModal} role="presentation">
          <section
            aria-modal="true"
            className={styles.employeeModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.employeeModalHeader}>
              <div>
                <h2 className={styles.plainSectionTitle}>
                  {editingTeamId ? `Edit RRT Team ${editingTeamId}` : "Create RRT Team"}
                </h2>
                <p className={styles.dataTableCaption}>
                  {editingTeamId
                    ? "Update the selected RRT team using the current resource-management team fields."
                    : "Create a new RRT team using the current resource-management team fields."}
                </p>
              </div>
              <button
                aria-label="Close RRT team form"
                className={styles.employeeModalClose}
                onClick={closeModal}
                type="button"
              >
                x
              </button>
            </div>

            {formError ? <div className={styles.errorMessage}>{formError}</div> : null}

            <div className={styles.employeeForm}>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Team Name</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_name: event.target.value }))}
                  type="text"
                  value={formState.team_name}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Team Code</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_code: event.target.value }))}
                  type="text"
                  value={formState.team_code}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Team Type</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_type: event.target.value }))}
                  type="text"
                  value={formState.team_type}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Lead Name</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_lead_name: event.target.value }))}
                  type="text"
                  value={formState.team_lead_name}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Lead Phone</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_lead_phone: event.target.value }))}
                  type="text"
                  value={formState.team_lead_phone}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Lead Email</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_lead_email: event.target.value }))}
                  type="email"
                  value={formState.team_lead_email}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Team Size</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, team_size: event.target.value }))}
                  type="number"
                  value={formState.team_size}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Specializations</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, specializations: event.target.value }))}
                  placeholder="Comma separated"
                  type="text"
                  value={formState.specializations}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Base Location</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => setFormState((current) => ({ ...current, base_location: event.target.value }))}
                  type="text"
                  value={formState.base_location}
                />
              </label>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Active</span>
                <select
                  className={styles.employeeFormInput}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      is_active: event.target.value === "true"
                    }))
                  }
                  value={formState.is_active ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>

            <div className={styles.employeeFormActions}>
              <button
                className={styles.employeeSecondaryButton}
                onClick={closeModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.employeeSubmitButton}
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  void handleSubmit();
                }}
                type="button"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingTeamId
                    ? "Update Team"
                    : "Create Team"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
