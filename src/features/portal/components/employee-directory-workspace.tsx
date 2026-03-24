"use client";

import { useMemo, useState } from "react";
import type { PortalEmployeeDirectoryEntry } from "@/src/features/portal/types/portal";
import styles from "./portal-shell.module.css";

interface EmployeeDirectoryWorkspaceProps {
  employees: PortalEmployeeDirectoryEntry[];
}

type EmployeeGrouping = "facility" | "cadre" | "none";

function groupEmployees(
  employees: PortalEmployeeDirectoryEntry[],
  grouping: EmployeeGrouping
) {
  if (grouping === "none") {
    return [{ employees, key: "all", label: `All Employees (${employees.length})` }];
  }

  const grouped = new Map<string, PortalEmployeeDirectoryEntry[]>();

  for (const employee of employees) {
    const key = grouping === "facility" ? employee.facilityName : employee.cadre;
    const group = grouped.get(key) ?? [];
    group.push(employee);
    grouped.set(key, group);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, groupedEmployees]) => ({
      employees: groupedEmployees,
      key: label,
      label: `${label} (${groupedEmployees.length})`
    }));
}

export function EmployeeDirectoryWorkspace({
  employees
}: EmployeeDirectoryWorkspaceProps) {
  const [searchValue, setSearchValue] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [cadreFilter, setCadreFilter] = useState("all");
  const [grouping, setGrouping] = useState<EmployeeGrouping>("facility");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employees[0]?.id ?? 0);

  const facilityOptions = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.facilityName))).sort(),
    [employees]
  );
  const cadreOptions = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.cadre))).sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return employees.filter((employee) => {
      if (facilityFilter !== "all" && employee.facilityName !== facilityFilter) {
        return false;
      }

      if (cadreFilter !== "all" && employee.cadre !== cadreFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        employee.fullName,
        employee.cadre,
        employee.facilityName,
        employee.email,
        employee.phone
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [cadreFilter, employees, facilityFilter, searchValue]);

  const groupedEmployees = useMemo(
    () => groupEmployees(filteredEmployees, grouping),
    [filteredEmployees, grouping]
  );

  const selectedEmployee =
    filteredEmployees.find((employee) => employee.id === selectedEmployeeId) ?? filteredEmployees[0] ?? null;

  return (
    <section className={styles.employeeWorkspace}>
      <section className={styles.dataSection}>
        <h2 className={styles.plainSectionTitle}>Employee Directory</h2>
        <p className={styles.dataTableCaption}>
          Search employees, narrow by facility or cadre, and open a record for full details.
        </p>

        <div className={styles.employeeControlBar}>
          <label className={styles.employeeControl}>
            <span className={styles.employeeControlLabel}>Search</span>
            <input
              className={styles.employeeInput}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Name, cadre, facility, email, phone"
              type="search"
              value={searchValue}
            />
          </label>

          <label className={styles.employeeControl}>
            <span className={styles.employeeControlLabel}>Facility</span>
            <select
              className={styles.employeeSelect}
              onChange={(event) => setFacilityFilter(event.target.value)}
              value={facilityFilter}
            >
              <option value="all">All facilities</option>
              {facilityOptions.map((facility) => (
                <option key={facility} value={facility}>
                  {facility}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.employeeControl}>
            <span className={styles.employeeControlLabel}>Cadre</span>
            <select
              className={styles.employeeSelect}
              onChange={(event) => setCadreFilter(event.target.value)}
              value={cadreFilter}
            >
              <option value="all">All cadres</option>
              {cadreOptions.map((cadre) => (
                <option key={cadre} value={cadre}>
                  {cadre}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.employeeControl}>
            <span className={styles.employeeControlLabel}>Group by</span>
            <select
              className={styles.employeeSelect}
              onChange={(event) => setGrouping(event.target.value as EmployeeGrouping)}
              value={grouping}
            >
              <option value="facility">Facility</option>
              <option value="cadre">Cadre</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>

        <div className={styles.summaryCardGrid}>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Visible Employees</div>
            <div className={styles.summaryCardValue}>{filteredEmployees.length}</div>
            <p className={styles.summaryCardNote}>Current result set after search and filters</p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Visible Facilities</div>
            <div className={styles.summaryCardValue}>
              {new Set(filteredEmployees.map((employee) => employee.facilityName)).size}
            </div>
            <p className={styles.summaryCardNote}>Facilities represented in the current result set</p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Visible Cadres</div>
            <div className={styles.summaryCardValue}>
              {new Set(filteredEmployees.map((employee) => employee.cadre)).size}
            </div>
            <p className={styles.summaryCardNote}>Cadres represented in the current result set</p>
          </article>
        </div>
      </section>

      <div className={styles.employeeLayout}>
        <section className={styles.employeeResultsPanel}>
          {groupedEmployees.length ? (
            groupedEmployees.map((group) => (
              <section className={styles.employeeGroup} key={group.key}>
                <h3 className={styles.employeeGroupTitle}>{group.label}</h3>
                <div className={styles.employeeList}>
                  {group.employees.map((employee) => (
                    <button
                      className={`${styles.employeeListItem} ${
                        selectedEmployee?.id === employee.id ? styles.employeeListItemSelected : ""
                      }`}
                      key={employee.id}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      type="button"
                    >
                      <span className={styles.employeeListPrimary}>{employee.fullName}</span>
                      <span className={styles.employeeListSecondary}>
                        {employee.cadre} | {employee.facilityName}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className={styles.statusMessage}>No employees match the current filters.</div>
          )}
        </section>

        <aside className={styles.employeeDetailPanel}>
          <h3 className={styles.employeeDetailTitle}>Employee Details</h3>

          {selectedEmployee ? (
            <dl className={styles.employeeDetailList}>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Name</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.fullName}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Cadre</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.cadre}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Sex</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.sex}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Phone</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.phone}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Email</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.email}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Facility</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.facilityName}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Facility ID</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.facilityId}</dd>
              </div>
              <div className={styles.employeeDetailRow}>
                <dt className={styles.employeeDetailLabel}>Employee ID</dt>
                <dd className={styles.employeeDetailValue}>{selectedEmployee.id}</dd>
              </div>
            </dl>
          ) : (
            <div className={styles.statusMessage}>Select an employee to view details.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
