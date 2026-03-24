"use client";

import { useEffect, useState } from "react";
import { useCreateDepartment } from "@/src/features/portal/hooks/use-create-department";
import { useDeleteDepartment } from "@/src/features/portal/hooks/use-delete-department";
import { useUpdateDepartment } from "@/src/features/portal/hooks/use-update-department";
import type { PortalDepartmentEntry } from "@/src/features/portal/types/portal";
import styles from "./departments-management-workspace.module.css";

interface DepartmentsManagementWorkspaceProps {
  departments: PortalDepartmentEntry[];
  title: string;
}

interface DepartmentFormState {
  code: string;
  department_head_id: string;
  description: string;
  is_active: boolean;
  name: string;
}

const INITIAL_FORM_STATE: DepartmentFormState = {
  code: "",
  department_head_id: "",
  description: "",
  is_active: true,
  name: ""
};

function getStatusClassName(status: string) {
  return status.toLowerCase() === "active" ? styles.statusActive : styles.statusInactive;
}

export function DepartmentsManagementWorkspace({
  departments,
  title
}: DepartmentsManagementWorkspaceProps) {
  const createMutation = useCreateDepartment();
  const deleteMutation = useDeleteDepartment();
  const updateMutation = useUpdateDepartment();

  const [searchValue, setSearchValue] = useState("");
  const [openMenuDepartmentId, setOpenMenuDepartmentId] = useState<number | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<PortalDepartmentEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortalDepartmentEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<DepartmentFormState>(INITIAL_FORM_STATE);

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredDepartments = departments.filter((department) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      department.name,
      department.code,
      department.description,
      department.headId,
      department.isActive
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const activeDepartments = departments.filter((department) => department.isActive === "Active").length;
  const codedDepartments = departments.filter((department) => department.code !== "Not set").length;
  const headedDepartments = departments.filter((department) => department.headId !== "Not set").length;

  const isModalOpen = isCreateOpen || Boolean(editingDepartment);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;
  const mutationErrorMessage =
    mutationError instanceof Error ? mutationError.message : null;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuDepartmentId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuDepartmentId(null);
      setIsCreateOpen(false);
      setEditingDepartment(null);
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
    setOpenMenuDepartmentId(null);
    setEditingDepartment(null);
    setIsCreateOpen(true);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    setStatusMessage(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(department: PortalDepartmentEntry) {
    setOpenMenuDepartmentId(null);
    setIsCreateOpen(false);
    setEditingDepartment(department);
    setFormState({
      code: department.code === "Not set" ? "" : department.code,
      department_head_id: department.headId === "Not set" ? "" : department.headId,
      description: department.description === "Not set" ? "" : department.description,
      is_active: department.isActive === "Active",
      name: department.name
    });
    setFormError(null);
    setStatusMessage(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function closeFormModal() {
    setOpenMenuDepartmentId(null);
    setIsCreateOpen(false);
    setEditingDepartment(null);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function updateFormField<Key extends keyof DepartmentFormState>(
    key: Key,
    value: DepartmentFormState[Key]
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

    if (!formState.name.trim()) {
      setFormError("Department name is required.");
      return;
    }

    const headIdValue = formState.department_head_id.trim();

    if (headIdValue && (!/^\d+$/.test(headIdValue) || Number(headIdValue) < 1)) {
      setFormError("Department head ID must be a whole number when provided.");
      return;
    }

    const payload = {
      code: formState.code.trim() || undefined,
      department_head_id: headIdValue ? Number(headIdValue) : undefined,
      description: formState.description.trim() || undefined,
      is_active: formState.is_active,
      name: formState.name.trim()
    };

    try {
      if (editingDepartment) {
        await updateMutation.mutateAsync({
          departmentId: editingDepartment.id,
          payload
        });
        setStatusMessage(`Department ${editingDepartment.id} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage("Department created successfully.");
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
    setStatusMessage(`Department ${deleteTarget.id} deleted successfully.`);
    setOpenMenuDepartmentId(null);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.toolbarCopy}>
            Manage the live department registry with the same focused pattern used across the portal.
          </p>
        </div>
        <input
          className={styles.searchInput}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search departments, codes, descriptions, or head IDs"
          type="search"
          value={searchValue}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Department
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Departments</div>
          <div className={styles.summaryValue}>{departments.length}</div>
          <p className={styles.summaryNote}>Live rows from `/api/departments`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active</div>
          <div className={styles.summaryValue}>{activeDepartments}</div>
          <p className={styles.summaryNote}>Departments currently marked active.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Codes Present</div>
          <div className={styles.summaryValue}>{codedDepartments}</div>
          <p className={styles.summaryNote}>Departments with a populated code.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Head IDs Present</div>
          <div className={styles.summaryValue}>{headedDepartments}</div>
          <p className={styles.summaryNote}>Departments with a populated head ID.</p>
        </article>
      </div>

      {mutationErrorMessage ? <div className={styles.errorBanner}>{mutationErrorMessage}</div> : null}
      {statusMessage ? <div className={styles.statusRow}>{statusMessage}</div> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Department</th>
              <th scope="col">Code</th>
              <th scope="col">Description</th>
              <th scope="col">Head ID</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length ? (
              filteredDepartments.map((department) => (
                <tr key={department.id}>
                  <td>{department.name}</td>
                  <td>{department.code}</td>
                  <td>{department.description}</td>
                  <td>{department.headId}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClassName(department.isActive)}`}>
                      {department.isActive}
                    </span>
                  </td>
                  <td>{department.updatedAt}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuDepartmentId === department.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuDepartmentId((current) =>
                            current === department.id ? null : department.id
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

                      {openMenuDepartmentId === department.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(department)}
                            type="button"
                          >
                            Edit department
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuDepartmentId(null);
                              setDeleteTarget(department);
                            }}
                            type="button"
                          >
                            Delete department
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyState} colSpan={7}>
                  No departments match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="departments-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="departments-modal-title">
                  {editingDepartment ? "Edit Department" : "Create Department"}
                </h2>
                <p className={styles.modalText}>
                  This form sends a normalized department payload inferred from the live API shape.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Name</span>
                    <input
                      onChange={(event) => updateFormField("name", event.target.value)}
                      type="text"
                      value={formState.name}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Code</span>
                    <input
                      onChange={(event) => updateFormField("code", event.target.value)}
                      type="text"
                      value={formState.code}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Department Head ID</span>
                    <input
                      onChange={(event) => updateFormField("department_head_id", event.target.value)}
                      type="number"
                      value={formState.department_head_id}
                    />
                  </label>
                  <label className={styles.fieldWide}>
                    <span>Description</span>
                    <textarea
                      onChange={(event) => updateFormField("description", event.target.value)}
                      value={formState.description}
                    />
                  </label>
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    checked={formState.is_active}
                    onChange={(event) => updateFormField("is_active", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Mark department as active</span>
                </label>

                <p className={styles.helperText}>
                  If the upstream departments API expects different field names, this workspace will
                  now surface that backend error directly so we can adjust the payload quickly.
                </p>

                {formError ? <p className={styles.inlineError}>{formError}</p> : null}
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={closeFormModal} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingDepartment ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="departments-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="departments-delete-title">
                  Delete Department
                </h2>
                <p className={styles.modalText}>
                  Remove <strong>{deleteTarget.name}</strong> from the HR department registry.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This action calls `DELETE /api/departments/{deleteTarget.id}` through the local proxy.
              </p>
              {mutationErrorMessage ? <p className={styles.inlineError}>{mutationErrorMessage}</p> : null}
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
                {deleteMutation.isPending ? "Deleting..." : "Delete Department"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
