"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRoles } from "@/src/features/users/hooks/use-roles";
import { useCreatePermission } from "@/src/features/settings/hooks/use-create-permission";
import { useCreateRole } from "@/src/features/settings/hooks/use-create-role";
import { useDeletePermission } from "@/src/features/settings/hooks/use-delete-permission";
import { useDeleteRole } from "@/src/features/settings/hooks/use-delete-role";
import { usePermissions } from "@/src/features/settings/hooks/use-permissions";
import { useRbacStats, useRoleStats, usePermissionStats, useMigrationStatus } from "@/src/features/settings/hooks/use-rbac-stats";
import { useRbacUsers } from "@/src/features/settings/hooks/use-rbac-users";
import { useReplaceUserRoles } from "@/src/features/settings/hooks/use-replace-user-roles";
import { useUpdatePermission } from "@/src/features/settings/hooks/use-update-permission";
import { useUpdateRole } from "@/src/features/settings/hooks/use-update-role";
import { useUserRoles } from "@/src/features/settings/hooks/use-user-roles";
import { SettingsRequestError } from "@/src/features/settings/lib/settings-client";
import type {
  CreatePermissionPayload,
  CreateRolePayload,
  Permission,
  RbacUserListItem,
} from "@/src/features/settings/types/settings";
import type { RoleSummary } from "@/src/features/users/types/users";
import styles from "./settings-workspace.module.css";

type Tab = "overview" | "roles" | "permissions" | "user-access";

type RoleModalMode = { type: "create" } | { type: "edit"; role: RoleSummary };
type PermissionModalMode = { type: "create" } | { type: "edit"; permission: Permission };

interface RoleForm {
  name: string;
  description: string;
}

interface PermissionForm {
  name: string;
  resource: string;
  action: string;
  description: string;
}

function formatStatsKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatsValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.length ? JSON.stringify(value) : "—";
    if (Object.keys(value as object).length === 0) return "—";
    return JSON.stringify(value);
  }
  return String(value);
}

function getDisplayName(user: Pick<RbacUserListItem, "first_name" | "last_name" | "username">) {
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return full || user.username;
}

function emptyRoleForm(role?: RoleSummary): RoleForm {
  return { name: role?.name ?? "", description: role?.description ?? "" };
}

function emptyPermissionForm(permission?: Permission): PermissionForm {
  return {
    name: permission?.name ?? "",
    resource: permission?.resource ?? "",
    action: permission?.action ?? "",
    description: permission?.description ?? ""
  };
}

export function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ── Roles tab ──────────────────────────────────────────────────────────────
  const [roleModal, setRoleModal] = useState<RoleModalMode | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>({ name: "", description: "" });
  const [roleFormError, setRoleFormError] = useState<string | null>(null);
  const [roleDeleteConfirmId, setRoleDeleteConfirmId] = useState<number | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);

  // ── Permissions tab ────────────────────────────────────────────────────────
  const [permModal, setPermModal] = useState<PermissionModalMode | null>(null);
  const [permForm, setPermForm] = useState<PermissionForm>({ name: "", resource: "", action: "", description: "" });
  const [permFormError, setPermFormError] = useState<string | null>(null);
  const [permDeleteConfirmId, setPermDeleteConfirmId] = useState<number | null>(null);
  const [openPermMenuId, setOpenPermMenuId] = useState<number | null>(null);

  // ── User access tab ────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<RbacUserListItem | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [roleSearchValue, setRoleSearchValue] = useState("");
  const [pendingRoleIds, setPendingRoleIds] = useState<number[] | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [openUserMenuId, setOpenUserMenuId] = useState<number | null>(null);

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const rbacStats = useRbacStats();
  const roleStats = useRoleStats();
  const permStats = usePermissionStats();
  const migrationStatus = useMigrationStatus();

  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const usersQuery = useRbacUsers();
  const userRolesQuery = useUserRoles(selectedUser?.id ?? null);

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const createPermMutation = useCreatePermission();
  const updatePermMutation = useUpdatePermission();
  const deletePermMutation = useDeletePermission();
  const replaceRolesMutation = useReplaceUserRoles();

  const roles = rolesQuery.data?.roles ?? [];
  const permissions = permissionsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  // ── Click-outside close ────────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-role-menu]")) setOpenRoleMenuId(null);
      if (!target.closest("[data-perm-menu]")) setOpenPermMenuId(null);
      if (!target.closest("[data-user-menu]")) setOpenUserMenuId(null);
      if (!target.closest("[data-role-picker]")) setRolePickerOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenRoleMenuId(null);
      setOpenPermMenuId(null);
      setOpenUserMenuId(null);
      if (rolePickerOpen) { setRolePickerOpen(false); return; }
      setRoleModal(null);
      setPermModal(null);
      setRoleDeleteConfirmId(null);
      setPermDeleteConfirmId(null);
      setRoleFormError(null);
      setPermFormError(null);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rolePickerOpen]);

  // ── Seed pending role ids when user roles load ─────────────────────────────
  useEffect(() => {
    if (!selectedUser || !userRolesQuery.data) return;
    setPendingRoleIds(userRolesQuery.data);
  }, [selectedUser, userRolesQuery.data]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function openRoleCreate() {
    setRoleForm(emptyRoleForm());
    setRoleFormError(null);
    createRoleMutation.reset();
    updateRoleMutation.reset();
    setRoleModal({ type: "create" });
  }

  function openRoleEdit(role: RoleSummary) {
    setRoleForm(emptyRoleForm(role));
    setRoleFormError(null);
    createRoleMutation.reset();
    updateRoleMutation.reset();
    setOpenRoleMenuId(null);
    setRoleModal({ type: "edit", role });
  }

  function closeRoleModal() {
    setRoleModal(null);
    setRoleFormError(null);
    createRoleMutation.reset();
    updateRoleMutation.reset();
  }

  function openPermCreate() {
    setPermForm(emptyPermissionForm());
    setPermFormError(null);
    createPermMutation.reset();
    updatePermMutation.reset();
    setPermModal({ type: "create" });
  }

  function openPermEdit(permission: Permission) {
    setPermForm(emptyPermissionForm(permission));
    setPermFormError(null);
    createPermMutation.reset();
    updatePermMutation.reset();
    setOpenPermMenuId(null);
    setPermModal({ type: "edit", permission });
  }

  function closePermModal() {
    setPermModal(null);
    setPermFormError(null);
    createPermMutation.reset();
    updatePermMutation.reset();
  }

  function openUserAccess(user: RbacUserListItem) {
    setOpenUserMenuId(null);
    setReplaceError(null);
    replaceRolesMutation.reset();
    setPendingRoleIds(null);
    setRolePickerOpen(false);
    setRoleSearchValue("");
    setSelectedUser(user);
  }

  function closeUserAccess() {
    setSelectedUser(null);
    setPendingRoleIds(null);
    setRolePickerOpen(false);
    setRoleSearchValue("");
    setReplaceError(null);
    replaceRolesMutation.reset();
  }

  function togglePendingRole(roleId: number) {
    setPendingRoleIds((current) => {
      if (!current) return [roleId];
      return current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId];
    });
    setReplaceError(null);
    replaceRolesMutation.reset();
  }

  // ── Submit handlers ────────────────────────────────────────────────────────
  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRoleFormError(null);

    if (!roleForm.name.trim()) {
      setRoleFormError("Role name is required.");
      return;
    }

    const payload: CreateRolePayload = {
      name: roleForm.name.trim(),
      description: roleForm.description.trim()
    };

    try {
      if (roleModal?.type === "create") {
        await createRoleMutation.mutateAsync(payload);
      } else if (roleModal?.type === "edit") {
        await updateRoleMutation.mutateAsync({ id: roleModal.role.id, payload });
      }
    } catch {
      return;
    }
  }

  async function handleRoleDelete() {
    if (!roleDeleteConfirmId) return;

    try {
      await deleteRoleMutation.mutateAsync(roleDeleteConfirmId);
      setRoleDeleteConfirmId(null);
    } catch {
      return;
    }
  }

  async function handlePermSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPermFormError(null);

    if (!permForm.name.trim() || !permForm.resource.trim() || !permForm.action.trim()) {
      setPermFormError("Name, resource, and action are required.");
      return;
    }

    const payload = {
      name: permForm.name.trim(),
      resource: permForm.resource.trim(),
      action: permForm.action.trim(),
      description: permForm.description.trim()
    };

    try {
      if (permModal?.type === "create") {
        await createPermMutation.mutateAsync(payload);
      } else if (permModal?.type === "edit") {
        await updatePermMutation.mutateAsync({ id: permModal.permission.id, payload });
      }
    } catch {
      return;
    }
  }

  async function handlePermDelete() {
    if (!permDeleteConfirmId) return;

    try {
      await deletePermMutation.mutateAsync(permDeleteConfirmId);
      setPermDeleteConfirmId(null);
    } catch {
      return;
    }
  }

  async function handleReplaceRoles() {
    if (!selectedUser || pendingRoleIds === null) return;
    setReplaceError(null);
    replaceRolesMutation.reset();

    try {
      await replaceRolesMutation.mutateAsync({ userId: selectedUser.id, roleIds: pendingRoleIds });
    } catch {
      return;
    }
  }

  // ── Filtered roles for picker ──────────────────────────────────────────────
  const filteredPickerRoles = [...roles]
    .filter((role) => {
      const q = roleSearchValue.trim().toLowerCase();
      return !q || role.name.toLowerCase().includes(q) || role.description.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedRoleTokens = (pendingRoleIds ?? []).map((id) => {
    const role = roles.find((r) => r.id === id);
    return { id, label: role?.name ?? `Role #${id}` };
  });

  // ── Error message helpers ──────────────────────────────────────────────────
  function getRoleMutationError() {
    const err = createRoleMutation.error ?? updateRoleMutation.error;
    if (!err) return null;
    return err instanceof SettingsRequestError ? err.message : "The operation could not be completed.";
  }

  function getPermMutationError() {
    const err = createPermMutation.error ?? updatePermMutation.error;
    if (!err) return null;
    return err instanceof SettingsRequestError ? err.message : "The operation could not be completed.";
  }

  const roleMutationBusy = createRoleMutation.isPending || updateRoleMutation.isPending;
  const permMutationBusy = createPermMutation.isPending || updatePermMutation.isPending;

  // ── Rendered ───────────────────────────────────────────────────────────────
  return (
    <section className={styles.workspace}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {(["overview", "roles", "permissions", "user-access"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === "overview" && "Overview"}
            {tab === "roles" && "Roles"}
            {tab === "permissions" && "Permissions"}
            {tab === "user-access" && "User Access"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div>
          {[
            { label: "RBAC Aggregate", query: rbacStats },
            { label: "Role Statistics", query: roleStats },
            { label: "Permission Statistics", query: permStats },
            { label: "Migration Status", query: migrationStatus }
          ].map(({ label, query }) => (
            <div className={styles.panel} key={label}>
              <h2 className={styles.sectionTitle}>{label}</h2>

              {query.isLoading && <p className={styles.statusMessage}>Loading...</p>}
              {query.isError && (
                <p className={styles.errorMessage}>Could not load {label.toLowerCase()}.</p>
              )}

              {query.data && !query.isLoading && (
                <div className={styles.statsList}>
                  {Object.entries(query.data).map(([key, value]) => (
                    <div className={styles.statsEntry} key={key}>
                      <span className={styles.statsKey}>{formatStatsKey(key)}</span>
                      <span className={styles.statsVal}>{formatStatsValue(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ROLES TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Roles Registry</h2>
                <p className={styles.panelCopy}>
                  Create, update, and remove RBAC roles. Changes affect all users assigned to the modified role.
                </p>
              </div>
              <button className={styles.primaryButton} onClick={openRoleCreate} type="button">
                + New Role
              </button>
            </div>

            {rolesQuery.isLoading && <p className={styles.statusMessage}>Loading roles...</p>}
            {rolesQuery.isError && (
              <p className={styles.errorMessage}>The roles list could not be loaded.</p>
            )}

            {!rolesQuery.isLoading && !rolesQuery.isError && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Description</th>
                      <th scope="col">Permissions</th>
                      <th scope="col">Users</th>
                      <th scope="col">Status</th>
                      <th className={styles.actionsHeader} scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td>
                          <div className={styles.rowPrimary}>{role.name}</div>
                          <div className={styles.rowSecondary}>#{role.id}</div>
                        </td>
                        <td>{role.description || <span className={styles.rowSecondary}>No description</span>}</td>
                        <td>{role.permission_count}</td>
                        <td>{role.user_count}</td>
                        <td>
                          <span
                            className={`${styles.statusPill} ${
                              role.is_active ? styles.statusPositive : styles.statusMuted
                            }`}
                          >
                            {role.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionsMenuWrap} data-role-menu="">
                            <button
                              aria-expanded={openRoleMenuId === role.id}
                              aria-haspopup="menu"
                              className={styles.moreButton}
                              onClick={() =>
                                setOpenRoleMenuId((current) =>
                                  current === role.id ? null : role.id
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

                            {openRoleMenuId === role.id && (
                              <div className={styles.dropdown} role="menu">
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openRoleEdit(role)}
                                  type="button"
                                >
                                  Edit
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenRoleMenuId(null);
                                    setRoleDeleteConfirmId(role.id);
                                  }}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PERMISSIONS TAB ────────────────────────────────────────────────── */}
      {activeTab === "permissions" && (
        <div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Permissions Registry</h2>
                <p className={styles.panelCopy}>
                  Define granular permissions by resource and action. Permissions are attached to roles.
                </p>
              </div>
              <button className={styles.primaryButton} onClick={openPermCreate} type="button">
                + New Permission
              </button>
            </div>

            {permissionsQuery.isLoading && <p className={styles.statusMessage}>Loading permissions...</p>}
            {permissionsQuery.isError && (
              <p className={styles.errorMessage}>The permissions list could not be loaded.</p>
            )}

            {!permissionsQuery.isLoading && !permissionsQuery.isError && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Resource</th>
                      <th scope="col">Action</th>
                      <th scope="col">Description</th>
                      <th scope="col">Status</th>
                      <th className={styles.actionsHeader} scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm) => (
                      <tr key={perm.id}>
                        <td>
                          <div className={styles.rowPrimary}>{perm.name}</div>
                          <div className={styles.rowSecondary}>#{perm.id}</div>
                        </td>
                        <td>{perm.resource}</td>
                        <td>{perm.action}</td>
                        <td>{perm.description || <span className={styles.rowSecondary}>—</span>}</td>
                        <td>
                          <span
                            className={`${styles.statusPill} ${
                              perm.is_active ? styles.statusPositive : styles.statusMuted
                            }`}
                          >
                            {perm.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionsMenuWrap} data-perm-menu="">
                            <button
                              aria-expanded={openPermMenuId === perm.id}
                              aria-haspopup="menu"
                              className={styles.moreButton}
                              onClick={() =>
                                setOpenPermMenuId((current) =>
                                  current === perm.id ? null : perm.id
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

                            {openPermMenuId === perm.id && (
                              <div className={styles.dropdown} role="menu">
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openPermEdit(perm)}
                                  type="button"
                                >
                                  Edit
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenPermMenuId(null);
                                    setPermDeleteConfirmId(perm.id);
                                  }}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── USER ACCESS TAB ────────────────────────────────────────────────── */}
      {activeTab === "user-access" && (
        <div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>User Role Assignments</h2>
                <p className={styles.panelCopy}>
                  Select a user to view and update their assigned roles.
                </p>
              </div>
            </div>

            {usersQuery.isLoading && <p className={styles.statusMessage}>Loading users...</p>}
            {usersQuery.isError && (
              <p className={styles.errorMessage}>The user list could not be loaded.</p>
            )}

            {!usersQuery.isLoading && !usersQuery.isError && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Username</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Roles</th>
                      <th className={styles.actionsHeader} scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.rowPrimary}>{user.username}</div>
                          <div className={styles.rowSecondary}>#{user.id}</div>
                        </td>
                        <td>{getDisplayName(user)}</td>
                        <td>{user.email || <span className={styles.rowSecondary}>—</span>}</td>
                        <td>
                          <div>{(user.roles ?? []).length}</div>
                          {user.roles?.[0] ? (
                            <div className={styles.rowSecondary}>{user.roles[0]}</div>
                          ) : null}
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionsMenuWrap} data-user-menu="">
                            <button
                              aria-expanded={openUserMenuId === user.id}
                              aria-haspopup="menu"
                              className={styles.moreButton}
                              onClick={() =>
                                setOpenUserMenuId((current) =>
                                  current === user.id ? null : user.id
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

                            {openUserMenuId === user.id && (
                              <div className={styles.dropdown} role="menu">
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openUserAccess(user)}
                                  type="button"
                                >
                                  Manage roles
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROLE CREATE / EDIT MODAL ────────────────────────────────────────── */}
      {roleModal && (
        <div className={styles.modalBackdrop} onClick={closeRoleModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={roleModal.type === "create" ? "Create Role" : "Edit Role"}
          >
            <div className={styles.modalTitleBar}>
              <div>
                <div className={styles.modalTitle}>
                  {roleModal.type === "create" ? "Create Role" : "Edit Role"}
                </div>
                <div className={styles.modalSubtitle}>
                  {roleModal.type === "edit" ? `Editing ${roleModal.role.name}` : "Define a new RBAC role"}
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeRoleModal} type="button">
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <form className={styles.formLayout} onSubmit={handleRoleSubmit}>
                <div className={styles.formGrid}>
                  <div className={`${styles.fieldGroup} ${styles.fieldSpanFull}`}>
                    <label className={styles.fieldLabel} htmlFor="role-name">Name</label>
                    <input
                      className={styles.textInput}
                      disabled={roleMutationBusy}
                      id="role-name"
                      onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                      value={roleForm.name}
                    />
                  </div>

                  <div className={`${styles.fieldGroup} ${styles.fieldSpanFull}`}>
                    <label className={styles.fieldLabel} htmlFor="role-description">Description</label>
                    <textarea
                      className={styles.textArea}
                      disabled={roleMutationBusy}
                      id="role-description"
                      onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                      value={roleForm.description}
                    />
                  </div>
                </div>

                {roleFormError && <p className={styles.errorMessage}>{roleFormError}</p>}
                {getRoleMutationError() && (
                  <p className={styles.errorMessage}>{getRoleMutationError()}</p>
                )}
                {(createRoleMutation.isSuccess || updateRoleMutation.isSuccess) && (
                  <p className={styles.successMessage}>Role saved successfully.</p>
                )}

                <div className={styles.editorActions}>
                  <button
                    className={styles.primaryButton}
                    disabled={roleMutationBusy}
                    type="submit"
                  >
                    {roleMutationBusy ? "Saving..." : "Save"}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    disabled={roleMutationBusy}
                    onClick={closeRoleModal}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── ROLE DELETE CONFIRM ─────────────────────────────────────────────── */}
      {roleDeleteConfirmId !== null && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setRoleDeleteConfirmId(null)}
          role="presentation"
        >
          <div
            className={styles.modalWindow}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Delete Role"
          >
            <div className={styles.modalTitleBar}>
              <div className={styles.modalTitle}>Delete Role</div>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                This will permanently remove the role and unlink it from all assigned users. This
                action cannot be undone.
              </p>
              {deleteRoleMutation.error instanceof SettingsRequestError && (
                <p className={styles.errorMessage}>{deleteRoleMutation.error.message}</p>
              )}
              <div className={styles.confirmActions}>
                <button
                  className={styles.dangerButton}
                  disabled={deleteRoleMutation.isPending}
                  onClick={handleRoleDelete}
                  type="button"
                >
                  {deleteRoleMutation.isPending ? "Deleting..." : "Delete"}
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={deleteRoleMutation.isPending}
                  onClick={() => {
                    setRoleDeleteConfirmId(null);
                    deleteRoleMutation.reset();
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSION CREATE / EDIT MODAL ─────────────────────────────────── */}
      {permModal && (
        <div className={styles.modalBackdrop} onClick={closePermModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={permModal.type === "create" ? "Create Permission" : "Edit Permission"}
          >
            <div className={styles.modalTitleBar}>
              <div>
                <div className={styles.modalTitle}>
                  {permModal.type === "create" ? "Create Permission" : "Edit Permission"}
                </div>
                <div className={styles.modalSubtitle}>
                  {permModal.type === "edit"
                    ? `Editing ${permModal.permission.name}`
                    : "Define a new permission by resource and action"}
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closePermModal} type="button">
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <form className={styles.formLayout} onSubmit={handlePermSubmit}>
                <div className={styles.formGrid}>
                  <div className={`${styles.fieldGroup} ${styles.fieldSpanFull}`}>
                    <label className={styles.fieldLabel} htmlFor="perm-name">Name</label>
                    <input
                      className={styles.textInput}
                      disabled={permMutationBusy}
                      id="perm-name"
                      onChange={(e) => setPermForm((f) => ({ ...f, name: e.target.value }))}
                      value={permForm.name}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="perm-resource">Resource</label>
                    <input
                      className={styles.textInput}
                      disabled={permMutationBusy}
                      id="perm-resource"
                      onChange={(e) => setPermForm((f) => ({ ...f, resource: e.target.value }))}
                      placeholder="e.g. outbreaks"
                      value={permForm.resource}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="perm-action">Action</label>
                    <input
                      className={styles.textInput}
                      disabled={permMutationBusy}
                      id="perm-action"
                      onChange={(e) => setPermForm((f) => ({ ...f, action: e.target.value }))}
                      placeholder="e.g. read, write, delete"
                      value={permForm.action}
                    />
                  </div>

                  <div className={`${styles.fieldGroup} ${styles.fieldSpanFull}`}>
                    <label className={styles.fieldLabel} htmlFor="perm-description">Description</label>
                    <textarea
                      className={styles.textArea}
                      disabled={permMutationBusy}
                      id="perm-description"
                      onChange={(e) => setPermForm((f) => ({ ...f, description: e.target.value }))}
                      value={permForm.description}
                    />
                  </div>
                </div>

                {permFormError && <p className={styles.errorMessage}>{permFormError}</p>}
                {getPermMutationError() && (
                  <p className={styles.errorMessage}>{getPermMutationError()}</p>
                )}
                {(createPermMutation.isSuccess || updatePermMutation.isSuccess) && (
                  <p className={styles.successMessage}>Permission saved successfully.</p>
                )}

                <div className={styles.editorActions}>
                  <button
                    className={styles.primaryButton}
                    disabled={permMutationBusy}
                    type="submit"
                  >
                    {permMutationBusy ? "Saving..." : "Save"}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    disabled={permMutationBusy}
                    onClick={closePermModal}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSION DELETE CONFIRM ───────────────────────────────────────── */}
      {permDeleteConfirmId !== null && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setPermDeleteConfirmId(null)}
          role="presentation"
        >
          <div
            className={styles.modalWindow}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Delete Permission"
          >
            <div className={styles.modalTitleBar}>
              <div className={styles.modalTitle}>Delete Permission</div>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                This will permanently remove the permission from all roles that reference it.
              </p>
              {deletePermMutation.error instanceof SettingsRequestError && (
                <p className={styles.errorMessage}>{deletePermMutation.error.message}</p>
              )}
              <div className={styles.confirmActions}>
                <button
                  className={styles.dangerButton}
                  disabled={deletePermMutation.isPending}
                  onClick={handlePermDelete}
                  type="button"
                >
                  {deletePermMutation.isPending ? "Deleting..." : "Delete"}
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={deletePermMutation.isPending}
                  onClick={() => {
                    setPermDeleteConfirmId(null);
                    deletePermMutation.reset();
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USER ROLE MANAGEMENT MODAL ──────────────────────────────────────── */}
      {selectedUser && (
        <div className={styles.modalBackdrop} onClick={closeUserAccess} role="presentation">
          <div
            className={`${styles.modalWindow} ${styles.modalWindowWide}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Manage User Roles"
          >
            <div className={styles.modalTitleBar}>
              <div>
                <div className={styles.modalTitle}>Manage Roles — {selectedUser.username}</div>
                <div className={styles.modalSubtitle}>
                  {getDisplayName(selectedUser)} · Replaces the full role set for this user.
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeUserAccess} type="button">
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              {userRolesQuery.isLoading && (
                <p className={styles.statusMessage}>Loading user roles...</p>
              )}

              {userRolesQuery.isError && (
                <p className={styles.errorMessage}>The user roles could not be loaded.</p>
              )}

              {!userRolesQuery.isLoading && pendingRoleIds !== null && (
                <>
                  <div data-role-picker="">
                    <div className={styles.pickerComboBar}>
                      <input
                        aria-autocomplete="list"
                        aria-expanded={rolePickerOpen}
                        className={styles.textInput}
                        disabled={replaceRolesMutation.isPending}
                        onChange={(e) => {
                          setRoleSearchValue(e.target.value);
                          setRolePickerOpen(true);
                        }}
                        onFocus={() => setRolePickerOpen(true)}
                        placeholder="Search roles to assign"
                        role="combobox"
                        value={roleSearchValue}
                      />
                      <button
                        className={styles.secondaryButton}
                        disabled={replaceRolesMutation.isPending}
                        onClick={() => setRolePickerOpen((v) => !v)}
                        type="button"
                      >
                        {rolePickerOpen ? "Hide" : "Browse"}
                      </button>
                    </div>

                    {selectedRoleTokens.length ? (
                      <div className={styles.selectedTokenWrap}>
                        {selectedRoleTokens.map((token) => (
                          <button
                            className={styles.selectedToken}
                            key={token.id}
                            onClick={() => togglePendingRole(token.id)}
                            type="button"
                          >
                            <span>{token.label}</span>
                            <span aria-hidden="true" className={styles.selectedTokenDismiss}>×</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.statusMessage}>No roles selected. All roles will be removed on save.</p>
                    )}

                    {rolePickerOpen && !rolesQuery.isLoading && (
                      <div className={styles.pickerDropdown} role="listbox">
                        {filteredPickerRoles.length ? (
                          filteredPickerRoles.map((role) => {
                            const isSelected = pendingRoleIds.includes(role.id);
                            return (
                              <label
                                className={`${styles.pickerOption} ${isSelected ? styles.pickerOptionSelected : ""}`}
                                key={role.id}
                              >
                                <input
                                  checked={isSelected}
                                  className={styles.pickerOptionCheckbox}
                                  onChange={() => togglePendingRole(role.id)}
                                  type="checkbox"
                                />
                                <span>
                                  <span className={styles.pickerOptionName}>{role.name}</span>
                                  <span className={styles.pickerOptionMeta}>
                                    {role.description || "No description"} · {role.permission_count} permissions
                                  </span>
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <div className={styles.emptyState}>No roles matched the search.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {replaceError && <p className={styles.errorMessage}>{replaceError}</p>}
                  {replaceRolesMutation.error instanceof SettingsRequestError && (
                    <p className={styles.errorMessage}>{replaceRolesMutation.error.message}</p>
                  )}
                  {replaceRolesMutation.isSuccess && (
                    <p className={styles.successMessage}>Roles updated successfully.</p>
                  )}

                  <div className={styles.editorActions}>
                    <button
                      className={styles.primaryButton}
                      disabled={replaceRolesMutation.isPending}
                      onClick={handleReplaceRoles}
                      type="button"
                    >
                      {replaceRolesMutation.isPending ? "Saving..." : "Save Roles"}
                    </button>
                    <button
                      className={styles.secondaryButton}
                      disabled={replaceRolesMutation.isPending}
                      onClick={closeUserAccess}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
