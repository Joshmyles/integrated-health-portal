"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRoles } from "@/src/features/users/hooks/use-roles";
import { useUpdateUser } from "@/src/features/users/hooks/use-update-user";
import { useUserDetail } from "@/src/features/users/hooks/use-user-detail";
import { useUserPermissions } from "@/src/features/users/hooks/use-user-permissions";
import { useUsers } from "@/src/features/users/hooks/use-users";
import { UsersRequestError } from "@/src/features/users/lib/users-client";
import type {
  RoleSummary,
  UpdateUserPayload,
  UserDetail,
  UserListItem
} from "@/src/features/users/types/users";
import styles from "./user-management-workspace.module.css";

const DEFAULT_PAGE_SIZE = 20;
const ROLE_SEARCH_INPUT_ID = "user-management-role-search";
const ZERO_DATE = "0001-01-01T00:00:00Z";

type ModalType = "details" | "permissions" | "edit";

interface ActiveModal {
  type: ModalType;
  user: UserListItem;
}

interface EditFormState {
  departmentId: string;
  email: string;
  firstName: string;
  isActive: boolean;
  isLocked: boolean;
  lastName: string;
  roleIds: number[];
  username: string;
}

function formatDateTime(value: string) {
  if (!value || value === ZERO_DATE) {
    return "Never recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function createEditFormState(user: UserDetail): EditFormState {
  return {
    departmentId: user.department_id > 0 ? String(user.department_id) : "",
    email: user.email,
    firstName: user.first_name,
    isActive: user.is_active,
    isLocked: user.is_locked,
    lastName: user.last_name,
    roleIds: [...user.role_ids],
    username: user.username
  };
}

function buildUpdatePayload(formState: EditFormState): UpdateUserPayload {
  const trimmedDepartmentId = formState.departmentId.trim();

  return {
    department_id: trimmedDepartmentId ? Number(trimmedDepartmentId) : 0,
    email: formState.email.trim(),
    first_name: formState.firstName.trim(),
    is_active: formState.isActive,
    is_locked: formState.isLocked,
    last_name: formState.lastName.trim(),
    role_ids: Array.from(new Set(formState.roleIds)),
    username: formState.username.trim()
  };
}

function getDisplayName(user: Pick<UserListItem, "first_name" | "last_name" | "username">) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username;
}

function getModalTitle(type: ModalType) {
  if (type === "details") {
    return "User Details";
  }

  if (type === "permissions") {
    return "Effective Permissions";
  }

  return "Edit User";
}

function getModalSubtitle(type: ModalType) {
  if (type === "details") {
    return "Live detail record from GET /api/users/:id.";
  }

  if (type === "permissions") {
    return "Permission list from GET /api/users/:id/permissions.";
  }

  return "Update account fields and assigned roles with PUT /api/users/:id.";
}

function getStatusTone(isPositive: boolean) {
  return isPositive ? styles.statusPositive : styles.statusMuted;
}

function roleMatchesSearch(role: RoleSummary, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [role.name, role.description].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  );
}

function getRoleLabel(roleId: number, roles: RoleSummary[], detailUser?: UserDetail) {
  const role = roles.find((item) => item.id === roleId);

  if (role) {
    return role.name;
  }

  if (detailUser) {
    const roleIndex = detailUser.role_ids.findIndex((item) => item === roleId);

    if (roleIndex >= 0) {
      return detailUser.roles[roleIndex] ?? `Role #${roleId}`;
    }
  }

  return `Role #${roleId}`;
}

export function UserManagementWorkspace() {
  const [page, setPage] = useState(1);
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [formState, setFormState] = useState<EditFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [roleSearchValue, setRoleSearchValue] = useState("");

  const usersQuery = useUsers(page, DEFAULT_PAGE_SIZE);
  const isEditModal = activeModal?.type === "edit";
  const detailUserId =
    activeModal && (activeModal.type === "details" || activeModal.type === "edit")
      ? activeModal.user.id
      : null;
  const permissionsUserId = activeModal?.type === "permissions" ? activeModal.user.id : null;
  const detailQuery = useUserDetail(detailUserId);
  const permissionsQuery = useUserPermissions(permissionsUserId);
  const rolesQuery = useRoles(isEditModal);
  const updateMutation = useUpdateUser();

  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;
  const detailUser = detailQuery.data;
  const permissions = permissionsQuery.data?.permissions ?? [];
  const roles = rolesQuery.data?.roles ?? [];
  const filteredRoles = [...roles]
    .filter((role) => roleMatchesSearch(role, roleSearchValue))
    .sort((left, right) => left.name.localeCompare(right.name));
  const selectedRoles = (formState?.roleIds ?? []).map((roleId) => ({
    id: roleId,
    label: getRoleLabel(roleId, roles, detailUser)
  }));
  const activeUsersOnPage = users.filter((user) => user.is_active).length;
  const lockedUsersOnPage = users.filter((user) => user.is_locked).length;
  const updateError =
    updateMutation.error instanceof UsersRequestError
      ? updateMutation.error.message
      : updateMutation.error
        ? "The update could not be completed."
        : null;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuUserId(null);
      }

      if (!target.closest("[data-role-picker]")) {
        setIsRolePickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuUserId(null);

      if (isRolePickerOpen) {
        setIsRolePickerOpen(false);
        return;
      }

      setActiveModal(null);
      setFormState(null);
      setFormError(null);
      setRoleSearchValue("");
      updateMutation.reset();
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRolePickerOpen, updateMutation]);

  useEffect(() => {
    setOpenMenuUserId(null);
    setIsRolePickerOpen(false);
  }, [page]);

  useEffect(() => {
    if (!isEditModal || !detailUser) {
      return;
    }

    setFormState(createEditFormState(detailUser));
    setFormError(null);
    setRoleSearchValue("");
    setIsRolePickerOpen(false);
  }, [detailUser, isEditModal]);

  function clearEditFeedback() {
    setFormError(null);

    if (updateMutation.isError || updateMutation.isSuccess) {
      updateMutation.reset();
    }
  }

  function updateFormField<Key extends keyof EditFormState>(
    field: Key,
    value: EditFormState[Key]
  ) {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value
      } as EditFormState;
    });

    clearEditFeedback();
  }

  function toggleRoleSelection(roleId: number) {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      const isSelected = current.roleIds.includes(roleId);

      return {
        ...current,
        roleIds: isSelected
          ? current.roleIds.filter((currentRoleId) => currentRoleId !== roleId)
          : [...current.roleIds, roleId]
      };
    });

    clearEditFeedback();
  }

  function openModal(type: ModalType, user: UserListItem) {
    setOpenMenuUserId(null);
    setFormError(null);
    setRoleSearchValue("");
    setIsRolePickerOpen(false);
    updateMutation.reset();
    setActiveModal({ type, user });

    if (type === "edit") {
      setFormState(null);
    }
  }

  function closeModal() {
    setActiveModal(null);
    setOpenMenuUserId(null);
    setFormState(null);
    setFormError(null);
    setRoleSearchValue("");
    setIsRolePickerOpen(false);
    updateMutation.reset();
  }

  async function handleSaveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (activeModal?.type !== "edit" || !formState) {
      return;
    }

    setFormError(null);
    updateMutation.reset();

    if (!formState.username.trim()) {
      setFormError("Username is required before the user can be saved.");
      return;
    }

    if (formState.departmentId.trim() && !/^\d+$/.test(formState.departmentId.trim())) {
      setFormError("Department ID must be blank or a whole number.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        payload: buildUpdatePayload(formState),
        userId: activeModal.user.id
      });
    } catch {
      return;
    }
  }

  function handleResetForm() {
    if (!detailUser) {
      return;
    }

    updateMutation.reset();
    setFormError(null);
    setRoleSearchValue("");
    setIsRolePickerOpen(false);
    setFormState(createEditFormState(detailUser));
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total users</div>
          <div className={styles.summaryValue}>{pagination?.total ?? "--"}</div>
          <p className={styles.summaryNote}>Reported by the upstream administration API.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Current page</div>
          <div className={styles.summaryValue}>
            {pagination ? `${pagination.page} / ${pagination.total_pages}` : "--"}
          </div>
          <p className={styles.summaryNote}>Compact paging keeps the registry easy to scan.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active on page</div>
          <div className={styles.summaryValue}>{users.length ? activeUsersOnPage : "--"}</div>
          <p className={styles.summaryNote}>Quick check for enabled accounts in the visible slice.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Locked on page</div>
          <div className={styles.summaryValue}>{users.length ? lockedUsersOnPage : "--"}</div>
          <p className={styles.summaryNote}>Useful for spotting accounts that need admin review.</p>
        </article>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>User Registry</h2>
            <p className={styles.panelCopy}>
              The registry stays table-first, while details, permissions, and user editing open
              from the actions menu so the list can keep the full workspace width.
            </p>
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.smallButton}
              disabled={page <= 1 || usersQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Previous
            </button>
            <span className={styles.paginationLabel}>Page {pagination?.page ?? page}</span>
            <button
              className={styles.smallButton}
              disabled={usersQuery.isFetching || Boolean(pagination && page >= pagination.total_pages)}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>

        {usersQuery.isLoading ? <p className={styles.statusMessage}>Loading users...</p> : null}

        {usersQuery.isError ? (
          <p className={styles.errorMessage}>
            {usersQuery.error instanceof UsersRequestError
              ? usersQuery.error.message
              : "The user list could not be loaded."}
          </p>
        ) : null}

        {!usersQuery.isLoading && !usersQuery.isError ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Username</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Department</th>
                  <th scope="col">Roles</th>
                  <th scope="col">State</th>
                  <th scope="col">Last login</th>
                  <th className={styles.actionsHeader} scope="col">
                    Actions
                  </th>
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
                    <td>{user.email || "Not supplied"}</td>
                    <td>{user.department_name || "Not assigned"}</td>
                    <td>
                      <div>{user.roles.length}</div>
                      <div className={styles.rowSecondary}>{user.roles[0] ?? "No roles"}</div>
                    </td>
                    <td>
                      <div className={styles.stateStack}>
                        <span className={`${styles.statusPill} ${getStatusTone(user.is_active)}`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                        <span
                          className={`${styles.statusPill} ${
                            user.is_locked ? styles.statusWarning : styles.statusMuted
                          }`}
                        >
                          {user.is_locked ? "Locked" : "Unlocked"}
                        </span>
                      </div>
                    </td>
                    <td>{formatDateTime(user.last_login_at)}</td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsMenuWrap} data-actions-menu="">
                        <button
                          aria-expanded={openMenuUserId === user.id}
                          aria-haspopup="menu"
                          className={styles.moreButton}
                          onClick={() =>
                            setOpenMenuUserId((current) => (current === user.id ? null : user.id))
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

                        {openMenuUserId === user.id ? (
                          <div className={styles.dropdown} role="menu">
                            <button
                              className={styles.dropdownItem}
                              onClick={() => openModal("details", user)}
                              type="button"
                            >
                              View details
                            </button>
                            <button
                              className={styles.dropdownItem}
                              onClick={() => openModal("permissions", user)}
                              type="button"
                            >
                              Permissions
                            </button>
                            <button
                              className={styles.dropdownItem}
                              onClick={() => openModal("edit", user)}
                              type="button"
                            >
                              Edit user
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {activeModal ? (
        <div className={styles.modalBackdrop} onClick={closeModal} role="presentation">
          <div
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={getModalTitle(activeModal.type)}
          >
            <div className={styles.modalTitleBar}>
              <div>
                <div className={styles.modalTitle}>{getModalTitle(activeModal.type)}</div>
                <div className={styles.modalSubtitle}>
                  {activeModal.user.username} . {getModalSubtitle(activeModal.type)}
                </div>
              </div>
              <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeModal.type === "details" ? (
                <>
                  {detailQuery.isLoading ? (
                    <p className={styles.statusMessage}>Loading user detail...</p>
                  ) : null}

                  {detailQuery.isError ? (
                    <p className={styles.errorMessage}>
                      {detailQuery.error instanceof UsersRequestError
                        ? detailQuery.error.message
                        : "The selected user could not be loaded."}
                    </p>
                  ) : null}

                  {detailUser ? (
                    <>
                      <dl className={styles.metaGrid}>
                        <div>
                          <dt>Username</dt>
                          <dd>{detailUser.username}</dd>
                        </div>
                        <div>
                          <dt>Display name</dt>
                          <dd>{getDisplayName(detailUser)}</dd>
                        </div>
                        <div>
                          <dt>Email</dt>
                          <dd>{detailUser.email || "Not supplied"}</dd>
                        </div>
                        <div>
                          <dt>Department</dt>
                          <dd>{detailUser.department_name || "Not assigned"}</dd>
                        </div>
                        <div>
                          <dt>Created</dt>
                          <dd>{formatDateTime(detailUser.created_at)}</dd>
                        </div>
                        <div>
                          <dt>Updated</dt>
                          <dd>{formatDateTime(detailUser.updated_at)}</dd>
                        </div>
                        <div>
                          <dt>Last login</dt>
                          <dd>{formatDateTime(detailUser.last_login_at)}</dd>
                        </div>
                        <div>
                          <dt>Account state</dt>
                          <dd className={styles.stateStack}>
                            <span className={`${styles.statusPill} ${getStatusTone(detailUser.is_active)}`}>
                              {detailUser.is_active ? "Active" : "Inactive"}
                            </span>
                            <span
                              className={`${styles.statusPill} ${
                                detailUser.is_locked ? styles.statusWarning : styles.statusMuted
                              }`}
                            >
                              {detailUser.is_locked ? "Locked" : "Unlocked"}
                            </span>
                          </dd>
                        </div>
                      </dl>

                      <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Assigned Roles</h3>
                        <div className={styles.tokenWrap}>
                          {detailUser.roles.map((role) => (
                            <span className={styles.token} key={role}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : null}
                </>
              ) : null}

              {activeModal.type === "permissions" ? (
                <>
                  {permissionsQuery.isLoading ? (
                    <p className={styles.statusMessage}>Loading permissions...</p>
                  ) : null}

                  {permissionsQuery.isError ? (
                    <p className={styles.errorMessage}>
                      {permissionsQuery.error instanceof UsersRequestError
                        ? permissionsQuery.error.message
                        : "The user permissions could not be loaded."}
                    </p>
                  ) : null}

                  {!permissionsQuery.isLoading && !permissionsQuery.isError ? (
                    <div className={styles.modalTableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th scope="col">Resource</th>
                            <th scope="col">Action</th>
                            <th scope="col">Permission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permissions.map((permission) => (
                            <tr key={permission.id}>
                              <td>{permission.resource}</td>
                              <td>{permission.action}</td>
                              <td>
                                <div className={styles.permissionName}>{permission.name}</div>
                                <div className={styles.permissionDescription}>
                                  {permission.description}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              ) : null}

              {activeModal.type === "edit" ? (
                <>
                  {detailQuery.isLoading ? (
                    <p className={styles.statusMessage}>Loading current user settings...</p>
                  ) : null}

                  {detailQuery.isError ? (
                    <p className={styles.errorMessage}>
                      {detailQuery.error instanceof UsersRequestError
                        ? detailQuery.error.message
                        : "The selected user could not be loaded."}
                    </p>
                  ) : null}

                  {formState ? (
                    <form className={styles.formLayout} onSubmit={handleSaveChanges}>
                      <div className={styles.formGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="edit-user-username">
                            Username
                          </label>
                          <input
                            className={styles.textInput}
                            disabled={updateMutation.isPending}
                            id="edit-user-username"
                            onChange={(event) => updateFormField("username", event.target.value)}
                            value={formState.username}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="edit-user-email">
                            Email
                          </label>
                          <input
                            className={styles.textInput}
                            disabled={updateMutation.isPending}
                            id="edit-user-email"
                            onChange={(event) => updateFormField("email", event.target.value)}
                            value={formState.email}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="edit-user-first-name">
                            First name
                          </label>
                          <input
                            className={styles.textInput}
                            disabled={updateMutation.isPending}
                            id="edit-user-first-name"
                            onChange={(event) => updateFormField("firstName", event.target.value)}
                            value={formState.firstName}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="edit-user-last-name">
                            Last name
                          </label>
                          <input
                            className={styles.textInput}
                            disabled={updateMutation.isPending}
                            id="edit-user-last-name"
                            onChange={(event) => updateFormField("lastName", event.target.value)}
                            value={formState.lastName}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="edit-user-department-id">
                            Department ID
                          </label>
                          <input
                            className={styles.textInput}
                            disabled={updateMutation.isPending}
                            id="edit-user-department-id"
                            inputMode="numeric"
                            onChange={(event) => updateFormField("departmentId", event.target.value)}
                            placeholder="0"
                            value={formState.departmentId}
                          />
                          <p className={styles.fieldHint}>
                            Leave blank to keep the user unassigned in the upstream system.
                          </p>
                        </div>

                        <div className={`${styles.fieldGroup} ${styles.fieldSpanFull}`}>
                          <span className={styles.fieldLabel}>Account flags</span>
                          <div className={styles.checkGrid}>
                            <label className={styles.checkCard}>
                              <input
                                checked={formState.isActive}
                                disabled={updateMutation.isPending}
                                onChange={(event) =>
                                  updateFormField("isActive", event.target.checked)
                                }
                                type="checkbox"
                              />
                              <span>
                                <span className={styles.checkCardTitle}>Account active</span>
                                <span className={styles.checkCardCopy}>
                                  Allows the user to sign in and use assigned modules.
                                </span>
                              </span>
                            </label>

                            <label className={styles.checkCard}>
                              <input
                                checked={formState.isLocked}
                                disabled={updateMutation.isPending}
                                onChange={(event) =>
                                  updateFormField("isLocked", event.target.checked)
                                }
                                type="checkbox"
                              />
                              <span>
                                <span className={styles.checkCardTitle}>Account locked</span>
                                <span className={styles.checkCardCopy}>
                                  Blocks access until an administrator unlocks the account.
                                </span>
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className={`${styles.fieldGroup} ${styles.fieldSpanFull}`}>
                          <label className={styles.fieldLabel} htmlFor={ROLE_SEARCH_INPUT_ID}>
                            Roles
                          </label>
                          <p className={styles.fieldHint}>
                            Search the live RBAC role registry and assign one or more roles.
                          </p>

                          <div className={styles.rolePicker} data-role-picker="">
                            <div className={styles.comboBar}>
                              <input
                                aria-autocomplete="list"
                                aria-expanded={isRolePickerOpen}
                                className={styles.textInput}
                                disabled={updateMutation.isPending}
                                id={ROLE_SEARCH_INPUT_ID}
                                onChange={(event) => {
                                  setRoleSearchValue(event.target.value);
                                  setIsRolePickerOpen(true);
                                }}
                                onFocus={() => setIsRolePickerOpen(true)}
                                placeholder="Search roles by name or description"
                                role="combobox"
                                value={roleSearchValue}
                              />
                              <button
                                aria-expanded={isRolePickerOpen}
                                className={styles.secondaryButton}
                                disabled={updateMutation.isPending}
                                onClick={() => setIsRolePickerOpen((current) => !current)}
                                type="button"
                              >
                                {isRolePickerOpen ? "Hide" : "Browse"}
                              </button>
                            </div>

                            {selectedRoles.length ? (
                              <div className={styles.selectedRoleWrap}>
                                {selectedRoles.map((role) => (
                                  <button
                                    className={styles.selectedRoleToken}
                                    key={role.id}
                                    onClick={() => toggleRoleSelection(role.id)}
                                    type="button"
                                  >
                                    <span>{role.label}</span>
                                    <span aria-hidden="true" className={styles.selectedRoleDismiss}>
                                      x
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.fieldHintCompact}>No roles selected yet.</p>
                            )}

                            {rolesQuery.isLoading ? (
                              <p className={styles.statusMessage}>Loading roles...</p>
                            ) : null}

                            {rolesQuery.isError ? (
                              <p className={styles.errorMessage}>
                                {rolesQuery.error instanceof UsersRequestError
                                  ? rolesQuery.error.message
                                  : "The role list could not be loaded."}
                              </p>
                            ) : null}

                            {isRolePickerOpen && !rolesQuery.isLoading && !rolesQuery.isError ? (
                              <div className={styles.roleDropdown} role="listbox">
                                {filteredRoles.length ? (
                                  filteredRoles.map((role) => {
                                    const isSelected = formState.roleIds.includes(role.id);

                                    return (
                                      <label
                                        className={`${styles.roleOption} ${
                                          isSelected ? styles.roleOptionSelected : ""
                                        }`}
                                        key={role.id}
                                      >
                                        <input
                                          checked={isSelected}
                                          className={styles.roleOptionCheckbox}
                                          onChange={() => toggleRoleSelection(role.id)}
                                          type="checkbox"
                                        />
                                        <span className={styles.roleOptionBody}>
                                          <span className={styles.roleOptionTopLine}>
                                            <span className={styles.roleOptionName}>{role.name}</span>
                                            <span
                                              className={`${styles.statusPill} ${
                                                role.is_active
                                                  ? styles.statusPositive
                                                  : styles.statusMuted
                                              }`}
                                            >
                                              {role.is_active ? "Active" : "Inactive"}
                                            </span>
                                          </span>
                                          <span className={styles.roleOptionDescription}>
                                            {role.description || "No description supplied."}
                                          </span>
                                          <span className={styles.roleOptionStats}>
                                            {role.permission_count} permissions | {role.user_count} users
                                          </span>
                                        </span>
                                      </label>
                                    );
                                  })
                                ) : (
                                  <div className={styles.emptyDropdownState}>
                                    No roles matched the current search.
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {formError ? <p className={styles.errorMessage}>{formError}</p> : null}
                      {updateError ? <p className={styles.errorMessage}>{updateError}</p> : null}
                      {updateMutation.isSuccess ? (
                        <p className={styles.successMessage}>
                          User update accepted. The registry will refresh automatically.
                        </p>
                      ) : null}

                      <div className={styles.editorActions}>
                        <button
                          className={styles.primaryButton}
                          disabled={detailQuery.isLoading || updateMutation.isPending}
                          type="submit"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          className={styles.secondaryButton}
                          disabled={detailQuery.isLoading || updateMutation.isPending}
                          onClick={handleResetForm}
                          type="button"
                        >
                          Reset
                        </button>
                      </div>
                    </form>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
