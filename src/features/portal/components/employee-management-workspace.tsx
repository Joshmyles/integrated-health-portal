"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { AuthRequestError } from "@/src/features/auth/lib/auth-client";
import { useCreateEmployee } from "@/src/features/portal/hooks/use-create-employee";
import { useDeleteEmployee } from "@/src/features/portal/hooks/use-delete-employee";
import { useUpdateEmployee } from "@/src/features/portal/hooks/use-update-employee";
import type { PortalEmployeeDirectoryEntry } from "@/src/features/portal/types/portal";
import styles from "./employee-management-workspace.module.css";

interface EmployeeManagementWorkspaceProps {
  employees: PortalEmployeeDirectoryEntry[];
  title: string;
}

interface EmployeeFormState {
  employee_cadre: string;
  employee_email: string;
  employee_fname: string;
  employee_lname: string;
  employee_phone: string;
  employee_sex: string;
  facility: string;
}

type EmployeeSortKey = "cadre" | "facility" | "name";

const INITIAL_FORM_STATE: EmployeeFormState = {
  employee_cadre: "",
  employee_email: "",
  employee_fname: "",
  employee_lname: "",
  employee_phone: "",
  employee_sex: "",
  facility: ""
};

export function EmployeeManagementWorkspace({
  employees,
  title
}: EmployeeManagementWorkspaceProps) {
  const createMutation = useCreateEmployee();
  const deleteMutation = useDeleteEmployee();
  const updateMutation = useUpdateEmployee();

  const [formState, setFormState] = useState<EmployeeFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [openMenuEmployeeId, setOpenMenuEmployeeId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<PortalEmployeeDirectoryEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortalEmployeeDirectoryEntry | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<EmployeeSortKey>("name");
  const [sortAscending, setSortAscending] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const mutationError = [createMutation.error, updateMutation.error, deleteMutation.error].find(Boolean);
  const mutationErrorMessage =
    mutationError instanceof AuthRequestError
      ? mutationError.message
      : mutationError instanceof Error
        ? mutationError.message
        : null;

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      employee.fullName,
      employee.cadre,
      employee.email,
      employee.phone,
      employee.facilityName,
      employee.sex
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const sortedEmployees = [...filteredEmployees].sort((left, right) => {
    const leftValue =
      sortKey === "facility"
        ? left.facilityName
        : sortKey === "cadre"
          ? left.cadre
          : left.fullName;
    const rightValue =
      sortKey === "facility"
        ? right.facilityName
        : sortKey === "cadre"
          ? right.cadre
          : right.fullName;
    const comparison = leftValue.localeCompare(rightValue);

    return sortAscending ? comparison : -comparison;
  });

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * rowsPerPage;
  const pageEmployees = sortedEmployees.slice(pageStart, pageStart + rowsPerPage);
  const facilitiesCount = new Set(filteredEmployees.map((employee) => employee.facilityName)).size;
  const assignedEmployees = filteredEmployees.filter(
    (employee) => employee.facilityName !== "Unassigned"
  ).length;

  const isModalOpen = isCreateOpen || Boolean(editingEmployee);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuEmployeeId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuEmployeeId(null);
      setIsCreateOpen(false);
      setEditingEmployee(null);
      setDeleteTarget(null);
      setFormError(null);
      setFormState(INITIAL_FORM_STATE);
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function updateField<Key extends keyof EmployeeFormState>(
    key: Key,
    value: EmployeeFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));

    if (formError) {
      setFormError(null);
    }
  }

  function resetFormState() {
    setFormState(INITIAL_FORM_STATE);
    setEditingEmployee(null);
    setFormError(null);
  }

  function closeModal() {
    resetFormState();
    setIsCreateOpen(false);
  }

  function openCreateModal() {
    resetFormState();
    setOpenMenuEmployeeId(null);
    setStatusMessage(null);
    setIsCreateOpen(true);
  }

  function openEditModal(employee: PortalEmployeeDirectoryEntry) {
    setOpenMenuEmployeeId(null);
    setEditingEmployee(employee);
    setIsCreateOpen(false);
    setFormState({
      employee_cadre: employee.cadre === "Not set" ? "" : employee.cadre,
      employee_email: employee.email === "Not set" ? "" : employee.email,
      employee_fname: employee.firstName,
      employee_lname: employee.lastName,
      employee_phone: employee.phone === "Not set" ? "" : employee.phone,
      employee_sex: employee.sex === "Not set" ? "" : employee.sex,
      facility: `${employee.facilityId}`
    });
    setFormError(null);
    setStatusMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    const facilityValue = Number(formState.facility);

    if (
      !formState.employee_fname.trim() ||
      !formState.employee_lname.trim() ||
      !formState.facility.trim()
    ) {
      setFormError("First name, last name, and facility are required.");
      return;
    }

    if (!Number.isInteger(facilityValue) || facilityValue < 0) {
      setFormError("Facility must be a whole number.");
      return;
    }

    try {
      const payload = {
        employee_id: editingEmployee?.id,
        employee_cadre: formState.employee_cadre.trim() || undefined,
        employee_email: formState.employee_email.trim() || undefined,
        employee_fname: formState.employee_fname.trim(),
        employee_lname: formState.employee_lname.trim(),
        employee_phone: formState.employee_phone.trim() || undefined,
        employee_sex: formState.employee_sex.trim() || undefined,
        facility: facilityValue
      };

      if (editingEmployee) {
        await updateMutation.mutateAsync(payload);
        setStatusMessage(`Employee ${editingEmployee.id} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage("Employee created successfully.");
      }

      closeModal();
    } catch {
      return;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync(deleteTarget.id);
    setStatusMessage(`Employee ${deleteTarget.id} deleted successfully.`);
    setOpenMenuEmployeeId(null);
    setDeleteTarget(null);
  }

  function updateSorting(nextSortKey: EmployeeSortKey) {
    if (sortKey === nextSortKey) {
      setSortAscending((current) => !current);
      return;
    }

    setSortKey(nextSortKey);
    setSortAscending(true);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.toolbarCopy}>
            Manage the live workforce directory with the same focused pattern used across resource management.
          </p>
        </div>
        <input
          className={styles.searchInput}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search names, cadres, facilities, email, or phone"
          type="search"
          value={searchValue}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Employee
        </button>
        <div className={styles.toolbarTools}>
          <div className={styles.sortGroup}>
            <button className={styles.sortButton} onClick={() => updateSorting("name")} type="button">
              Name {sortKey === "name" ? (sortAscending ? "↑" : "↓") : ""}
            </button>
            <button className={styles.sortButton} onClick={() => updateSorting("cadre")} type="button">
              Cadre {sortKey === "cadre" ? (sortAscending ? "↑" : "↓") : ""}
            </button>
            <button className={styles.sortButton} onClick={() => updateSorting("facility")} type="button">
              Facility {sortKey === "facility" ? (sortAscending ? "↑" : "↓") : ""}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Visible Employees</div>
          <div className={styles.summaryValue}>{filteredEmployees.length}</div>
          <p className={styles.summaryNote}>Rows matching the current search and sort.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Facilities Represented</div>
          <div className={styles.summaryValue}>{facilitiesCount}</div>
          <p className={styles.summaryNote}>Facilities represented in the current employee view.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Assigned Employees</div>
          <div className={styles.summaryValue}>{assignedEmployees}</div>
          <p className={styles.summaryNote}>Employees linked to a named facility.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Current Page</div>
          <div className={styles.summaryValue}>
            {safeCurrentPage}/{totalPages}
          </div>
          <p className={styles.summaryNote}>Pagination across the live employee directory.</p>
        </article>
      </div>

      {mutationErrorMessage ? <div className={styles.errorBanner}>{mutationErrorMessage}</div> : null}
      {statusMessage ? <div className={styles.statusRow}>{statusMessage}</div> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Cadre</th>
              <th scope="col">Sex</th>
              <th scope="col">Contacts</th>
              <th scope="col">Facility</th>
              <th scope="col">Facility ID</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageEmployees.length ? (
              pageEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.fullName}</td>
                  <td>{employee.cadre}</td>
                  <td>{employee.sex}</td>
                  <td>
                    {employee.email}
                    {employee.phone !== "Not set" ? ` / ${employee.phone}` : ""}
                  </td>
                  <td>{employee.facilityName}</td>
                  <td>{employee.facilityId}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuEmployeeId === employee.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuEmployeeId((current) =>
                            current === employee.id ? null : employee.id
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

                      {openMenuEmployeeId === employee.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(employee)}
                            type="button"
                          >
                            Edit employee
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuEmployeeId(null);
                              setDeleteTarget(employee);
                            }}
                            type="button"
                          >
                            Delete employee
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
                  No employees match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationBar}>
        <span className={styles.paginationMeta}>
          Showing {pageEmployees.length ? pageStart + 1 : 0}-
          {Math.min(pageStart + pageEmployees.length, filteredEmployees.length)} of {filteredEmployees.length}
        </span>
        <div className={styles.paginationActions}>
          <button
            className={styles.secondaryButton}
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Previous
          </button>
          <button
            className={styles.secondaryButton}
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="employees-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="employees-modal-title">
                  {editingEmployee ? "Edit Employee" : "Create Employee"}
                </h2>
                <p className={styles.modalText}>
                  This form submits the employee fields accepted by the upstream workforce service.
                  Unsupported `afi_*` fields are intentionally excluded.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>First Name</span>
                    <input
                      onChange={(event) => updateField("employee_fname", event.target.value)}
                      type="text"
                      value={formState.employee_fname}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Last Name</span>
                    <input
                      onChange={(event) => updateField("employee_lname", event.target.value)}
                      type="text"
                      value={formState.employee_lname}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Cadre</span>
                    <input
                      onChange={(event) => updateField("employee_cadre", event.target.value)}
                      type="text"
                      value={formState.employee_cadre}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Sex</span>
                    <input
                      onChange={(event) => updateField("employee_sex", event.target.value)}
                      placeholder="Female, Male, F, M"
                      type="text"
                      value={formState.employee_sex}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Email</span>
                    <input
                      onChange={(event) => updateField("employee_email", event.target.value)}
                      type="email"
                      value={formState.employee_email}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Phone</span>
                    <input
                      onChange={(event) => updateField("employee_phone", event.target.value)}
                      type="text"
                      value={formState.employee_phone}
                    />
                  </label>
                  <label className={styles.fieldWide}>
                    <span>Facility ID</span>
                    <input
                      onChange={(event) => updateField("facility", event.target.value)}
                      type="number"
                      value={formState.facility}
                    />
                  </label>
                </div>

                <p className={styles.helperText}>
                  Employee create and update requests only send the verified workforce fields so the
                  upstream service does not reject the payload with the JSON-tag error you hit earlier.
                </p>

                {formError ? <p className={styles.inlineError}>{formError}</p> : null}
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={closeModal} type="button">
                  Cancel
                </button>
                <button className={styles.secondaryButton} onClick={resetFormState} type="button">
                  Reset
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={
                    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
                  }
                  type="submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingEmployee
                      ? "Save Changes"
                      : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="employees-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="employees-delete-title">
                  Delete Employee
                </h2>
                <p className={styles.modalText}>
                  Remove <strong>{deleteTarget.fullName}</strong> from the workforce directory.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This action calls `DELETE /api/employees/{deleteTarget.id}` through the local proxy.
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
                {deleteMutation.isPending ? "Deleting..." : "Delete Employee"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
