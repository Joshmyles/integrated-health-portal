"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useState } from "react";
import { useCreateVhfPatient } from "@/src/features/cif/hooks/use-create-vhf-patient";
import { useDeleteVhfPatient } from "@/src/features/cif/hooks/use-delete-vhf-patient";
import { useSaveVhfSection } from "@/src/features/cif/hooks/use-save-vhf-section";
import { useUpdateVhfPatient } from "@/src/features/cif/hooks/use-update-vhf-patient";
import { useVhfPatientDetail } from "@/src/features/cif/hooks/use-vhf-patient-detail";
import { useVhfPatients } from "@/src/features/cif/hooks/use-vhf-patients";
import { CifRequestError } from "@/src/features/cif/lib/cif-client";
import type {
  ClinicalSymptomDateKey,
  ClinicalSymptomDurationKey,
  ClinicalSymptomName,
  JsonObject,
  NullableBoolValue,
  NullableFloatValue,
  NullableIntValue,
  NullableStringValue,
  NullableTimeValue,
  VhfClinicalSigns,
  VhfHospitalization,
  VhfInvestigator,
  VhfLaboratory,
  VhfMutationResponse,
  VhfPatient,
  VhfPatientWritePayload,
  VhfRiskFactors
} from "@/src/features/cif/types/cif";
import { clinicalSymptomNames } from "@/src/features/cif/types/cif";
import styles from "./cif-vhf-workspace.module.css";

const ZERO_DATE = "0001-01-01T00:00:00Z";
const PATIENT_TAB_ID = "patient";

type EditorTab =
  | "overview"
  | "patient"
  | "clinical-signs"
  | "hospitalization"
  | "investigator"
  | "laboratory"
  | "risk-factors";

interface FormFieldConfig<Name extends string> {
  helpText?: string;
  label: string;
  min?: string;
  name: Name;
  options?: readonly string[];
  placeholder?: string;
  rows?: number;
  step?: string;
  type: "checkbox" | "date" | "number" | "select" | "tel" | "text" | "textarea";
}

interface FormSectionConfig<Name extends string> {
  description?: string;
  fields: readonly FormFieldConfig<Name>[];
  title: string;
}

interface ClinicalSymptomDescriptor {
  label: string;
  name: ClinicalSymptomName;
}

interface ClinicalSymptomGroup {
  symptoms: readonly ClinicalSymptomDescriptor[];
  title: string;
}

const editorTabs: ReadonlyArray<{ id: EditorTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: PATIENT_TAB_ID, label: "Patient" },
  { id: "clinical-signs", label: "Clinical signs" },
  { id: "hospitalization", label: "Hospitalization" },
  { id: "investigator", label: "Investigator" },
  { id: "laboratory", label: "Laboratory" },
  { id: "risk-factors", label: "Risk factors" }
];

const patientDirectStringFields = [
  "surname",
  "other_names",
  "country_of_residence",
  "district",
  "ill_district",
  "ill_subcounty",
  "ill_village_town",
  "occupation",
  "parish",
  "subcounty",
  "village_town"
] as const;

const patientNullableStringFields = [
  "case_code",
  "data_capturer_name",
  "data_capturer_phone",
  "gender",
  "head_of_household",
  "next_of_kin",
  "next_of_kin_phone",
  "patient_phone",
  "phone_owner",
  "relationship_to_patient",
  "reporting_health_facility_name",
  "status"
] as const;

const patientNullableIntFields = ["age_months", "age_years"] as const;
const patientNullableFloatFields = ["latitude", "longitude"] as const;
const patientNullableTimeFields = [
  "date_of_birth",
  "date_of_death",
  "date_residing_from",
  "date_residing_to"
] as const;

type PatientFormField =
  | (typeof patientDirectStringFields)[number]
  | (typeof patientNullableStringFields)[number]
  | (typeof patientNullableIntFields)[number]
  | (typeof patientNullableFloatFields)[number]
  | (typeof patientNullableTimeFields)[number];

type PatientFormState = Record<PatientFormField, string>;

type ClinicalSignsFormField =
  | ClinicalSymptomName
  | ClinicalSymptomDateKey
  | ClinicalSymptomDurationKey
  | "date_initial_onset"
  | "temp_source"
  | "temperature";

type ClinicalSignsFormState = Record<ClinicalSignsFormField, boolean | string>;

interface HospitalizationFormState {
  admission_date: string;
  health_facility_name: string;
  hospitalized: boolean;
  in_isolation: boolean;
  isolation_date: string;
}

interface InvestigatorFormState {
  district: string;
  email: string;
  health_facility: string;
  information_source: string;
  investigator_name: string;
  phone: string;
  position: string;
  proxy_name: string;
  proxy_relation: string;
}

interface RiskFactorsFormState {
  contact_dates: string;
  contact_death_date: string;
  contact_district: string;
  contact_name: string;
  contact_relation: string;
  contact_status: string;
  contact_types: string;
  contact_village: string;
  contact_with_case: boolean;
}

type SectionMutationStatus = {
  data?: VhfMutationResponse;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  reset: () => void;
};

const patientFormSections: readonly FormSectionConfig<PatientFormField>[] = [
  {
    title: "Identity and Case",
    description: "Core identifiers and patient outcome fields used throughout the VHF workflow.",
    fields: [
      { name: "surname", label: "Surname", type: "text", placeholder: "Acheng" },
      { name: "other_names", label: "Other names", type: "text", placeholder: "Miriam" },
      { name: "case_code", label: "Case code", type: "text", placeholder: "VHF-20260220-7335" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["", "Female", "Male", "Other", "Unknown"]
      },
      { name: "date_of_birth", label: "Date of birth", type: "date" },
      { name: "age_years", label: "Age in years", type: "number", min: "0" },
      { name: "age_months", label: "Age in months", type: "number", min: "0" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["", "Alive", "Dead", "Unknown"]
      },
      { name: "date_of_death", label: "Date of death", type: "date" },
      { name: "occupation", label: "Occupation", type: "text", placeholder: "Farmer" }
    ]
  },
  {
    title: "Contact and Household",
    fields: [
      { name: "patient_phone", label: "Patient phone", type: "tel" },
      { name: "phone_owner", label: "Phone owner", type: "text" },
      { name: "next_of_kin", label: "Next of kin", type: "text" },
      { name: "next_of_kin_phone", label: "Next of kin phone", type: "tel" },
      { name: "relationship_to_patient", label: "Relationship", type: "text" },
      { name: "head_of_household", label: "Head of household", type: "text" }
    ]
  },
  {
    title: "Reporting and Capture",
    fields: [
      { name: "data_capturer_name", label: "Data capturer", type: "text" },
      { name: "data_capturer_phone", label: "Capturer phone", type: "tel" },
      {
        name: "reporting_health_facility_name",
        label: "Reporting health facility",
        type: "text"
      }
    ]
  },
  {
    title: "Residence",
    fields: [
      { name: "village_town", label: "Village / town", type: "text" },
      { name: "parish", label: "Parish", type: "text" },
      { name: "subcounty", label: "Subcounty", type: "text" },
      { name: "district", label: "District", type: "text" },
      { name: "country_of_residence", label: "Country of residence", type: "text" },
      { name: "latitude", label: "Latitude", type: "number", step: "any" },
      { name: "longitude", label: "Longitude", type: "number", step: "any" },
      { name: "date_residing_from", label: "Residence from", type: "date" },
      { name: "date_residing_to", label: "Residence to", type: "date" }
    ]
  },
  {
    title: "Illness Location",
    fields: [
      { name: "ill_village_town", label: "Ill village / town", type: "text" },
      { name: "ill_subcounty", label: "Ill subcounty", type: "text" },
      { name: "ill_district", label: "Ill district", type: "text" }
    ]
  }
] as const;

const hospitalizationSections: readonly FormSectionConfig<keyof HospitalizationFormState>[] = [
  {
    title: "Admission and Isolation",
    description: "Capture whether the patient has been admitted or placed under isolation.",
    fields: [
      { name: "hospitalized", label: "Hospitalized", type: "checkbox" },
      { name: "admission_date", label: "Admission date", type: "date" },
      {
        name: "health_facility_name",
        label: "Health facility name",
        type: "text"
      },
      { name: "in_isolation", label: "In isolation", type: "checkbox" },
      { name: "isolation_date", label: "Isolation date", type: "date" }
    ]
  }
] as const;

const investigatorSections: readonly FormSectionConfig<keyof InvestigatorFormState>[] = [
  {
    title: "Investigator Details",
    fields: [
      { name: "investigator_name", label: "Investigator name", type: "text" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "email", label: "Email", type: "text" },
      { name: "position", label: "Position", type: "text" },
      { name: "district", label: "District", type: "text" },
      { name: "health_facility", label: "Health facility", type: "text" }
    ]
  },
  {
    title: "Information Source",
    fields: [
      {
        name: "information_source",
        label: "Information source",
        type: "select",
        options: ["", "Patient", "Proxy", "Medical record", "Other"]
      },
      { name: "proxy_name", label: "Proxy name", type: "text" },
      { name: "proxy_relation", label: "Proxy relation", type: "text" }
    ]
  }
] as const;

const riskFactorsSections: readonly FormSectionConfig<keyof RiskFactorsFormState>[] = [
  {
    title: "Exposure History",
    description: "Use this section to document contact history and related exposure notes.",
    fields: [
      { name: "contact_with_case", label: "Contact with a case", type: "checkbox" },
      { name: "contact_name", label: "Contact name", type: "text" },
      { name: "contact_relation", label: "Contact relation", type: "text" },
      {
        name: "contact_dates",
        label: "Contact dates",
        type: "textarea",
        rows: 3,
        placeholder: "List dates or date ranges"
      },
      { name: "contact_village", label: "Contact village", type: "text" },
      { name: "contact_district", label: "Contact district", type: "text" },
      { name: "contact_status", label: "Contact status", type: "text" },
      { name: "contact_death_date", label: "Contact death date", type: "date" },
      {
        name: "contact_types",
        label: "Contact types",
        type: "textarea",
        rows: 3,
        placeholder: "Physical contact, caregiving, burial, shared household, and similar notes"
      }
    ]
  }
] as const;

const clinicalSymptomGroups = [
  {
    title: "General Symptoms",
    symptoms: [
      { name: "fever", label: "Fever" },
      { name: "vomiting", label: "Vomiting" },
      { name: "nausea", label: "Nausea" },
      { name: "diarrhea", label: "Diarrhea" },
      {
        name: "intense_fatigue_general_weakness",
        label: "Intense fatigue / general weakness"
      }
    ]
  },
  {
    title: "Pain and Body Symptoms",
    symptoms: [
      { name: "epigastric_pain", label: "Epigastric pain" },
      { name: "lower_abdominal_pain", label: "Lower abdominal pain" },
      { name: "chest_pain", label: "Chest pain" },
      { name: "muscle_pain", label: "Muscle pain" },
      { name: "joint_pain", label: "Joint pain" },
      { name: "headache", label: "Headache" }
    ]
  },
  {
    title: "Respiratory and ENT",
    symptoms: [
      { name: "cough", label: "Cough" },
      { name: "difficulty_breathing", label: "Difficulty breathing" },
      { name: "difficulty_swallowing", label: "Difficulty swallowing" },
      { name: "sore_throat", label: "Sore throat" },
      { name: "hiccups", label: "Hiccups" }
    ]
  },
  {
    title: "Eyes, Skin, and Neurologic",
    symptoms: [
      { name: "jaundice", label: "Jaundice" },
      { name: "conjunctivitis", label: "Conjunctivitis" },
      { name: "skin_rash", label: "Skin rash" },
      { name: "pain_behind_eyes", label: "Pain behind the eyes" },
      { name: "sensitive_to_light", label: "Sensitive to light" },
      { name: "coma_unconscious", label: "Coma / unconsciousness" },
      { name: "confused_or_disoriented", label: "Confused or disoriented" },
      { name: "convulsions", label: "Convulsions" }
    ]
  },
  {
    title: "Hemorrhagic Symptoms",
    symptoms: [
      { name: "unexplained_bleeding", label: "Unexplained bleeding" },
      { name: "bleeding_of_the_gums", label: "Bleeding of the gums" },
      {
        name: "bleeding_from_injection_site",
        label: "Bleeding from injection site"
      },
      { name: "nose_bleed_epistaxis", label: "Nose bleed / epistaxis" },
      { name: "bloody_stool", label: "Bloody stool" },
      { name: "blood_in_vomit", label: "Blood in vomit" },
      {
        name: "coughing_up_blood_hemoptysis",
        label: "Coughing up blood / hemoptysis"
      },
      { name: "bleeding_from_vagina", label: "Bleeding from vagina" },
      { name: "bruising_of_the_skin", label: "Bruising of the skin" },
      { name: "blood_in_urine", label: "Blood in urine" },
      {
        name: "other_hemorrhagic_symptoms",
        label: "Other hemorrhagic symptoms"
      }
    ]
  }
] as const satisfies readonly ClinicalSymptomGroup[];

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

  return value.Time.slice(0, 10);
}

function readNullableBool(value: NullableBoolValue) {
  return value.Valid ? value.Bool : false;
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

function formatPatientName(patient: Pick<VhfPatient, "other_names" | "surname">) {
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

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof CifRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getMutationSuccessMessage(
  payload: VhfMutationResponse | undefined,
  fallback: string
) {
  if (payload?.message) {
    return payload.message;
  }

  return fallback;
}

function extractPatientId(payload: VhfMutationResponse | undefined) {
  if (!payload) {
    return null;
  }

  if (typeof payload.id === "number") {
    return payload.id;
  }

  if (typeof payload.patient_id === "number") {
    return payload.patient_id;
  }

  if (isJsonObject(payload.patient) && typeof payload.patient.id === "number") {
    return payload.patient.id;
  }

  return null;
}

function toNullableString(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function toRequiredString(value: string) {
  return value.trim();
}

function toNullableNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toNullableDate(value: string) {
  return value || null;
}

function createEmptyPatientFormState(): PatientFormState {
  const state = {} as PatientFormState;

  for (const field of patientDirectStringFields) {
    state[field] = "";
  }

  for (const field of patientNullableStringFields) {
    state[field] = "";
  }

  for (const field of patientNullableIntFields) {
    state[field] = "";
  }

  for (const field of patientNullableFloatFields) {
    state[field] = "";
  }

  for (const field of patientNullableTimeFields) {
    state[field] = "";
  }

  return state;
}

function createPatientFormState(patient: VhfPatient | null): PatientFormState {
  const state = createEmptyPatientFormState();

  if (!patient) {
    return state;
  }

  for (const field of patientDirectStringFields) {
    state[field] = patient[field].trim();
  }

  for (const field of patientNullableStringFields) {
    state[field] = readNullableString(patient[field]);
  }

  for (const field of patientNullableIntFields) {
    const value = readNullableInt(patient[field]);
    state[field] = value === null ? "" : String(value);
  }

  for (const field of patientNullableFloatFields) {
    const value = readNullableFloat(patient[field]);
    state[field] = value === null ? "" : String(value);
  }

  for (const field of patientNullableTimeFields) {
    state[field] = readNullableTime(patient[field]);
  }

  return state;
}

function buildPatientPayload(state: PatientFormState): VhfPatientWritePayload {
  const payload: VhfPatientWritePayload = {};

  for (const field of patientDirectStringFields) {
    payload[field] = toRequiredString(state[field]);
  }

  for (const field of patientNullableStringFields) {
    payload[field] = toNullableString(state[field]);
  }

  for (const field of patientNullableIntFields) {
    payload[field] = toNullableNumber(state[field]);
  }

  for (const field of patientNullableFloatFields) {
    payload[field] = toNullableNumber(state[field]);
  }

  for (const field of patientNullableTimeFields) {
    payload[field] = toNullableDate(state[field]);
  }

  return payload;
}

function validatePatientFormState(state: PatientFormState) {
  if (![state.surname, state.other_names, state.case_code].some((value) => value.trim())) {
    return "Enter at least a surname, other names, or case code before saving.";
  }

  return null;
}

function createEmptyClinicalSignsFormState(): ClinicalSignsFormState {
  const state = {
    date_initial_onset: "",
    temp_source: "",
    temperature: ""
  } as ClinicalSignsFormState;

  for (const symptom of clinicalSymptomNames) {
    state[symptom] = false;
    state[`date_${symptom}` as ClinicalSymptomDateKey] = "";
    state[`duration_${symptom}` as ClinicalSymptomDurationKey] = "";
  }

  return state;
}

function createClinicalSignsFormState(
  clinicalSigns: VhfClinicalSigns | null
): ClinicalSignsFormState {
  const state = createEmptyClinicalSignsFormState();

  if (!clinicalSigns) {
    return state;
  }

  state.date_initial_onset = readNullableTime(clinicalSigns.date_initial_onset);
  state.temp_source = readNullableString(clinicalSigns.temp_source);
  state.temperature =
    readNullableFloat(clinicalSigns.temperature) === null
      ? ""
      : String(readNullableFloat(clinicalSigns.temperature));

  for (const symptom of clinicalSymptomNames) {
    const dateField = `date_${symptom}` as ClinicalSymptomDateKey;
    const durationField = `duration_${symptom}` as ClinicalSymptomDurationKey;
    const durationValue = readNullableInt(clinicalSigns[durationField]);

    state[symptom] = readNullableBool(clinicalSigns[symptom]);
    state[dateField] = readNullableTime(clinicalSigns[dateField]);
    state[durationField] = durationValue === null ? "" : String(durationValue);
  }

  return state;
}

function buildClinicalSignsPayload(state: ClinicalSignsFormState): JsonObject {
  const payload: JsonObject = {
    date_initial_onset: toNullableDate(String(state.date_initial_onset)),
    temp_source: toNullableString(String(state.temp_source)),
    temperature: toNullableNumber(String(state.temperature))
  };

  for (const symptom of clinicalSymptomNames) {
    const dateField = `date_${symptom}` as ClinicalSymptomDateKey;
    const durationField = `duration_${symptom}` as ClinicalSymptomDurationKey;

    payload[symptom] = Boolean(state[symptom]);
    payload[dateField] = toNullableDate(String(state[dateField]));
    payload[durationField] = toNullableNumber(String(state[durationField]));
  }

  return payload;
}

function countPositiveClinicalSigns(clinicalSigns: VhfClinicalSigns | null) {
  if (!clinicalSigns) {
    return 0;
  }

  return clinicalSymptomNames.reduce((count, symptom) => {
    return count + (readNullableBool(clinicalSigns[symptom]) ? 1 : 0);
  }, 0);
}

function createEmptyHospitalizationFormState(): HospitalizationFormState {
  return {
    admission_date: "",
    health_facility_name: "",
    hospitalized: false,
    in_isolation: false,
    isolation_date: ""
  };
}

function createHospitalizationFormState(
  hospitalization: VhfHospitalization | null
): HospitalizationFormState {
  if (!hospitalization) {
    return createEmptyHospitalizationFormState();
  }

  return {
    admission_date: readNullableTime(hospitalization.admission_date),
    health_facility_name: hospitalization.health_facility_name,
    hospitalized: hospitalization.hospitalized,
    in_isolation: hospitalization.in_isolation,
    isolation_date: readNullableTime(hospitalization.isolation_date)
  };
}

function buildHospitalizationPayload(state: HospitalizationFormState): JsonObject {
  return {
    admission_date: toNullableDate(state.admission_date),
    health_facility_name: toRequiredString(state.health_facility_name),
    hospitalized: state.hospitalized,
    in_isolation: state.in_isolation,
    isolation_date: toNullableDate(state.isolation_date)
  };
}

function createEmptyInvestigatorFormState(): InvestigatorFormState {
  return {
    district: "",
    email: "",
    health_facility: "",
    information_source: "",
    investigator_name: "",
    phone: "",
    position: "",
    proxy_name: "",
    proxy_relation: ""
  };
}

function createInvestigatorFormState(
  investigator: VhfInvestigator | null
): InvestigatorFormState {
  if (!investigator) {
    return createEmptyInvestigatorFormState();
  }

  return {
    district: investigator.district,
    email: investigator.email,
    health_facility: investigator.health_facility,
    information_source: investigator.information_source,
    investigator_name: investigator.investigator_name,
    phone: investigator.phone,
    position: investigator.position,
    proxy_name: investigator.proxy_name,
    proxy_relation: investigator.proxy_relation
  };
}

function buildInvestigatorPayload(state: InvestigatorFormState): JsonObject {
  return {
    district: toRequiredString(state.district),
    email: toRequiredString(state.email),
    health_facility: toRequiredString(state.health_facility),
    information_source: toRequiredString(state.information_source),
    investigator_name: toRequiredString(state.investigator_name),
    phone: toRequiredString(state.phone),
    position: toRequiredString(state.position),
    proxy_name: toRequiredString(state.proxy_name),
    proxy_relation: toRequiredString(state.proxy_relation)
  };
}

function createEmptyRiskFactorsFormState(): RiskFactorsFormState {
  return {
    contact_dates: "",
    contact_death_date: "",
    contact_district: "",
    contact_name: "",
    contact_relation: "",
    contact_status: "",
    contact_types: "",
    contact_village: "",
    contact_with_case: false
  };
}

function createRiskFactorsFormState(riskFactors: VhfRiskFactors | null): RiskFactorsFormState {
  if (!riskFactors) {
    return createEmptyRiskFactorsFormState();
  }

  return {
    contact_dates: riskFactors.contact_dates,
    contact_death_date: readNullableTime(riskFactors.contact_death_date),
    contact_district: riskFactors.contact_district,
    contact_name: riskFactors.contact_name,
    contact_relation: riskFactors.contact_relation,
    contact_status: riskFactors.contact_status,
    contact_types: riskFactors.contact_types,
    contact_village: riskFactors.contact_village,
    contact_with_case: readNullableBool(riskFactors.contact_with_case)
  };
}

function buildRiskFactorsPayload(state: RiskFactorsFormState): JsonObject {
  return {
    contact_dates: state.contact_dates.trim(),
    contact_death_date: toNullableDate(state.contact_death_date),
    contact_district: toRequiredString(state.contact_district),
    contact_name: toRequiredString(state.contact_name),
    contact_relation: toRequiredString(state.contact_relation),
    contact_status: toRequiredString(state.contact_status),
    contact_types: state.contact_types.trim(),
    contact_village: toRequiredString(state.contact_village),
    contact_with_case: state.contact_with_case
  };
}

function formatLaboratoryPayload(value: VhfLaboratory) {
  if (!value || !Object.keys(value).length) {
    return "{}";
  }

  return JSON.stringify(value, null, 2);
}

function parseLaboratoryPayload(value: string): JsonObject {
  const trimmedValue = value.trim();
  const normalizedValue = trimmedValue || "{}";

  const parsedValue = JSON.parse(normalizedValue) as unknown;

  if (!isJsonObject(parsedValue)) {
    throw new Error("The laboratory payload must be a JSON object.");
  }

  return parsedValue;
}

function renderField<Name extends string>(props: {
  field: FormFieldConfig<Name>;
  onChange: (name: Name, value: boolean | string) => void;
  value: boolean | string;
}) {
  const { field, onChange, value } = props;
  const fieldId = `vhf-${field.name}`;

  if (field.type === "checkbox") {
    return (
      <div className={styles.checkboxField} key={field.name}>
        <label className={styles.checkboxLabel} htmlFor={fieldId}>
          <input
            checked={Boolean(value)}
            id={fieldId}
            onChange={(event) => onChange(field.name, event.target.checked)}
            type="checkbox"
          />
          <span>{field.label}</span>
        </label>
        {field.helpText ? <p className={styles.fieldHint}>{field.helpText}</p> : null}
      </div>
    );
  }

  return (
    <div className={styles.fieldGroup} key={field.name}>
      <label className={styles.fieldLabel} htmlFor={fieldId}>
        {field.label}
      </label>

      {field.type === "textarea" ? (
        <textarea
          className={styles.textArea}
          id={fieldId}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 4}
          value={String(value)}
        />
      ) : field.type === "select" ? (
        <select
          className={styles.selectInput}
          id={fieldId}
          onChange={(event) => onChange(field.name, event.target.value)}
          value={String(value)}
        >
          {field.options?.map((option) => (
            <option key={option || "__blank"} value={option}>
              {option || "Select"}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={styles.textInput}
          id={fieldId}
          min={field.min}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          step={field.step}
          type={field.type}
          value={String(value)}
        />
      )}

      {field.helpText ? <p className={styles.fieldHint}>{field.helpText}</p> : null}
    </div>
  );
}

export function CifVhfWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuPatientId, setOpenMenuPatientId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("overview");
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [patientFormState, setPatientFormState] = useState<PatientFormState>(
    createEmptyPatientFormState()
  );
  const [patientFormError, setPatientFormError] = useState<string | null>(null);
  const [clinicalSignsFormState, setClinicalSignsFormState] = useState<ClinicalSignsFormState>(
    createEmptyClinicalSignsFormState()
  );
  const [hospitalizationFormState, setHospitalizationFormState] =
    useState<HospitalizationFormState>(createEmptyHospitalizationFormState());
  const [investigatorFormState, setInvestigatorFormState] = useState<InvestigatorFormState>(
    createEmptyInvestigatorFormState()
  );
  const [riskFactorsFormState, setRiskFactorsFormState] = useState<RiskFactorsFormState>(
    createEmptyRiskFactorsFormState()
  );
  const [laboratoryPayload, setLaboratoryPayload] = useState("{}");
  const [laboratoryError, setLaboratoryError] = useState<string | null>(null);
  const deferredSearchValue = useDeferredValue(searchValue.trim().toLowerCase());

  const vhfPatientsQuery = useVhfPatients();
  const detailQuery = useVhfPatientDetail(
    isModalOpen && !isCreateMode ? selectedPatientId : null
  );
  const createPatientMutation = useCreateVhfPatient();
  const updatePatientMutation = useUpdateVhfPatient();
  const deletePatientMutation = useDeleteVhfPatient();
  const clinicalSignsMutation = useSaveVhfSection("clinical-signs");
  const hospitalizationMutation = useSaveVhfSection("hospitalization");
  const investigatorMutation = useSaveVhfSection("investigator");
  const laboratoryMutation = useSaveVhfSection("laboratory");
  const riskFactorsMutation = useSaveVhfSection("risk-factors");

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

  const selectedPatient =
    detailQuery.data?.patient ??
    patients.find((patient) => patient.id === selectedPatientId) ??
    null;
  const aliveCount = patients.filter((patient) => formatPatientStatus(patient) === "Alive").length;
  const deadCount = patients.filter((patient) => formatPatientStatus(patient) === "Dead").length;
  const caseCodeCount = patients.filter((patient) => Boolean(readNullableString(patient.case_code))).length;
  const districtCount = new Set(patients.map((patient) => patient.district.trim()).filter(Boolean)).size;
  const detailSectionsSaved = detailQuery.data
    ? [
        Boolean(detailQuery.data.clinical_signs),
        Boolean(detailQuery.data.hospitalization),
        Boolean(detailQuery.data.investigator),
        Boolean(detailQuery.data.risk_factors),
        Boolean(detailQuery.data.laboratory && Object.keys(detailQuery.data.laboratory).length)
      ].filter(Boolean).length
    : 0;
  const activeClinicalSignsCount = countPositiveClinicalSigns(detailQuery.data?.clinical_signs ?? null);
  const patientMutation = isCreateMode ? createPatientMutation : updatePatientMutation;
  const patientMutationError = patientMutation.isError
    ? getMutationErrorMessage(
        patientMutation.error,
        isCreateMode
          ? "The VHF case could not be created."
          : "The VHF patient record could not be updated."
      )
    : null;
  const patientMutationSuccess = patientMutation.isSuccess
    ? getMutationSuccessMessage(
        patientMutation.data,
        isCreateMode ? "VHF case created." : "VHF patient saved."
      )
    : null;
  const detailLoadingMessage =
    detailQuery.isLoading && !isCreateMode ? "Loading the selected VHF case bundle..." : null;
  const detailErrorMessage =
    detailQuery.isError && !isCreateMode
      ? getMutationErrorMessage(
          detailQuery.error,
          "The selected VHF case could not be loaded."
        )
      : null;
  const modalTitle = isCreateMode
    ? "Create VHF Case"
    : selectedPatient
      ? `${formatPatientName(selectedPatient)} . ${formatCaseCode(selectedPatient)}`
      : "VHF Case";
  const modalSubtitle = isCreateMode
    ? "Save the patient record first, then continue through the remaining CIF sections."
    : activeTab === "overview"
      ? "Live CIF bundle for the selected VHF case."
      : `${editorTabs.find((tab) => tab.id === activeTab)?.label ?? "Case"} editor`;

  function resetSectionMutationFeedback() {
    clinicalSignsMutation.reset();
    hospitalizationMutation.reset();
    investigatorMutation.reset();
    laboratoryMutation.reset();
    riskFactorsMutation.reset();
  }

  function resetAllFormState() {
    setPatientFormState(createEmptyPatientFormState());
    setClinicalSignsFormState(createEmptyClinicalSignsFormState());
    setHospitalizationFormState(createEmptyHospitalizationFormState());
    setInvestigatorFormState(createEmptyInvestigatorFormState());
    setRiskFactorsFormState(createEmptyRiskFactorsFormState());
    setLaboratoryPayload("{}");
  }

  function clearCaseFeedback(options?: { keepDeleteFeedback?: boolean }) {
    setPatientFormError(null);
    setLaboratoryError(null);
    createPatientMutation.reset();
    updatePatientMutation.reset();
    resetSectionMutationFeedback();

    if (!options?.keepDeleteFeedback) {
      deletePatientMutation.reset();
    }
  }

  function closeCaseModal(options?: { keepDeleteFeedback?: boolean }) {
    setIsModalOpen(false);
    setIsCreateMode(false);
    setSelectedPatientId(null);
    setOpenMenuPatientId(null);
    setActiveTab("overview");
    resetAllFormState();
    clearCaseFeedback(options);
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuPatientId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (openMenuPatientId !== null) {
        setOpenMenuPatientId(null);
        return;
      }

      if (isModalOpen) {
        closeCaseModal();
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, openMenuPatientId]);

  useEffect(() => {
    if (!isModalOpen || isCreateMode) {
      return;
    }

    setPatientFormState(createPatientFormState(detailQuery.data?.patient ?? null));
    setClinicalSignsFormState(createClinicalSignsFormState(detailQuery.data?.clinical_signs ?? null));
    setHospitalizationFormState(
      createHospitalizationFormState(detailQuery.data?.hospitalization ?? null)
    );
    setInvestigatorFormState(createInvestigatorFormState(detailQuery.data?.investigator ?? null));
    setRiskFactorsFormState(createRiskFactorsFormState(detailQuery.data?.risk_factors ?? null));
    setLaboratoryPayload(formatLaboratoryPayload(detailQuery.data?.laboratory ?? null));
    setPatientFormError(null);
    setLaboratoryError(null);
  }, [detailQuery.data, isCreateMode, isModalOpen]);

  function openCaseModal(patientId: number, tab: EditorTab = "overview") {
    setOpenMenuPatientId(null);
    setSelectedPatientId(patientId);
    setIsCreateMode(false);
    setIsModalOpen(true);
    setActiveTab(tab);
    clearCaseFeedback();
  }

  function startCreateMode() {
    setOpenMenuPatientId(null);
    setSelectedPatientId(null);
    setIsCreateMode(true);
    setIsModalOpen(true);
    setActiveTab("patient");
    resetAllFormState();
    clearCaseFeedback();
  }

  function cancelCreateMode() {
    closeCaseModal();
  }

  function handlePatientFieldChange(name: PatientFormField, value: string) {
    setPatientFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));
    setPatientFormError(null);
    createPatientMutation.reset();
    updatePatientMutation.reset();
  }

  function handleClinicalSignsFieldChange(name: ClinicalSignsFormField, value: boolean | string) {
    setClinicalSignsFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));
    clinicalSignsMutation.reset();
  }

  function handleHospitalizationFieldChange(
    name: keyof HospitalizationFormState,
    value: boolean | string
  ) {
    setHospitalizationFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));
    hospitalizationMutation.reset();
  }

  function handleInvestigatorFieldChange(
    name: keyof InvestigatorFormState,
    value: boolean | string
  ) {
    setInvestigatorFormState((currentState) => ({
      ...currentState,
      [name]: String(value)
    }));
    investigatorMutation.reset();
  }

  function handleRiskFactorsFieldChange(
    name: keyof RiskFactorsFormState,
    value: boolean | string
  ) {
    setRiskFactorsFormState((currentState) => ({
      ...currentState,
      [name]: typeof currentState[name] === "boolean" ? Boolean(value) : String(value)
    }));
    riskFactorsMutation.reset();
  }

  function resetPatientForm() {
    if (isCreateMode) {
      setPatientFormState(createEmptyPatientFormState());
      setPatientFormError(null);
      createPatientMutation.reset();
      return;
    }

    setPatientFormState(createPatientFormState(detailQuery.data?.patient ?? null));
    setPatientFormError(null);
    updatePatientMutation.reset();
  }

  function resetClinicalSignsForm() {
    setClinicalSignsFormState(createClinicalSignsFormState(detailQuery.data?.clinical_signs ?? null));
    clinicalSignsMutation.reset();
  }

  function resetHospitalizationForm() {
    setHospitalizationFormState(
      createHospitalizationFormState(detailQuery.data?.hospitalization ?? null)
    );
    hospitalizationMutation.reset();
  }

  function resetInvestigatorForm() {
    setInvestigatorFormState(createInvestigatorFormState(detailQuery.data?.investigator ?? null));
    investigatorMutation.reset();
  }

  function resetRiskFactorsForm() {
    setRiskFactorsFormState(createRiskFactorsFormState(detailQuery.data?.risk_factors ?? null));
    riskFactorsMutation.reset();
  }

  function resetLaboratoryForm() {
    setLaboratoryPayload(formatLaboratoryPayload(detailQuery.data?.laboratory ?? null));
    setLaboratoryError(null);
    laboratoryMutation.reset();
  }

  async function handlePatientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validatePatientFormState(patientFormState);

    if (validationError) {
      setPatientFormError(validationError);
      return;
    }

    const payload = buildPatientPayload(patientFormState);

    try {
      if (isCreateMode) {
        const response = await createPatientMutation.mutateAsync(payload);
        const createdPatientId = extractPatientId(response);

        setSearchValue("");
        setStatusFilter("all");

        if (createdPatientId !== null) {
          setSelectedPatientId(createdPatientId);
          setIsCreateMode(false);
          setActiveTab("overview");
          return;
        }

        closeCaseModal();
      } else if (selectedPatientId !== null) {
        await updatePatientMutation.mutateAsync({
          patientId: selectedPatientId,
          payload
        });
      }
    } catch {
      return;
    }
  }

  async function handleDeleteCase(targetPatient?: VhfPatient | null) {
    const patientToDelete = targetPatient ?? selectedPatient;

    if (!patientToDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${formatPatientName(patientToDelete)} (${formatCaseCode(patientToDelete)})?`
    );

    if (!confirmed) {
      return;
    }

    setOpenMenuPatientId(null);

    try {
      await deletePatientMutation.mutateAsync(patientToDelete.id);

      if (selectedPatientId === patientToDelete.id) {
        closeCaseModal({ keepDeleteFeedback: true });
      }
    } catch {
      return;
    }
  }

  async function handleClinicalSignsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedPatientId === null) {
      return;
    }

    try {
      await clinicalSignsMutation.mutateAsync({
        patientId: selectedPatientId,
        payload: buildClinicalSignsPayload(clinicalSignsFormState)
      });
    } catch {
      return;
    }
  }

  async function handleHospitalizationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedPatientId === null) {
      return;
    }

    try {
      await hospitalizationMutation.mutateAsync({
        patientId: selectedPatientId,
        payload: buildHospitalizationPayload(hospitalizationFormState)
      });
    } catch {
      return;
    }
  }

  async function handleInvestigatorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedPatientId === null) {
      return;
    }

    try {
      await investigatorMutation.mutateAsync({
        patientId: selectedPatientId,
        payload: buildInvestigatorPayload(investigatorFormState)
      });
    } catch {
      return;
    }
  }

  async function handleRiskFactorsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedPatientId === null) {
      return;
    }

    try {
      await riskFactorsMutation.mutateAsync({
        patientId: selectedPatientId,
        payload: buildRiskFactorsPayload(riskFactorsFormState)
      });
    } catch {
      return;
    }
  }

  async function handleLaboratorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedPatientId === null) {
      return;
    }

    try {
      const payload = parseLaboratoryPayload(laboratoryPayload);
      setLaboratoryError(null);

      await laboratoryMutation.mutateAsync({
        patientId: selectedPatientId,
        payload
      });
    } catch (error) {
      if (error instanceof Error && error.message === "The laboratory payload must be a JSON object.") {
        setLaboratoryError(error.message);
      } else if (error instanceof SyntaxError) {
        setLaboratoryError("Enter a valid JSON object for the laboratory payload.");
      }
    }
  }

  function renderSectionFeedback(
    mutation: SectionMutationStatus,
    pendingMessage: string,
    successMessage: string,
    errorMessage: string
  ) {
    return (
      <>
        {mutation.isPending ? (
          <p className={styles.statusMessage}>{pendingMessage}</p>
        ) : null}
        {mutation.isError ? (
          <p className={styles.errorMessage}>
            {getMutationErrorMessage(mutation.error, errorMessage)}
          </p>
        ) : null}
        {mutation.isSuccess ? (
          <p className={styles.successMessage}>
            {getMutationSuccessMessage(mutation.data, successMessage)}
          </p>
        ) : null}
      </>
    );
  }

  function renderOverviewContent() {
    if (!detailQuery.data) {
      return null;
    }

    return (
      <div className={styles.editorStack}>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Sections saved</div>
            <div className={styles.summaryValue}>{detailSectionsSaved}/5</div>
            <p className={styles.summaryNote}>CIF section coverage for the selected case.</p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Positive clinical signs</div>
            <div className={styles.summaryValue}>{activeClinicalSignsCount}</div>
            <p className={styles.summaryNote}>
              Count of signs currently marked as present.
            </p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Hospitalization</div>
            <div className={styles.summaryValue}>
              {detailQuery.data.hospitalization?.hospitalized ? "Yes" : "No"}
            </div>
            <p className={styles.summaryNote}>
              Isolation: {detailQuery.data.hospitalization?.in_isolation ? "Yes" : "No"}
            </p>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Risk contact</div>
            <div className={styles.summaryValue}>
              {detailQuery.data.risk_factors?.contact_with_case.Valid
                ? detailQuery.data.risk_factors.contact_with_case.Bool
                  ? "Yes"
                  : "No"
                : "--"}
            </div>
            <p className={styles.summaryNote}>Quick read on case exposure history.</p>
          </article>
        </div>

        <div className={styles.detailGrid}>
          <section className={styles.detailCard}>
            <h3 className={styles.detailTitle}>Identity and Case</h3>
            <dl className={styles.metaGrid}>
              <div>
                <dt>Patient name</dt>
                <dd>{formatPatientName(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Case code</dt>
                <dd>{formatCaseCode(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Date of birth</dt>
                <dd>{formatDateOnly(readNullableTime(detailQuery.data.patient.date_of_birth))}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{formatPatientAge(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{formatPatientGender(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{formatPatientStatus(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(detailQuery.data.patient.created_at)}</dd>
              </div>
              <div>
                <dt>Date of death</dt>
                <dd>{formatDateOnly(readNullableTime(detailQuery.data.patient.date_of_death))}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.detailCard}>
            <h3 className={styles.detailTitle}>Contact and Household</h3>
            <dl className={styles.metaGrid}>
              <div>
                <dt>Patient phone</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.patient_phone))}</dd>
              </div>
              <div>
                <dt>Phone owner</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.phone_owner))}</dd>
              </div>
              <div>
                <dt>Next of kin</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.next_of_kin))}</dd>
              </div>
              <div>
                <dt>Next of kin phone</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.next_of_kin_phone))}</dd>
              </div>
              <div>
                <dt>Relationship</dt>
                <dd>
                  {getValueOrFallback(
                    readNullableString(detailQuery.data.patient.relationship_to_patient)
                  )}
                </dd>
              </div>
              <div>
                <dt>Head of household</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.head_of_household))}</dd>
              </div>
            </dl>
          </section>

          <section className={`${styles.detailCard} ${styles.detailCardWide}`}>
            <h3 className={styles.detailTitle}>Location and Coordination</h3>
            <dl className={styles.metaGrid}>
              <div>
                <dt>Reporting facility</dt>
                <dd>
                  {getValueOrFallback(
                    readNullableString(detailQuery.data.patient.reporting_health_facility_name)
                  )}
                </dd>
              </div>
              <div>
                <dt>Data capturer</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.data_capturer_name))}</dd>
              </div>
              <div>
                <dt>Capturer phone</dt>
                <dd>{getValueOrFallback(readNullableString(detailQuery.data.patient.data_capturer_phone))}</dd>
              </div>
              <div>
                <dt>Residence</dt>
                <dd>{formatResidence(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Country of residence</dt>
                <dd>{getValueOrFallback(detailQuery.data.patient.country_of_residence)}</dd>
              </div>
              <div>
                <dt>Illness location</dt>
                <dd>{formatIllnessLocation(detailQuery.data.patient)}</dd>
              </div>
              <div>
                <dt>Investigator district</dt>
                <dd>{getValueOrFallback(detailQuery.data.investigator?.district ?? "")}</dd>
              </div>
              <div>
                <dt>Investigator source</dt>
                <dd>{getValueOrFallback(detailQuery.data.investigator?.information_source ?? "")}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    );
  }

  function renderPatientEditor() {
    return (
      <form className={styles.editorStack} onSubmit={handlePatientSubmit}>
        {patientFormSections.map((section) => (
          <section className={styles.formPanel} key={section.title}>
            <div className={styles.formPanelHeader}>
              <div>
                <h3 className={styles.detailTitle}>{section.title}</h3>
                {section.description ? (
                  <p className={styles.formPanelCopy}>{section.description}</p>
                ) : null}
              </div>
            </div>
            <div className={styles.formGrid}>
              {section.fields.map((field) =>
                renderField({
                  field,
                  onChange: (name, value) => handlePatientFieldChange(name, String(value)),
                  value: patientFormState[field.name]
                })
              )}
            </div>
          </section>
        ))}

        {patientFormError ? <p className={styles.errorMessage}>{patientFormError}</p> : null}
        {patientMutationError ? <p className={styles.errorMessage}>{patientMutationError}</p> : null}
        {patientMutationSuccess ? (
          <p className={styles.successMessage}>{patientMutationSuccess}</p>
        ) : null}

        <div className={styles.formActions}>
          <button className={styles.actionButton} disabled={patientMutation.isPending} type="submit">
            {patientMutation.isPending
              ? isCreateMode
                ? "Creating..."
                : "Saving..."
              : isCreateMode
                ? "Create case"
                : "Save patient"}
          </button>
          <button className={styles.secondaryButton} onClick={resetPatientForm} type="button">
            Reset form
          </button>
          {isCreateMode ? (
            <button className={styles.secondaryButton} onClick={cancelCreateMode} type="button">
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  function renderClinicalSignsEditor() {
    return (
      <form className={styles.editorStack} onSubmit={handleClinicalSignsSubmit}>
        <section className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <div>
              <h3 className={styles.detailTitle}>Clinical Signs</h3>
              <p className={styles.formPanelCopy}>
                Record onset, temperature, and symptom timing without leaving the case workspace.
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            {renderField({
              field: {
                name: "date_initial_onset",
                label: "Date of initial onset",
                type: "date"
              },
              onChange: handleClinicalSignsFieldChange,
              value: clinicalSignsFormState.date_initial_onset
            })}
            {renderField({
              field: {
                name: "temp_source",
                label: "Temperature source",
                type: "text",
                placeholder: "Oral, axillary, tympanic..."
              },
              onChange: handleClinicalSignsFieldChange,
              value: clinicalSignsFormState.temp_source
            })}
            {renderField({
              field: {
                name: "temperature",
                label: "Temperature",
                type: "number",
                step: "any"
              },
              onChange: handleClinicalSignsFieldChange,
              value: clinicalSignsFormState.temperature
            })}
          </div>
        </section>

        {clinicalSymptomGroups.map((group) => (
          <section className={styles.formPanel} key={group.title}>
            <h3 className={styles.detailTitle}>{group.title}</h3>
            <div className={styles.symptomTable}>
              <div className={styles.symptomHeader}>Present</div>
              <div className={styles.symptomHeader}>Symptom</div>
              <div className={styles.symptomHeader}>Date</div>
              <div className={styles.symptomHeader}>Duration (days)</div>

              {group.symptoms.map((symptom) => {
                const dateField = `date_${symptom.name}` as ClinicalSymptomDateKey;
                const durationField = `duration_${symptom.name}` as ClinicalSymptomDurationKey;

                return (
                  <div className={styles.symptomRow} key={symptom.name}>
                    <div className={styles.symptomCell}>
                      <input
                        checked={Boolean(clinicalSignsFormState[symptom.name])}
                        onChange={(event) =>
                          handleClinicalSignsFieldChange(symptom.name, event.target.checked)
                        }
                        type="checkbox"
                      />
                    </div>
                    <div className={styles.symptomCellLabel}>{symptom.label}</div>
                    <div className={styles.symptomCell}>
                      <input
                        className={styles.textInput}
                        onChange={(event) =>
                          handleClinicalSignsFieldChange(dateField, event.target.value)
                        }
                        type="date"
                        value={String(clinicalSignsFormState[dateField])}
                      />
                    </div>
                    <div className={styles.symptomCell}>
                      <input
                        className={styles.textInput}
                        min="0"
                        onChange={(event) =>
                          handleClinicalSignsFieldChange(durationField, event.target.value)
                        }
                        type="number"
                        value={String(clinicalSignsFormState[durationField])}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {renderSectionFeedback(
          clinicalSignsMutation,
          "Saving clinical signs...",
          "Clinical signs saved.",
          "The clinical signs could not be saved."
        )}

        <div className={styles.formActions}>
          <button
            className={styles.actionButton}
            disabled={clinicalSignsMutation.isPending}
            type="submit"
          >
            {clinicalSignsMutation.isPending ? "Saving..." : "Save clinical signs"}
          </button>
          <button className={styles.secondaryButton} onClick={resetClinicalSignsForm} type="button">
            Reset section
          </button>
        </div>
      </form>
    );
  }

  function renderHospitalizationEditor() {
    return (
      <form className={styles.editorStack} onSubmit={handleHospitalizationSubmit}>
        {hospitalizationSections.map((section) => (
          <section className={styles.formPanel} key={section.title}>
            <div className={styles.formPanelHeader}>
              <div>
                <h3 className={styles.detailTitle}>{section.title}</h3>
                {section.description ? (
                  <p className={styles.formPanelCopy}>{section.description}</p>
                ) : null}
              </div>
            </div>
            <div className={styles.formGrid}>
              {section.fields.map((field) =>
                renderField({
                  field,
                  onChange: handleHospitalizationFieldChange,
                  value: hospitalizationFormState[field.name]
                })
              )}
            </div>
          </section>
        ))}

        {renderSectionFeedback(
          hospitalizationMutation,
          "Saving hospitalization...",
          "Hospitalization saved.",
          "The hospitalization record could not be saved."
        )}

        <div className={styles.formActions}>
          <button
            className={styles.actionButton}
            disabled={hospitalizationMutation.isPending}
            type="submit"
          >
            {hospitalizationMutation.isPending ? "Saving..." : "Save hospitalization"}
          </button>
          <button className={styles.secondaryButton} onClick={resetHospitalizationForm} type="button">
            Reset section
          </button>
        </div>
      </form>
    );
  }

  function renderInvestigatorEditor() {
    return (
      <form className={styles.editorStack} onSubmit={handleInvestigatorSubmit}>
        {investigatorSections.map((section) => (
          <section className={styles.formPanel} key={section.title}>
            <h3 className={styles.detailTitle}>{section.title}</h3>
            <div className={styles.formGrid}>
              {section.fields.map((field) =>
                renderField({
                  field,
                  onChange: handleInvestigatorFieldChange,
                  value: investigatorFormState[field.name]
                })
              )}
            </div>
          </section>
        ))}

        {renderSectionFeedback(
          investigatorMutation,
          "Saving investigator details...",
          "Investigator details saved.",
          "The investigator record could not be saved."
        )}

        <div className={styles.formActions}>
          <button
            className={styles.actionButton}
            disabled={investigatorMutation.isPending}
            type="submit"
          >
            {investigatorMutation.isPending ? "Saving..." : "Save investigator"}
          </button>
          <button className={styles.secondaryButton} onClick={resetInvestigatorForm} type="button">
            Reset section
          </button>
        </div>
      </form>
    );
  }

  function renderLaboratoryEditor() {
    return (
      <form className={styles.editorStack} onSubmit={handleLaboratorySubmit}>
        <section className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <div>
              <h3 className={styles.detailTitle}>Laboratory Payload</h3>
              <p className={styles.formPanelCopy}>
                The upstream Swagger exposes the laboratory section as a flexible JSON object, so
                this editor preserves that shape while keeping save, reset, and validation inside
                the VHF workspace.
              </p>
            </div>
          </div>
          <label className={styles.fieldLabel} htmlFor="vhf-laboratory-json">
            Laboratory JSON
          </label>
          <textarea
            className={styles.codeArea}
            id="vhf-laboratory-json"
            onChange={(event) => {
              setLaboratoryPayload(event.target.value);
              setLaboratoryError(null);
              laboratoryMutation.reset();
            }}
            rows={18}
            value={laboratoryPayload}
          />
        </section>

        {laboratoryError ? <p className={styles.errorMessage}>{laboratoryError}</p> : null}
        {renderSectionFeedback(
          laboratoryMutation,
          "Saving laboratory payload...",
          "Laboratory payload saved.",
          "The laboratory payload could not be saved."
        )}

        <div className={styles.formActions}>
          <button
            className={styles.actionButton}
            disabled={laboratoryMutation.isPending}
            type="submit"
          >
            {laboratoryMutation.isPending ? "Saving..." : "Save laboratory"}
          </button>
          <button className={styles.secondaryButton} onClick={resetLaboratoryForm} type="button">
            Reset section
          </button>
        </div>
      </form>
    );
  }

  function renderRiskFactorsEditor() {
    return (
      <form className={styles.editorStack} onSubmit={handleRiskFactorsSubmit}>
        {riskFactorsSections.map((section) => (
          <section className={styles.formPanel} key={section.title}>
            <div className={styles.formPanelHeader}>
              <div>
                <h3 className={styles.detailTitle}>{section.title}</h3>
                {section.description ? (
                  <p className={styles.formPanelCopy}>{section.description}</p>
                ) : null}
              </div>
            </div>
            <div className={styles.formGrid}>
              {section.fields.map((field) =>
                renderField({
                  field,
                  onChange: handleRiskFactorsFieldChange,
                  value: riskFactorsFormState[field.name]
                })
              )}
            </div>
          </section>
        ))}

        {renderSectionFeedback(
          riskFactorsMutation,
          "Saving risk factors...",
          "Risk factors saved.",
          "The risk factors could not be saved."
        )}

        <div className={styles.formActions}>
          <button
            className={styles.actionButton}
            disabled={riskFactorsMutation.isPending}
            type="submit"
          >
            {riskFactorsMutation.isPending ? "Saving..." : "Save risk factors"}
          </button>
          <button className={styles.secondaryButton} onClick={resetRiskFactorsForm} type="button">
            Reset section
          </button>
        </div>
      </form>
    );
  }

  function renderModalContent() {
    if (!isCreateMode && detailLoadingMessage && !detailQuery.data) {
      return <p className={styles.statusMessage}>{detailLoadingMessage}</p>;
    }

    if (!isCreateMode && detailErrorMessage && !detailQuery.data) {
      return <p className={styles.errorMessage}>{detailErrorMessage}</p>;
    }

    if (activeTab === "overview" && !isCreateMode) {
      return renderOverviewContent();
    }

    if (activeTab === "patient") {
      return renderPatientEditor();
    }

    if (activeTab === "clinical-signs" && !isCreateMode) {
      return renderClinicalSignsEditor();
    }

    if (activeTab === "hospitalization" && !isCreateMode) {
      return renderHospitalizationEditor();
    }

    if (activeTab === "investigator" && !isCreateMode) {
      return renderInvestigatorEditor();
    }

    if (activeTab === "laboratory" && !isCreateMode) {
      return renderLaboratoryEditor();
    }

    if (activeTab === "risk-factors" && !isCreateMode) {
      return renderRiskFactorsEditor();
    }

    return (
      <div className={styles.emptyState}>
        Save the patient record first, then continue with the remaining CIF sections.
      </div>
    );
  }

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
              The registry stays table-first, while case review and section editing open from row
              actions so the list can keep the full workspace width.
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

          <div className={styles.toolbarActions}>
            <button className={styles.actionButton} onClick={startCreateMode} type="button">
              New VHF case
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => void vhfPatientsQuery.refetch()}
              type="button"
            >
              Refresh list
            </button>
          </div>
        </div>

        {deletePatientMutation.isSuccess ? (
          <p className={styles.successMessage}>
            {getMutationSuccessMessage(deletePatientMutation.data, "VHF case deleted.")}
          </p>
        ) : null}

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
                    <th className={styles.actionsHeader} scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => {
                    const isSelected =
                      isModalOpen && !isCreateMode && patient.id === selectedPatientId;
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
                            onClick={() => openCaseModal(patient.id, "overview")}
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
                        <td className={styles.actionsCell}>
                          <div className={styles.actionsMenuWrap} data-actions-menu="">
                            <button
                              className={styles.smallButton}
                              onClick={() => openCaseModal(patient.id, "overview")}
                              type="button"
                            >
                              Open
                            </button>
                            <button
                              aria-expanded={openMenuPatientId === patient.id}
                              aria-haspopup="menu"
                              className={styles.moreButton}
                              onClick={() =>
                                setOpenMenuPatientId((current) =>
                                  current === patient.id ? null : patient.id
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

                            {openMenuPatientId === patient.id ? (
                              <div className={styles.dropdown} role="menu">
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openCaseModal(patient.id, "patient")}
                                  type="button"
                                >
                                  Edit patient
                                </button>
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openCaseModal(patient.id, "clinical-signs")}
                                  type="button"
                                >
                                  Clinical signs
                                </button>
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openCaseModal(patient.id, "hospitalization")}
                                  type="button"
                                >
                                  Hospitalization
                                </button>
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openCaseModal(patient.id, "investigator")}
                                  type="button"
                                >
                                  Investigator
                                </button>
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openCaseModal(patient.id, "laboratory")}
                                  type="button"
                                >
                                  Laboratory
                                </button>
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => openCaseModal(patient.id, "risk-factors")}
                                  type="button"
                                >
                                  Risk factors
                                </button>
                                <button
                                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                  onClick={() => void handleDeleteCase(patient)}
                                  type="button"
                                >
                                  Delete case
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
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

        {filteredPatients.length ? (
          <div className={styles.tableFootnote}>
            Row actions open a focused case modal, so the registry stays compact while the full CIF
            editing flow stays one click away.
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} onClick={() => closeCaseModal()} role="presentation">
          <div
            aria-label={modalTitle}
            aria-modal="true"
            className={styles.modalWindow}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.modalTitleBar}>
              <div>
                <div className={styles.modalTitle}>{modalTitle}</div>
                <div className={styles.modalSubtitle}>{modalSubtitle}</div>
              </div>
              <div className={styles.modalTitleActions}>
                {!isCreateMode ? (
                  <>
                    <button
                      className={styles.secondaryButton}
                      disabled={selectedPatientId === null || detailQuery.isFetching}
                      onClick={() => void detailQuery.refetch()}
                      type="button"
                    >
                      Refresh case
                    </button>
                    <button
                      className={styles.dangerButton}
                      disabled={selectedPatient === null || deletePatientMutation.isPending}
                      onClick={() => void handleDeleteCase()}
                      type="button"
                    >
                      {deletePatientMutation.isPending ? "Deleting..." : "Delete case"}
                    </button>
                  </>
                ) : null}
                <button className={styles.modalCloseButton} onClick={() => closeCaseModal()} type="button">
                  Close
                </button>
              </div>
            </div>

            <div className={styles.modalTabStrip} role="tablist" aria-label="VHF case workspace tabs">
              {editorTabs.map((tab) => {
                const isDisabled = isCreateMode && tab.id !== PATIENT_TAB_ID;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    aria-selected={isActive}
                    className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
                    disabled={isDisabled}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className={styles.modalBody}>
              {isCreateMode ? (
                <div className={styles.inlineNote}>
                  Save the patient record first to unlock clinical signs, hospitalization,
                  investigator, laboratory, and risk factor editing.
                </div>
              ) : null}

              {detailQuery.isFetching && !detailQuery.isLoading && !isCreateMode ? (
                <p className={styles.statusMessage}>Refreshing case data...</p>
              ) : null}

              {deletePatientMutation.isError ? (
                <p className={styles.errorMessage}>
                  {getMutationErrorMessage(
                    deletePatientMutation.error,
                    "The selected VHF case could not be deleted."
                  )}
                </p>
              ) : null}

              {renderModalContent()}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
