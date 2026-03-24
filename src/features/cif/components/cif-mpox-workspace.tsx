"use client";

import { useDeferredValue, useState } from "react";
import { useMpoxPatients } from "@/src/features/cif/hooks/use-mpox-patients";
import { CifRequestError } from "@/src/features/cif/lib/cif-client";
import type { MpoxPatient } from "@/src/features/cif/types/cif";
import styles from "./cif-mpox-workspace.module.css";

function formatStatus(status: string) {
  return status.trim() || "Unknown";
}

function buildPatientSearchText(patient: MpoxPatient) {
  return [patient.id.toString(), patient.patient_name, formatStatus(patient.status)]
    .join(" ")
    .toLowerCase();
}

function getStatusClass(status: string) {
  const s = formatStatus(status).toLowerCase();
  if (s === "active") return styles.statusActive;
  if (s === "recovered") return styles.statusRecovered;
  return styles.statusUnknown;
}

export function CifMpoxWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  const query = useMpoxPatients();
  const patients = query.data?.mpox_patients ?? [];

  const statusOptions = Array.from(new Set(patients.map((p) => formatStatus(p.status))))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filtered = patients.filter((p) => {
    const matchesSearch = !deferredSearch || buildPatientSearchText(p).includes(deferredSearch);
    const matchesStatus = statusFilter === "all" || formatStatus(p.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = patients.filter((p) => formatStatus(p.status).toLowerCase() === "active").length;
  const recoveredCount = patients.filter((p) => formatStatus(p.status).toLowerCase() === "recovered").length;

  function handleReset() {
    setSearchValue("");
    setStatusFilter("all");
  }

  return (
    <div className={styles.workspace}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <div className={styles.endpointLabel}>
            GET /api/mpox/patients — response.health.go.ug
          </div>
          <div className={styles.toolbarStatus}>
            {query.isLoading
              ? "Loading…"
              : query.isError
                ? "Failed to load"
                : `${patients.length} patient${patients.length !== 1 ? "s" : ""} · ${filtered.length} shown`}
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <button
            className={styles.secondaryButton}
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            type="button"
          >
            {query.isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error */}
      {query.isError ? (
        <div className={styles.errorBanner}>
          {query.error instanceof CifRequestError
            ? query.error.message
            : "The MPOX patient list could not be loaded."}
        </div>
      ) : null}

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total patients</div>
          <div className={styles.summaryValue}>{query.isLoading ? "—" : patients.length}</div>
          <div className={styles.summaryNote}>All records from the response API.</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active</div>
          <div className={styles.summaryValue}>{query.isLoading ? "—" : activeCount}</div>
          <div className={styles.summaryNote}>Currently marked as active.</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Recovered</div>
          <div className={styles.summaryValue}>{query.isLoading ? "—" : recoveredCount}</div>
          <div className={styles.summaryNote}>Already marked as recovered.</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="mpox-search">
            Search
          </label>
          <input
            className={styles.fieldInput}
            id="mpox-search"
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Name, ID, or status…"
            value={searchValue}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="mpox-status">
            Status
          </label>
          <select
            className={styles.fieldSelect}
            id="mpox-status"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {(searchValue || statusFilter !== "all") ? (
          <button className={styles.secondaryButton} onClick={handleReset} type="button">
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Table */}
      {!query.isLoading && !query.isError ? (
        filtered.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Patient name</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.patient_name || "Unnamed patient"}</td>
                    <td>
                      <span className={`${styles.statusPill} ${getStatusClass(patient.status)}`}>
                        {formatStatus(patient.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.stateMessage}>
            No patients matched the current filters.
          </div>
        )
      ) : null}

      {query.isLoading ? (
        <div className={styles.stateMessage}>Loading MPOX patients…</div>
      ) : null}
    </div>
  );
}
