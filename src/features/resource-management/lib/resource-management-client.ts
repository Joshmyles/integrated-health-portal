import type {
  PillarDetailResponse,
  PillarMutationResponse,
  PillarsResponse,
  PillarWritePayload
} from "@/src/features/resource-management/types/resource-management";

interface ErrorPayload {
  message?: string;
}

export class ResourceManagementRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResourceManagementRequestError";
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
    throw new ResourceManagementRequestError(
      payload?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

function createJsonRequest(path: string, method: string, payload?: object) {
  return requestJson<PillarMutationResponse>(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

export function fetchLegacyPillars() {
  return requestJson<PillarsResponse>("/api/pillars");
}

export function fetchResourceManagementPillars() {
  return requestJson<PillarsResponse>("/api/resource-management/pillars");
}

export function fetchResourceManagementPillar(pillarId: number) {
  return requestJson<PillarDetailResponse>(`/api/resource-management/pillars/${pillarId}`);
}

export function createResourceManagementPillar(payload: PillarWritePayload) {
  return createJsonRequest("/api/resource-management/pillars", "POST", payload);
}

export function updateResourceManagementPillar(
  pillarId: number,
  payload: PillarWritePayload
) {
  return createJsonRequest(`/api/resource-management/pillars/${pillarId}`, "PUT", payload);
}

export function deleteResourceManagementPillar(pillarId: number) {
  return createJsonRequest(`/api/resource-management/pillars/${pillarId}`, "DELETE");
}
