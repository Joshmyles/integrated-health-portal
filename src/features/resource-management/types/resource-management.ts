export interface RequisitionRecord {
  id: number;
  requisition_number: string;
  outbreak_id: number;
  deployment_id: NullableInt64Value;
  requested_by: number;
  requested_date: string;
  required_date: NullableTimeValue;
  priority: string;
  status: string;
  approved_by?: NullableInt64Value;
  approved_date?: NullableTimeValue;
  rejection_reason?: NullableStringValue;
  dispatch_date?: NullableTimeValue;
  received_date?: NullableTimeValue;
  notes: NullableStringValue;
  created_at: string;
  updated_at: string;
}

export type RequisitionsResponse = { requisitions: RequisitionRecord[] };

export interface CreateRequisitionPayload {
  deployment_id: number;
  notes: string;
  outbreak_id: number;
  priority: string;
  requested_by: number;
  required_date: string;
  requisition_number: string;
  status: string;
}

export interface RequisitionMutationResponse {
  id?: number;
  message?: string;
}

export interface NullableStringValue {
  String: string;
  Valid: boolean;
}

export interface NullableInt64Value {
  Int64: number;
  Valid: boolean;
}

export interface NullableTimeValue {
  Time: string;
  Valid: boolean;
}

export interface PillarHeadRecord {
  created_at: string;
  created_by: NullableInt64Value;
  department_id: NullableInt64Value;
  email: NullableStringValue;
  first_name: NullableStringValue;
  is_active: boolean;
  is_locked: boolean;
  last_login_at: NullableTimeValue;
  last_name: NullableStringValue;
  password_changed_at: NullableTimeValue;
  password_expires_at: NullableTimeValue;
  updated_at: string;
  updated_by: NullableInt64Value;
  user_employee: NullableInt64Value;
  user_id: number;
  user_name: NullableStringValue;
  user_pass: NullableStringValue;
}

export interface PillarRecord {
  created_at: string;
  created_by: NullableInt64Value;
  description: NullableStringValue;
  id: number;
  is_active: boolean;
  name: string;
  pillar_head?: PillarHeadRecord;
  pillar_head_email: NullableStringValue;
  pillar_head_id: NullableInt64Value;
  pillar_head_name: NullableStringValue;
  pillar_head_phone: NullableStringValue;
  updated_at: string;
  updated_by: NullableInt64Value;
}

export interface PillarsResponse {
  pillars: PillarRecord[];
}

export interface PillarDetailResponse {
  pillar: PillarRecord;
}

export interface PillarMutationResponse {
  id?: number;
  message?: string;
  pillar?: PillarRecord | null;
}

export interface PillarWritePayload {
  description: string;
  is_active: boolean;
  name: string;
  pillar_head_email: string;
  pillar_head_id: number;
  pillar_head_name: string;
  pillar_head_phone: string;
}

export interface ResourceCategoryRecord {
  category_type: string;
  created_at: string;
  created_by: NullableInt64Value;
  description: NullableStringValue;
  id: number;
  is_active: boolean;
  name: string;
  updated_at: string;
}

export interface ResourceCategoriesResponse {
  resource_categories: ResourceCategoryRecord[];
}

export interface ResourceCategoryDetailResponse {
  resource_category: ResourceCategoryRecord;
}

export interface ResourceCategoryMutationResponse {
  id?: number;
  message?: string;
  resource_category?: ResourceCategoryRecord | null;
}

export interface ResourceCategoryWritePayload {
  category_type: string;
  description: string;
  is_active: boolean;
  name: string;
}

export interface ResourceRecord {
  category?: ResourceCategoryRecord;
  category_id: number;
  created_at: string;
  created_by: NullableInt64Value;
  description: NullableStringValue;
  has_expiry: boolean;
  id: number;
  is_active: boolean;
  is_consumable: boolean;
  is_critical: boolean;
  name: string;
  resource_code: NullableStringValue;
  shelf_life_days: NullableInt64Value;
  unit_of_measure: string;
  updated_at: string;
}

export interface ResourcesResponse {
  resources: ResourceRecord[];
}

export interface ResourceDetailResponse {
  resource: ResourceRecord;
}

export interface ResourceMutationResponse {
  id?: number;
  message?: string;
  resource?: ResourceRecord | null;
}

export interface ResourceWritePayload {
  category_id: number;
  description: string;
  has_expiry: boolean;
  is_active: boolean;
  is_consumable: boolean;
  is_critical: boolean;
  name: string;
  resource_code: string;
  shelf_life_days: number;
  unit_of_measure: string;
}
