"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useVhfPatients } from "@/src/features/cif/hooks/use-vhf-patients";
import { CifRequestError } from "@/src/features/cif/lib/cif-client";
import type {
  NullableFloatValue,
  NullableIntValue,
  NullableStringValue,
  NullableTimeValue,
  VhfPatient
} from "@/src/features/cif/types/cif";
import styles from "./cif-vhf-workspace.module.css";

const ZERO_DATE = "0001-01-01T00:00:00Z";

function readNullableString(value: NullableStringValue) {
  if (!value.Valid) {
    return "";
  }

  return value.String.trim();
}

function readNullableInt(value: NullableIntValue) {
  return value.Valid ? value.Int32 : null;
}

function readNullableFloat(value: NullableFloatValue) {
  return value.Valid ? value.Float64 : null;
}

function readNullableTime(value: NullableTimeValue) {
  if (!value.Valid || !value.Time || value.Time === ZERO_DATE) {
    return "";
  }

  return value.Time;
}

function formatDateTime(value: string) {
  if (!value || value === ZERO_DATE) {
    return "Not recorded";
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

function formatDateOnly(value: string) {
  if (!value || value === ZERO_DATE) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium"
  }).format(date);
}

function formatPatientName(patient: VhfPatient) {
  return [patient.surname.trim(), patient.other_names.trim()].filter(Boolean).join(" ") || "Unnamed patient";
}

function formatPatientStatus(patient: VhfPatient) {
  return readNullableString(patient.status) || "Unknown";
}

function formatPatientAge(patient: VhfPatient) {
  const years = readNullableInt(patient.age_years);
  const months = readNullableInt(patient.age_months);

  if (years === null && months === null) {
    return "Not recorded";
  }

  return `${years ?? 0}y ${months ?? 0}m`;
}

function formatPatientGender(patient: VhfPatient) {
  return readNullableString(patient.gender) || "Not recorded";
}

function formatCaseCode(patient: VhfPatient) {
  return readNullableString(patient.case_code) || `Patient #${patient.id}`;
}

function formatResidence(patient: VhfPatient) {
  return [
    patient.village_town.trim(),
    patient.parish.trim(),
    patient.subcounty.trim(),
    patient.district.trim()
  ]
    .filter(Boolean)
    .join(", ") || "Not recorded";
}

function formatIllnessLocation(patient: VhfPatient) {
  return [
    patient.ill_village_town.trim(),
    patient.ill_subcounty.trim(),
    patient.ill_district.trim()
  ]
    .filter(Boolean)
    .join(", ") || "Not recorded";
}

function buildPatientSearchText(patient: VhfPatient) {
  return [
    formatCaseCode(patient),
    formatPatientName(patient),
    patient.district,
    patient.subcounty,
    patient.parish,
    readNullableString(patient.reporting_health_facility_name),
    readNullableString(patient.data_capturer_name),
    formatPatientStatus(patient)
  ]
    .join(" ")
    .toLowerCase();
}

function getStatusTone(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "alive") {
    return styles.statusPositive;
  }

  if (normalizedStatus === "dead") {
    return styles.statusWarning;
  }

  return styles.statusMuted;
}

function getValueOrFallback(value: string) {
  return value.trim() || "Not recorded";
}

export function CifVhfWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearchValue = useDeferredValue(searchValue.trim().toLowerCase());

  const vhfPatientsQuery = useVhfPatients();
  const patients = vhfPatientsQuery.data?.patients ?? [];
  const statusOptions = Array.from(
    new Set(
      patients
        .map((patient) => formatPatientStatus(patient))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      !deferredSearchValue || buildPatientSearchText(patient).includes(deferredSearchValue);
    const matchesStatus =
      statusFilter === "all" || formatPatientStatus(patient) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (!filteredPatients.length) {
      setSelectedPatientId(null);
      return;
    }

    if (
      selectedPatientId === null ||
      !filteredPatients.some((patient) => patient.id === selectedPatientId)
    ) {
      setSelectedPatientId(filteredPatients[0]?.id ?? null);
    }
  }, [filteredPatients, selectedPatientId]);

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ?? null;
  const aliveCount = patients.filter((patient) => formatPatientStatus(patient) === "Alive").length;
  const deadCount = patients.filter((patient) => formatPatientStatus(patient) === "Dead").length;
  const caseCodeCount = patients.filter((patient) => Boolean(readNullableString(patient.case_code))).length;
  const districtCount = new Set(patients.map((patient) => patient.district.trim()).filter(Boolean)).size;
  const selectedFacility = selectedPatient
    ? readNullableString(selectedPatient.reporting_health_facility_name)
    : "";
  const selectedCapturer = selectedPatient
    ? readNullableString(selectedPatient.data_capturer_name)
    : "";
  const selectedCapturerPhone = selectedPatient
    ? readNullableString(selectedPatient.data_capturer_phone)
    : "";
  const selectedPhone = selectedPatient
    ? readNullableString(selectedPatient.patient_phone)
    : "";
  const selectedPhoneOwner = selectedPatient
    ? readNullableString(selectedPatient.phone_owner)
    : "";
  const selectedNextOfKin = selectedPatient
    ? readNullableString(selectedPatient.next_of_kin)
    : "";
  const selectedNextOfKinPhone = selectedPatient
    ? readNullableString(selectedPatient.next_of_kin_phone)
    : "";
  const selectedRelationship = selectedPatient
    ? readNullableString(selectedPatient.relationship_to_patient)
    : "";
  const selectedHeadOfHousehold = selectedPatient
    ? readNullableString(selectedPatient.head_of_household)
    : "";
  const selectedDateOfBirth = selectedPatient
    ? readNullableTime(selectedPatient.date_of_birth)
    : "";
  const selectedDateOfDeath = selectedPatient
    ? readNullableTime(selectedPatient.date_of_death)
    : "";
  const selectedResidenceFrom = selectedPatient
    ? readNullableTime(selectedPatient.date_residing_from)
    : "";
  const selectedResidenceTo = selectedPatient
    ? readNullableTime(selectedPatient.date_residing_to)
    : "";
  const selectedLatitude =
    selectedPatient !== null ? readNullableFloat(selectedPatient.latitude) : null;
  const selectedLongitude =
    selectedPatient !== null ? readNullableFloat(selectedPatient.longitude) : null;

  return (
    <section className={styles.workspace}>
      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total patients</div>
          <div className={styles.summaryValue}>{patients.length || "--"}</div>
          <p className={styles.summaryNote}>Live VHF patient registry records from the response API.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Alive</div>
          <div className={styles.summaryValue}>{patients.length ? aliveCount : "--"}</div>
          <p className={styles.summaryNote}>Patients currently marked as alive in the registry.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Dead</div>
          <div className={styles.summaryValue}>{patients.length ? deadCount : "--"}</div>
          <p className={styles.summaryNote}>Records already carrying a deceased outcome status.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Districts covered</div>
          <div className={styles.summaryValue}>{patients.length ? districtCount : "--"}</div>
          <p className={styles.summaryNote}>
            {patients.length ? `${caseCodeCount} records include a case code.` : "Waiting for live data."}
          </p>
        </article>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>VHF Patient Registry</h2>
            <p className={styles.panelCopy}>
              Live records from <code>GET /api/vhf/patients</code> for the <code>CIF &gt; VHF</code> file.
            </p>
          </div>
          <div className={styles.resultMeta}>
            <span>{filteredPatients.length} shown</span>
            <span>{patients.length} total</span>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="vhf-search">
              Search registry
            </label>
            <input
              className={styles.textInput}
              id="vhf-search"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Case code, patient, district, facility, or capturer"
              value={searchValue}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="vhf-status-filter">
              Status filter
            </label>
            <select
              className={styles.selectInput}
              id="vhf-status-filter"
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
        </div>

        {vhfPatientsQuery.isLoading ? (
          <p className={styles.statusMessage}>Loading VHF patients...</p>
        ) : null}

        {vhfPatientsQuery.isError ? (
          <p className={styles.errorMessage}>
            {vhfPatientsQuery.error instanceof CifRequestError
              ? vhfPatientsQuery.error.message
              : "The VHF patient list could not be loaded."}
          </p>
        ) : null}

        {!vhfPatientsQuery.isLoading && !vhfPatientsQuery.isError ? (
          filteredPatients.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Case code</th>
                    <th scope="col">Patient</th>
                    <th scope="col">Age / sex</th>
                    <th scope="col">District</th>
                    <th scope="col">Reporting facility</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => {
                    const isSelected = patient.id === selectedPatientId;
                    const status = formatPatientStatus(patient);
                    const facility = readNullableString(patient.reporting_health_facility_name);

                    return (
                      <tr
                        className={isSelected ? styles.tableRowSelected : undefined}
                        key={patient.id}
                      >
                        <td>
                          <button
                            className={styles.caseButton}
                            onClick={() => setSelectedPatientId(patient.id)}
                            type="button"
                          >
                            <span className={styles.rowPrimary}>{formatCaseCode(patient)}</span>
                            <span className={styles.rowSecondary}>Patient #{patient.id}</span>
                          </button>
                        </td>
                        <td>
                          <div className={styles.rowPrimary}>{formatPatientName(patient)}</div>
                          <div className={styles.rowSecondary}>
                            {getValueOrFallback(readNullableString(patient.next_of_kin))}
                          </div>
                        </td>
                        <td>
                          <div>{formatPatientAge(patient)}</div>
                          <div className={styles.rowSecondary}>{formatPatientGender(patient)}</div>
                        </td>
                        <td>{getValueOrFallback(patient.district)}</td>
                        <td>
                          <div>{getValueOrFallback(facility)}</div>
                          <div className={styles.rowSecondary}>
                            {getValueOrFallback(readNullableString(patient.data_capturer_name))}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${getStatusTone(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td>{formatDateTime(patient.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              No VHF patients matched the current search and status filter.
            </div>
          )
        ) : null}
      </section>

      {selectedPatient ? (
        <section className={styles.panel}>
          <div className={styles.detailHeader}>
            <div>
              <h2 className={styles.panelTitle}>Selected Patient</h2>
              <p className={styles.panelCopy}>
                {formatPatientName(selectedPatient)} . {formatCaseCode(selectedPatient)}
              </p>
            </div>
            <div className={styles.stateStack}>
              <span
                className={`${styles.statusPill} ${getStatusTone(formatPatientStatus(selectedPatient))}`}
              >
                {formatPatientStatus(selectedPatient)}
              </span>
              <span className={`${styles.statusPill} ${styles.statusMuted}`}>
                {formatPatientGender(selectedPatient)}
              </span>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <section className={styles.detailCard}>
              <h3 className={styles.detailTitle}>Identity and Case</h3>
              <dl className={styles.metaGrid}>
                <div>
                  <dt>Patient name</dt>
                  <dd>{formatPatientName(selectedPatient)}</dd>
                </div>
                <div>
                  <dt>Case code</dt>
                  <dd>{formatCaseCode(selectedPatient)}</dd>
                </div>
                <div>
                  <dt>Date of birth</dt>
                  <dd>{formatDateOnly(selectedDateOfBirth)}</dd>
                </div>
                <div>
                  <dt>Age</dt>
                  <dd>{formatPatientAge(selectedPatient)}</dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{formatPatientGender(selectedPatient)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(selectedPatient.created_at)}</dd>
                </div>
                <div>
                  <dt>Date of death</dt>
                  <dd>{formatDateOnly(selectedDateOfDeath)}</dd>
                </div>
                <div>
                  <dt>Occupation</dt>
                  <dd>{getValueOrFallback(selectedPatient.occupation)}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.detailCard}>
              <h3 className={styles.detailTitle}>Contact and Household</h3>
              <dl className={styles.metaGrid}>
                <div>
                  <dt>Patient phone</dt>
                  <dd>{getValueOrFallback(selectedPhone)}</dd>
                </div>
                <div>
                  <dt>Phone owner</dt>
                  <dd>{getValueOrFallback(selectedPhoneOwner)}</dd>
                </div>
                <div>
                  <dt>Next of kin</dt>
                  <dd>{getValueOrFallback(selectedNextOfKin)}</dd>
                </div>
                <div>
                  <dt>Next of kin phone</dt>
                  <dd>{getValueOrFallback(selectedNextOfKinPhone)}</dd>
                </div>
                <div>
                  <dt>Relationship</dt>
                  <dd>{getValueOrFallback(selectedRelationship)}</dd>
                </div>
                <div>
                  <dt>Head of household</dt>
                  <dd>{getValueOrFallback(selectedHeadOfHousehold)}</dd>
                </div>
              </dl>
            </section>

            <section className={`${styles.detailCard} ${styles.detailCardWide}`}>
              <h3 className={styles.detailTitle}>Location and Investigation</h3>
              <dl className={styles.metaGrid}>
                <div>
                  <dt>Reporting facility</dt>
                  <dd>{getValueOrFallback(selectedFacility)}</dd>
                </div>
                <div>
                  <dt>Data capturer</dt>
                  <dd>{getValueOrFallback(selectedCapturer)}</dd>
                </div>
                <div>
                  <dt>Capturer phone</dt>
                  <dd>{getValueOrFallback(selectedCapturerPhone)}</dd>
                </div>
                <div>
                  <dt>Residence</dt>
                  <dd>{formatResidence(selectedPatient)}</dd>
                </div>
                <div>
                  <dt>Country of residence</dt>
                  <dd>{getValueOrFallback(selectedPatient.country_of_residence)}</dd>
                </div>
                <div>
                  <dt>Illness location</dt>
                  <dd>{formatIllnessLocation(selectedPatient)}</dd>
                </div>
                <div>
                  <dt>Residence from</dt>
                  <dd>{formatDateOnly(selectedResidenceFrom)}</dd>
                </div>
                <div>
                  <dt>Residence to</dt>
                  <dd>{formatDateOnly(selectedResidenceTo)}</dd>
                </div>
                <div>
                  <dt>Coordinates</dt>
                  <dd>
                    {selectedLatitude !== null && selectedLongitude !== null
                      ? `${selectedLatitude}, ${selectedLongitude}`
                      : "Not recorded"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </section>
      ) : null}
    </section>
  );
}
