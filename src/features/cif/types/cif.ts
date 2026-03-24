export interface NullableStringValue {
  String: string;
  Valid: boolean;
}

export interface NullableIntValue {
  Int32: number;
  Valid: boolean;
}

export interface NullableFloatValue {
  Float64: number;
  Valid: boolean;
}

export interface NullableTimeValue {
  Time: string;
  Valid: boolean;
}

export interface NullableBoolValue {
  Bool: boolean;
  Valid: boolean;
}

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface JsonObject {
  [key: string]: JsonValue;
}

export const clinicalSymptomNames = [
  "fever",
  "vomiting",
  "nausea",
  "diarrhea",
  "intense_fatigue_general_weakness",
  "epigastric_pain",
  "lower_abdominal_pain",
  "chest_pain",
  "muscle_pain",
  "joint_pain",
  "headache",
  "cough",
  "difficulty_breathing",
  "difficulty_swallowing",
  "sore_throat",
  "jaundice",
  "conjunctivitis",
  "skin_rash",
  "hiccups",
  "pain_behind_eyes",
  "sensitive_to_light",
  "coma_unconscious",
  "confused_or_disoriented",
  "convulsions",
  "unexplained_bleeding",
  "bleeding_of_the_gums",
  "bleeding_from_injection_site",
  "nose_bleed_epistaxis",
  "bloody_stool",
  "blood_in_vomit",
  "coughing_up_blood_hemoptysis",
  "bleeding_from_vagina",
  "bruising_of_the_skin",
  "blood_in_urine",
  "other_hemorrhagic_symptoms"
] as const;

export type ClinicalSymptomName = (typeof clinicalSymptomNames)[number];
export type ClinicalSymptomDateKey = `date_${ClinicalSymptomName}`;
export type ClinicalSymptomDurationKey = `duration_${ClinicalSymptomName}`;

export interface VhfPatient {
  age_months: NullableIntValue;
  age_years: NullableIntValue;
  case_code: NullableStringValue;
  country_of_residence: string;
  created_at: string;
  data_capturer_name: NullableStringValue;
  data_capturer_phone: NullableStringValue;
  date_of_birth: NullableTimeValue;
  date_of_death: NullableTimeValue;
  date_residing_from: NullableTimeValue;
  date_residing_to: NullableTimeValue;
  district: string;
  gender: NullableStringValue;
  head_of_household: NullableStringValue;
  id: number;
  ill_district: string;
  ill_subcounty: string;
  ill_village_town: string;
  latitude: NullableFloatValue;
  longitude: NullableFloatValue;
  next_of_kin: NullableStringValue;
  next_of_kin_phone: NullableStringValue;
  occupation: string;
  other_names: string;
  parish: string;
  patient_phone: NullableStringValue;
  phone_owner: NullableStringValue;
  relationship_to_patient: NullableStringValue;
  reporting_health_facility_name: NullableStringValue;
  status: NullableStringValue;
  subcounty: string;
  surname: string;
  village_town: string;
}

type VhfClinicalSignsBase = {
  created_at: string;
  date_initial_onset: NullableTimeValue;
  id: number;
  patient_id: number;
  temp_source: NullableStringValue;
  temperature: NullableFloatValue;
};

export type VhfClinicalSigns = VhfClinicalSignsBase &
  { [Key in ClinicalSymptomName]: NullableBoolValue } &
  { [Key in ClinicalSymptomDateKey]: NullableTimeValue } &
  { [Key in ClinicalSymptomDurationKey]: NullableIntValue };

export interface VhfHospitalization {
  admission_date: NullableTimeValue;
  created_at: string;
  health_facility_name: string;
  hospitalized: boolean;
  id: number;
  in_isolation: boolean;
  isolation_date: NullableTimeValue;
  patient_id: number;
}

export interface VhfInvestigator {
  created_at: string;
  district: string;
  email: string;
  health_facility: string;
  id: number;
  information_source: string;
  investigator_name: string;
  patient_id: number;
  phone: string;
  position: string;
  proxy_name: string;
  proxy_relation: string;
}

export interface VhfRiskFactors {
  contact_dates: string;
  contact_death_date: NullableTimeValue;
  contact_district: string;
  contact_name: string;
  contact_relation: string;
  contact_status: string;
  contact_types: string;
  contact_village: string;
  contact_with_case: NullableBoolValue;
  created_at: string;
  id: number;
  patient_id: number;
}

export type VhfLaboratory = JsonObject | null;

export interface VhfPatientsResponse {
  patients: VhfPatient[];
}

export interface VhfPatientDetailResponse {
  clinical_signs: VhfClinicalSigns | null;
  hospitalization: VhfHospitalization | null;
  investigator: VhfInvestigator | null;
  laboratory: VhfLaboratory;
  patient: VhfPatient;
  risk_factors: VhfRiskFactors | null;
}

export interface VhfClinicalSignsResponse {
  clinical_signs: VhfClinicalSigns | null;
}

export interface VhfHospitalizationResponse {
  hospitalization: VhfHospitalization | null;
}

export interface VhfInvestigatorResponse {
  investigator: VhfInvestigator | null;
}

export interface VhfLaboratoryResponse {
  laboratory: VhfLaboratory;
}

export interface VhfRiskFactorsResponse {
  risk_factors: VhfRiskFactors | null;
}

export interface VhfMutationResponse {
  [key: string]: JsonValue | undefined;
  id?: number;
  message?: string;
  patient_id?: number;
}

export type VhfPatientWritePayload = JsonObject;
export type VhfSectionWritePayload = JsonObject;

export type VhfSectionKey =
  | "clinical-signs"
  | "hospitalization"
  | "investigator"
  | "laboratory"
  | "risk-factors";
