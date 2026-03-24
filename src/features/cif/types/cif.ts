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

export interface VhfPatientsResponse {
  patients: VhfPatient[];
}

export interface MpoxPatient {
  id: number;
  patient_name: string;
  status: string;
}

export interface MpoxPatientsResponse {
  mpox_patients: MpoxPatient[];
}
