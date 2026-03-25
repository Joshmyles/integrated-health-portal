"use client";

import { useDeferredValue, useState } from "react";
import { usePolioPatients } from "@/src/features/cif/hooks/use-polio-patients";
import { CifRequestError } from "@/src/features/cif/lib/cif-client";
import type { PolioPatient } from "@/src/features/cif/types/cif";
import styles from "./cif-vhf-workspace.module.css";

function formatStatus(status: string) {
  return status.trim() || "Unknown";
}

function buildPatientSearchText(patient: PolioPatient) {
  return [patient.id.toString(), patient.patient_name, formatStatus(patient.status)]
    .join(" ")
    .toLowerCase();
}

function getStatusClass(status: string) {
  const normalizedStatus = formatStatus(status).toLowerCase();

  if (normalizedStatus === "active") {
    return styles.statusPositive;
  }

  if (normalizedStatus === "recovered") {
    return styles.statusMuted;
  }

  return styles.statusWarning;
}

export function CifPolioWorkspace() {
  const [draftOutbreakId, setDraftOutbreakId] = useState("9");
  const [selectedOutbreakId, setSelectedOutbreakId] = useState("9");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  const query = usePolioPatients(selectedOutbreakId);
  const patients = query.data?.polio_patients ?? [];

  const statusOptions = Array.from(new Set(patients.map((patient) => formatStatus(patient.status))))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      !deferredSearch || buildPatientSearchText(patient).includes(deferredSearch);
    const matchesStatus =
      statusFilter === "all" || formatStatus(patient.status) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = patients.filter(
    (patient) => formatStatus(patient.status).toLowerCase() === "active"
  ).length;
  const recoveredCount = patients.filter(
    (patient) => formatStatus(patient.status).toLowerCase() === "recovered"
  ).length;

  function clearFilters() {
    setSearchValue("");
    setStatusFilter("all");
  }

  function loadPatients() {
    setSelectedOutbreakId(draftOutbreakId.trim());
    setSearchValue("");
    setStatusFilter("all");
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Selected outbreak</div>
          <div className={styles.summaryValue}>{selectedOutbreakId || "—"}</div>
          <p className={styles.summaryNote}>The outbreak ID currently loaded into the CIF query.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total patients</div>
          <div className={styles.summaryValue}>
            {selectedOutbreakId && !query.isLoading ? patients.length : "—"}
          </div>
          <p className={styles.summaryNote}>Live rows returned for the selected outbreak.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active</div>
          <div className={styles.summaryValue}>
            {selectedOutbreakId && !query.isLoading ? activeCount : "—"}
          </div>
          <p className={styles.summaryNote}>Patients still marked as active.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Recovered</div>
          <div className={styles.summaryValue}>
            {selectedOutbreakId && !query.isLoading ? recoveredCount : "—"}
          </div>
          <p className={styles.summaryNote}>Patients already marked as recovered.</p>
        </article>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Patient Query</h2>
            <p className={styles.panelCopy}>
              Load polio patients by outbreak ID using the same CIF interface pattern as VHF, with
              a dedicated query panel, results panel, and shared table styling.
            </p>
          </div>
          <div className={styles.resultMeta}>
            <span>{selectedOutbreakId ? `Outbreak ${selectedOutbreakId}` : "Awaiting query"}</span>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="polio-outbreak-id">
              Outbreak ID
            </label>
            <input
              className={styles.textInput}
              id="polio-outbreak-id"
              inputMode="numeric"
              onChange={(event) => setDraftOutbreakId(event.target.value)}
              placeholder="Enter outbreak ID"
              value={draftOutbreakId}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="polio-search">
              Search patients
            </label>
            <input
              className={styles.textInput}
              disabled={!selectedOutbreakId}
              id="polio-search"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by patient ID, name, or status"
              value={searchValue}
            />
          </div>

          <div className={styles.toolbarActions}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="polio-status">
                Status
              </label>
              <select
                className={styles.selectInput}
                disabled={!selectedOutbreakId}
                id="polio-status"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button className={styles.secondaryButton} onClick={loadPatients} type="button">
              Load patients
            </button>
            {(searchValue || statusFilter !== "all") && selectedOutbreakId ? (
              <button className={styles.secondaryButton} onClick={clearFilters} type="button">
                Clear filters
              </button>
            ) : null}
            <button
              className={styles.secondaryButton}
              disabled={!selectedOutbreakId || query.isFetching}
              onClick={() => query.refetch()}
              type="button"
            >
              {query.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {query.isError ? (
          <p className={styles.errorMessage}>
            {query.error instanceof CifRequestError
              ? query.error.message
              : "The polio patient list could not be loaded."}
          </p>
        ) : !selectedOutbreakId ? (
          <p className={styles.statusMessage}>
            Enter an outbreak ID to load the live polio patient list.
          </p>
        ) : (
          <p className={styles.statusMessage}>
            {query.isLoading
              ? `Loading polio patients for outbreak ${selectedOutbreakId}...`
              : `${patients.length} patient${patients.length !== 1 ? "s" : ""} loaded, ${filteredPatients.length} shown after filters.`}
          </p>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Patient Results</h2>
            <p className={styles.panelCopy}>
              Live polio patients for the selected outbreak appear below in the same results view
              used across the VHF CIF workspace.
            </p>
          </div>
          <div className={styles.resultMeta}>
            <span>{selectedOutbreakId || "No outbreak selected"}</span>
            <span>{filteredPatients.length} visible</span>
          </div>
        </div>

        {!selectedOutbreakId ? (
          <div className={styles.emptyState}>
            Select an outbreak ID first to load polio patient records.
          </div>
        ) : query.isLoading ? (
          <div className={styles.emptyState}>Loading polio patients...</div>
        ) : filteredPatients.length ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Patient ID</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className={styles.rowPrimary}>
                          {patient.patient_name || "Unnamed patient"}
                        </div>
                        <div className={styles.rowSecondary}>
                          Outbreak {selectedOutbreakId}
                        </div>
                      </td>
                      <td>{patient.id}</td>
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
            <p className={styles.tableFootnote}>
              This view reflects the live polio patients returned for the outbreak ID you selected.
            </p>
          </>
        ) : (
          <div className={styles.emptyState}>
            No polio patients matched the current filters.
          </div>
        )}
      </section>
    </div>
  );
}
