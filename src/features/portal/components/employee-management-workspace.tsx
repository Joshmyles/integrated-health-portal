"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AuthRequestError } from "@/src/features/auth/lib/auth-client";
import { useCreateEmployee } from "@/src/features/portal/hooks/use-create-employee";
import { useDeleteEmployee } from "@/src/features/portal/hooks/use-delete-employee";
import { useUpdateEmployee } from "@/src/features/portal/hooks/use-update-employee";
import type { PortalEmployeeDirectoryEntry } from "@/src/features/portal/types/portal";
import styles from "./portal-shell.module.css";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
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

  function updateField<Key extends keyof EmployeeFormState>(
    key: Key,
    value: EmployeeFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function resetFormState() {
    setFormState(INITIAL_FORM_STATE);
    setEditingEmployeeId(null);
    setFormError(null);
  }

  function closeModal() {
    resetFormState();
    setIsModalOpen(false);
  }

  function openCreateModal() {
    resetFormState();
    setStatusMessage(null);
    setIsModalOpen(true);
  }

  function openEditModal(employee: PortalEmployeeDirectoryEntry) {
    setEditingEmployeeId(employee.id);
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
    setIsModalOpen(true);
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
        employee_id: editingEmployeeId ?? undefined,
        employee_cadre: formState.employee_cadre.trim() || undefined,
        employee_email: formState.employee_email.trim() || undefined,
        employee_fname: formState.employee_fname.trim(),
        employee_lname: formState.employee_lname.trim(),
        employee_phone: formState.employee_phone.trim() || undefined,
        employee_sex: formState.employee_sex.trim() || undefined,
        facility: facilityValue
      };

      if (editingEmployeeId) {
        await updateMutation.mutateAsync(payload);
        setStatusMessage(`Employee ${editingEmployeeId} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage("Employee created successfully.");
      }

      closeModal();
    } catch {
      return;
    }
  }

  async function handleDeleteEmployee(employeeId: number) {
    setFormError(null);
    setStatusMessage(null);

    const shouldDelete = window.confirm(
      `Delete employee ${employeeId}? This action cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(employeeId);
      setStatusMessage(`Employee ${employeeId} deleted successfully.`);

      if (editingEmployeeId === employeeId) {
        closeModal();
      }
    } catch {
      return;
    }
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
    <section className={styles.employeeManagementWorkspace}>
      <section className={styles.dataSection}>
        <div className={styles.employeeToolbar}>
          <div>
            <h2 className={styles.plainSectionTitle}>{title}</h2>
            <p className={styles.dataTableCaption}>
              Search, sort, paginate, and manage employee records from the upstream workforce service.
            </p>
          </div>
          <button
            className={styles.employeeSubmitButton}
            onClick={openCreateModal}
            type="button"
          >
            Create Employee
          </button>
        </div>

        <div className={styles.employeeFilterBar}>
          <label className={styles.employeeFilterField}>
            <span className={styles.employeeFormLabel}>Search</span>
            <input
              className={styles.employeeFormInput}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Name, cadre, facility, email, phone"
              type="search"
              value={searchValue}
            />
          </label>

          <div className={styles.employeeSortGroup}>
            <span className={styles.employeeFormLabel}>Sort</span>
            <div className={styles.employeeSortButtons}>
              <button
                className={styles.employeeSecondaryButton}
                onClick={() => updateSorting("name")}
                type="button"
              >
                Name {sortKey === "name" ? (sortAscending ? "↑" : "↓") : ""}
              </button>
              <button
                className={styles.employeeSecondaryButton}
                onClick={() => updateSorting("cadre")}
                type="button"
              >
                Cadre {sortKey === "cadre" ? (sortAscending ? "↑" : "↓") : ""}
              </button>
              <button
                className={styles.employeeSecondaryButton}
                onClick={() => updateSorting("facility")}
                type="button"
              >
                Facility {sortKey === "facility" ? (sortAscending ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.summaryCardGrid}>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Visible Employees</div>
            <div className={styles.summaryCardValue}>{filteredEmployees.length}</div>
            <p className={styles.summaryCardNote}>Rows matching the current search</p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Facilities</div>
            <div className={styles.summaryCardValue}>
              {new Set(filteredEmployees.map((employee) => employee.facilityName)).size}
            </div>
            <p className={styles.summaryCardNote}>Facilities represented in the current view</p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Current Page</div>
            <div className={styles.summaryCardValue}>
              {safeCurrentPage}/{totalPages}
            </div>
            <p className={styles.summaryCardNote}>Pagination across the employee table</p>
          </article>
        </div>

        {statusMessage ? <div className={styles.successMessage}>{statusMessage}</div> : null}
        {mutationErrorMessage ? <div className={styles.errorMessage}>{mutationErrorMessage}</div> : null}

        <div className={styles.employeeTableViewport}>
          <div className={styles.dataTableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Cadre</th>
                  <th scope="col">Sex</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Email</th>
                  <th scope="col">Facility</th>
                  <th scope="col">Facility ID</th>
                  <th className={styles.employeeActionsHeader} scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.fullName}</td>
                    <td>{employee.cadre}</td>
                    <td>{employee.sex}</td>
                    <td>{employee.phone}</td>
                    <td>{employee.email}</td>
                    <td>{employee.facilityName}</td>
                    <td>{employee.facilityId}</td>
                    <td className={styles.employeeActionsCell}>
                      <div className={styles.employeeRowActions}>
                        <button
                          className={styles.employeeRowButton}
                          onClick={() => openEditModal(employee)}
                          type="button"
                        >
                          Update
                        </button>
                        <button
                          className={styles.employeeDeleteButton}
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            void handleDeleteEmployee(employee.id);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pageEmployees.length ? (
                  <tr>
                    <td className={styles.employeeEmptyState} colSpan={8}>
                      No employees match the current search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.employeePagination}>
          <span className={styles.employeePaginationMeta}>
            Showing {pageEmployees.length ? pageStart + 1 : 0}-
            {Math.min(pageStart + pageEmployees.length, filteredEmployees.length)} of {filteredEmployees.length}
          </span>
          <div className={styles.employeePaginationButtons}>
            <button
              className={styles.employeeSecondaryButton}
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className={styles.employeeSecondaryButton}
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Next
            </button>
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
                  {editingEmployeeId ? `Edit Employee ${editingEmployeeId}` : "Create Employee"}
                </h2>
                <p className={styles.dataTableCaption}>
                  Submit employee records to the upstream workforce service. Unsupported `afi_*` fields are intentionally excluded because they trigger the upstream JSON-tag error.
                </p>
              </div>
              <button
                aria-label="Close employee form"
                className={styles.employeeModalClose}
                onClick={closeModal}
                type="button"
              >
                x
              </button>
            </div>

            {formError ? <div className={styles.errorMessage}>{formError}</div> : null}

            <form className={styles.employeeForm} onSubmit={handleSubmit}>
              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>First name</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("employee_fname", event.target.value)}
                  type="text"
                  value={formState.employee_fname}
                />
              </label>

              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Last name</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("employee_lname", event.target.value)}
                  type="text"
                  value={formState.employee_lname}
                />
              </label>

              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Cadre</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("employee_cadre", event.target.value)}
                  type="text"
                  value={formState.employee_cadre}
                />
              </label>

              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Sex</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("employee_sex", event.target.value)}
                  placeholder="Female, Male, F, M"
                  type="text"
                  value={formState.employee_sex}
                />
              </label>

              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Email</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("employee_email", event.target.value)}
                  type="email"
                  value={formState.employee_email}
                />
              </label>

              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Phone</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("employee_phone", event.target.value)}
                  type="text"
                  value={formState.employee_phone}
                />
              </label>

              <label className={styles.employeeFormField}>
                <span className={styles.employeeFormLabel}>Facility ID</span>
                <input
                  className={styles.employeeFormInput}
                  onChange={(event) => updateField("facility", event.target.value)}
                  type="number"
                  value={formState.facility}
                />
              </label>

              <div className={styles.employeeFormActions}>
                <button
                  className={styles.employeeSecondaryButton}
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.employeeSecondaryButton}
                  onClick={resetFormState}
                  type="button"
                >
                  Reset
                </button>
                <button
                  className={styles.employeeSubmitButton}
                  disabled={
                    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
                  }
                  type="submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingEmployeeId
                      ? "Update Employee"
                      : "Create Employee"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
