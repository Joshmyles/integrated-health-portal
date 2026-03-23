"use client";

import { useEffect, useState } from "react";
import { useUserDetail } from "@/src/features/users/hooks/use-user-detail";
import { useUserPermissions } from "@/src/features/users/hooks/use-user-permissions";
import { useUsers } from "@/src/features/users/hooks/use-users";
import { useUpdateUser } from "@/src/features/users/hooks/use-update-user";
import { UsersRequestError } from "@/src/features/users/lib/users-client";
import type {
  UpdateUserPayload,
  UserDetail,
  UserListItem
} from "@/src/features/users/types/users";
import styles from "./user-management-workspace.module.css";

const DEFAULT_PAGE_SIZE = 20;
const ZERO_DATE = "0001-01-01T00:00:00Z";

type ModalType = "details" | "permissions" | "edit";

interface ActiveModal {
  type: ModalType;
  user: UserListItem;
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

function buildUpdatePayload(user: UserDetail): UpdateUserPayload {
  return {
    department_id: user.department_id,
    email: user.email,
    first_name: user.first_name,
    is_active: user.is_active,
    is_locked: user.is_locked,
    last_name: user.last_name,
    role_ids: user.role_ids,
    username: user.username
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

  return "Edit User Payload";
}

function getModalSubtitle(type: ModalType) {
  if (type === "details") {
    return "Live detail record from GET /api/users/:id.";
  }

  if (type === "permissions") {
    return "Permission list from GET /api/users/:id/permissions.";
  }

  return "Send JSON updates to PUT /api/users/:id.";
}

function getStatusTone(isPositive: boolean) {
  return isPositive ? styles.statusPositive : styles.statusMuted;
}

export function UserManagementWorkspace() {
  const [page, setPage] = useState(1);
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [editorValue, setEditorValue] = useState("{}");
  const [editorError, setEditorError] = useState<string | null>(null);

  const usersQuery = useUsers(page, DEFAULT_PAGE_SIZE);
  const detailUserId =
    activeModal && (activeModal.type === "details" || activeModal.type === "edit")
      ? activeModal.user.id
      : null;
  const permissionsUserId = activeModal?.type === "permissions" ? activeModal.user.id : null;
  const detailQuery = useUserDetail(detailUserId);
  const permissionsQuery = useUserPermissions(permissionsUserId);
  const updateMutation = useUpdateUser();

  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;
  const detailUser = detailQuery.data;
  const permissions = permissionsQuery.data?.permissions ?? [];
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
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuUserId(null);
        setActiveModal(null);
        setEditorError(null);
        updateMutation.reset();
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [updateMutation]);

  useEffect(() => {
    setOpenMenuUserId(null);
  }, [page]);

  useEffect(() => {
    if (activeModal?.type !== "edit" || !detailUser) {
      return;
    }

    setEditorValue(JSON.stringify(buildUpdatePayload(detailUser), null, 2));
    setEditorError(null);
  }, [activeModal, detailUser]);

  function openModal(type: ModalType, user: UserListItem) {
    setOpenMenuUserId(null);
    setEditorError(null);
    updateMutation.reset();
    setActiveModal({ type, user });

    if (type === "edit") {
      setEditorValue("{}");
    }
  }

  function closeModal() {
    setActiveModal(null);
    setOpenMenuUserId(null);
    setEditorError(null);
    updateMutation.reset();
  }

  async function handleSaveChanges() {
    if (activeModal?.type !== "edit") {
      return;
    }

    setEditorError(null);
    updateMutation.reset();

    let payload: UpdateUserPayload;

    try {
      payload = JSON.parse(editorValue) as UpdateUserPayload;
    } catch {
      setEditorError("The update payload must be valid JSON before it can be saved.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        payload,
        userId: activeModal.user.id
      });
    } catch {
      return;
    }
  }

  function handleResetPayload() {
    if (!detailUser) {
      return;
    }

    updateMutation.reset();
    setEditorError(null);
    setEditorValue(JSON.stringify(buildUpdatePayload(detailUser), null, 2));
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
              The registry is now table-first. Details, permissions, and updates open from the
              actions menu so the list can use the full workspace width.
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
                      <div className={styles.rowSecondary}>
                        {user.roles[0] ?? "No roles"}
                      </div>
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
                              Edit payload
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
                    <p className={styles.statusMessage}>Loading current payload...</p>
                  ) : null}

                  {detailQuery.isError ? (
                    <p className={styles.errorMessage}>
                      {detailQuery.error instanceof UsersRequestError
                        ? detailQuery.error.message
                        : "The selected user could not be loaded."}
                    </p>
                  ) : null}

                  <textarea
                    className={styles.editor}
                    disabled={detailQuery.isLoading || updateMutation.isPending}
                    onChange={(event) => {
                      setEditorValue(event.target.value);
                      setEditorError(null);
                      if (updateMutation.isError || updateMutation.isSuccess) {
                        updateMutation.reset();
                      }
                    }}
                    spellCheck={false}
                    value={editorValue}
                  />

                  {editorError ? <p className={styles.errorMessage}>{editorError}</p> : null}
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
                      onClick={handleSaveChanges}
                      type="button"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      className={styles.secondaryButton}
                      disabled={detailQuery.isLoading || updateMutation.isPending}
                      onClick={handleResetPayload}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
