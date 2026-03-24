export interface RequisitionRecord {
  id: number;
  deployment_id: number;
  notes: string;
  outbreak_id: number;
  priority: string;
  requested_by: number;
  required_date: string;
  requisition_number: string;
  status: string;
}

export type RequisitionsResponse = RequisitionRecord[];

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
