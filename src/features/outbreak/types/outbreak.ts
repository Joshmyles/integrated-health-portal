export interface NullableStringValue {
  String: string;
  Valid: boolean;
}

export interface NullableTimeValue {
  Time: string;
  Valid: boolean;
}

export interface OutbreakRecord {
  description?: NullableStringValue;
  end_date?: NullableTimeValue;
  id: number;
  name?: NullableStringValue;
  outbreak_category?: NullableStringValue;
  outbreak_type?: NullableStringValue;
  start_date?: NullableTimeValue;
  status?: NullableStringValue;
}

export interface CreateOutbreakPayload {
  description: string;
  end_date: string;
  name: string;
  outbreak_category: string;
  outbreak_type: string;
  start_date: string;
  status: string;
}

export interface AssignOutbreakPayload {
  outbreak_id: number;
  user_id: number;
}
