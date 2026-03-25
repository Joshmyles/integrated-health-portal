import type {
  MeaslesPatientsResponse,
  MpoxPatientsResponse,
  PolioPatientsResponse,
  VhfClinicalSignsResponse,
  VhfHospitalizationResponse,
  VhfInvestigatorResponse,
  VhfLaboratoryResponse,
  VhfMutationResponse,
  VhfPatientDetailResponse,
  VhfPatientsResponse,
  VhfPatientWritePayload,
  VhfRiskFactorsResponse,
  VhfSectionKey,
  VhfSectionWritePayload
} from "@/src/features/cif/types/cif";

interface ErrorPayload {
  message?: string;
}

export class CifRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CifRequestError";
    this.status = status;
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = await readJson<T & ErrorPayload>(response);

  if (!response.ok) {
    throw new CifRequestError(
      payload?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

function createJsonRequest(path: string, method: string, payload?: object) {
  return requestJson<VhfMutationResponse>(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

export function fetchVhfPatients() {
  return requestJson<VhfPatientsResponse>("/api/vhf/patients");
}

export function fetchVhfPatientDetail(patientId: number) {
  return requestJson<VhfPatientDetailResponse>(`/api/vhf/patients/${patientId}`);
}

export function createVhfPatient(payload: VhfPatientWritePayload) {
  return createJsonRequest("/api/vhf/patients", "POST", payload);
}

export function updateVhfPatient(
  patientId: number,
  payload: VhfPatientWritePayload
) {
  return createJsonRequest(`/api/vhf/patients/${patientId}`, "PUT", payload);
}

export function deleteVhfPatient(patientId: number) {
  return createJsonRequest(`/api/vhf/patients/${patientId}`, "DELETE");
}

export function fetchVhfClinicalSigns(patientId: number) {
  return requestJson<VhfClinicalSignsResponse>(
    `/api/vhf/patients/${patientId}/clinical-signs`
  );
}

export function fetchVhfHospitalization(patientId: number) {
  return requestJson<VhfHospitalizationResponse>(
    `/api/vhf/patients/${patientId}/hospitalization`
  );
}

export function fetchVhfInvestigator(patientId: number) {
  return requestJson<VhfInvestigatorResponse>(
    `/api/vhf/patients/${patientId}/investigator`
  );
}

export function fetchVhfLaboratory(patientId: number) {
  return requestJson<VhfLaboratoryResponse>(
    `/api/vhf/patients/${patientId}/laboratory`
  );
}

export function fetchVhfRiskFactors(patientId: number) {
  return requestJson<VhfRiskFactorsResponse>(
    `/api/vhf/patients/${patientId}/risk-factors`
  );
}

export function saveVhfSection(
  patientId: number,
  section: VhfSectionKey,
  payload: VhfSectionWritePayload
) {
  return createJsonRequest(`/api/vhf/patients/${patientId}/${section}`, "POST", payload);
}

export function fetchMpoxPatients() {
  return requestJson<MpoxPatientsResponse>("/api/mpox/patients");
}

export function fetchMeaslesPatients(outbreakId: string) {
  const search = new URLSearchParams({ outbreak_id: outbreakId });
  return requestJson<MeaslesPatientsResponse>(`/api/measles/patients?${search.toString()}`);
}

export function fetchPolioPatients(outbreakId: string) {
  const search = new URLSearchParams({ outbreak_id: outbreakId });
  return requestJson<PolioPatientsResponse>(`/api/polio/patients?${search.toString()}`);
}
