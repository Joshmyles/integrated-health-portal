"use client";

import { useEffect, useState } from "react";
import { useCreateRrtTeam } from "@/src/features/portal/hooks/use-create-rrt-team";
import { useDeleteRrtTeam } from "@/src/features/portal/hooks/use-delete-rrt-team";
import { useUpdateRrtTeam } from "@/src/features/portal/hooks/use-update-rrt-team";
import type { PortalRrtTeamEntry } from "@/src/features/portal/types/portal";
import styles from "./rrt-teams-management-workspace.module.css";

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

function getStatusClassName(status: string) {
  return status.toLowerCase() === "active" ? styles.statusActive : styles.statusInactive;
}

export function RrtTeamsManagementWorkspace({
  teams,
  title
}: RrtTeamsManagementWorkspaceProps) {
  const createMutation = useCreateRrtTeam();
  const deleteMutation = useDeleteRrtTeam();
  const updateMutation = useUpdateRrtTeam();

  const [searchValue, setSearchValue] = useState("");
  const [openMenuTeamId, setOpenMenuTeamId] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<PortalRrtTeamEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortalRrtTeamEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<RrtTeamFormState>(INITIAL_FORM_STATE);

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredTeams = teams.filter((team) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      team.name,
      team.code,
      team.type,
      team.leadName,
      team.leadPhone,
      team.leadEmail,
      team.specializations,
      team.baseLocation,
      team.isActive
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const activeTeams = teams.filter((team) => team.isActive === "Active").length;
  const teamsWithLeadPhone = teams.filter((team) => team.leadPhone !== "Not set").length;
  const teamsWithBaseLocation = teams.filter((team) => team.baseLocation !== "Not set").length;

  const isModalOpen = isCreateOpen || Boolean(editingTeam);
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
        setOpenMenuTeamId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuTeamId(null);
      setIsCreateOpen(false);
      setEditingTeam(null);
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
    setOpenMenuTeamId(null);
    setEditingTeam(null);
    setIsCreateOpen(true);
    setFormError(null);
    setStatusMessage(null);
    setFormState(INITIAL_FORM_STATE);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(team: PortalRrtTeamEntry) {
    setOpenMenuTeamId(null);
    setIsCreateOpen(false);
    setEditingTeam(team);
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
    createMutation.reset();
    updateMutation.reset();
  }

  function closeFormModal() {
    setOpenMenuTeamId(null);
    setIsCreateOpen(false);
    setEditingTeam(null);
    setFormError(null);
    setFormState(INITIAL_FORM_STATE);
    createMutation.reset();
    updateMutation.reset();
  }

  function updateFormField<Key extends keyof RrtTeamFormState>(
    key: Key,
    value: RrtTeamFormState[Key]
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

    const teamSize = Number(formState.team_size);

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
      if (editingTeam) {
        await updateMutation.mutateAsync({
          teamId: editingTeam.id,
          payload
        });
        setStatusMessage(`RRT team ${editingTeam.id} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage("RRT team created successfully.");
      }

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : editingTeam
            ? "The team could not be updated."
            : "The team could not be created."
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync(deleteTarget.id);
    setStatusMessage(`RRT team ${deleteTarget.id} deleted successfully.`);
    setOpenMenuTeamId(null);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.toolbarCopy}>
            Manage the live RRT roster with search, summary cards, and row-level actions.
          </p>
        </div>
        <input
          className={styles.searchInput}
          name="team-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search teams, leads, types, codes, or locations"
          value={searchValue}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Team
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Teams</div>
          <div className={styles.summaryValue}>{teams.length}</div>
          <p className={styles.summaryNote}>Live rows from `/api/resource-management/rrt-teams`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active Teams</div>
          <div className={styles.summaryValue}>{activeTeams}</div>
          <p className={styles.summaryNote}>Teams currently marked active.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Lead Phones Present</div>
          <div className={styles.summaryValue}>{teamsWithLeadPhone}</div>
          <p className={styles.summaryNote}>Teams with a populated lead phone number.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Base Locations Set</div>
          <div className={styles.summaryValue}>{teamsWithBaseLocation}</div>
          <p className={styles.summaryNote}>Teams with a populated base location.</p>
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
                  : "The RRT team request could not be completed.")}
        </div>
      ) : null}

      {statusMessage ? <div className={styles.statusRow}>{statusMessage}</div> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Type</th>
              <th scope="col">Lead</th>
              <th scope="col">Contacts</th>
              <th scope="col">Members</th>
              <th scope="col">Specializations</th>
              <th scope="col">Base Location</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length ? (
              filteredTeams.map((team) => (
                <tr key={team.id}>
                  <td>
                    {team.name}
                    <br />
                    Code: {team.code}
                  </td>
                  <td>{team.type}</td>
                  <td>{team.leadName}</td>
                  <td>
                    {team.leadEmail}
                    {team.leadPhone !== "Not set" ? ` / ${team.leadPhone}` : ""}
                  </td>
                  <td>{team.size}</td>
                  <td>{team.specializations}</td>
                  <td>{team.baseLocation}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClassName(team.isActive)}`}>
                      {team.isActive}
                    </span>
                  </td>
                  <td>{team.updatedAt}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuTeamId === team.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuTeamId((current) => (current === team.id ? null : team.id))
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

                      {openMenuTeamId === team.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(team)}
                            type="button"
                          >
                            Edit team
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuTeamId(null);
                              setDeleteTarget(team);
                            }}
                            type="button"
                          >
                            Delete team
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
                  No RRT teams match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="rrt-teams-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="rrt-teams-modal-title">
                  {editingTeam ? "Edit Team" : "Create Team"}
                </h2>
                <p className={styles.modalText}>
                  Maintain the resource-management team roster with the full live team payload.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Team Name</span>
                    <input
                      onChange={(event) => updateFormField("team_name", event.target.value)}
                      type="text"
                      value={formState.team_name}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Team Code</span>
                    <input
                      onChange={(event) => updateFormField("team_code", event.target.value)}
                      type="text"
                      value={formState.team_code}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Team Type</span>
                    <input
                      onChange={(event) => updateFormField("team_type", event.target.value)}
                      type="text"
                      value={formState.team_type}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Team Size</span>
                    <input
                      onChange={(event) => updateFormField("team_size", event.target.value)}
                      type="number"
                      value={formState.team_size}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Lead Name</span>
                    <input
                      onChange={(event) => updateFormField("team_lead_name", event.target.value)}
                      type="text"
                      value={formState.team_lead_name}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Lead Email</span>
                    <input
                      onChange={(event) => updateFormField("team_lead_email", event.target.value)}
                      type="email"
                      value={formState.team_lead_email}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Lead Phone</span>
                    <input
                      onChange={(event) => updateFormField("team_lead_phone", event.target.value)}
                      type="text"
                      value={formState.team_lead_phone}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Base Location</span>
                    <input
                      onChange={(event) => updateFormField("base_location", event.target.value)}
                      type="text"
                      value={formState.base_location}
                    />
                  </label>
                  <label className={styles.fieldWide}>
                    <span>Specializations</span>
                    <input
                      onChange={(event) => updateFormField("specializations", event.target.value)}
                      placeholder="Comma separated"
                      type="text"
                      value={formState.specializations}
                    />
                  </label>
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    checked={formState.is_active}
                    onChange={(event) => updateFormField("is_active", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Mark team as active</span>
                </label>

                <p className={styles.helperText}>
                  Keep team names, codes, and availability accurate so deployment records continue
                  to resolve cleanly to valid response teams.
                </p>

                {formError ? <p className={styles.inlineError}>{formError}</p> : null}
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={closeFormModal} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingTeam ? "Save Changes" : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="rrt-teams-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="rrt-teams-delete-title">
                  Delete Team
                </h2>
                <p className={styles.modalText}>
                  Remove <strong>{deleteTarget.name}</strong> from the resource-management team
                  roster.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This action calls `DELETE /api/resource-management/rrt-teams/{deleteTarget.id}`.
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
                {deleteMutation.isPending ? "Deleting..." : "Delete Team"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
