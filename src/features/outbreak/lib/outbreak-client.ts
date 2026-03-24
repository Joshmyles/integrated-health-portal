import type {
  AssignOutbreakPayload,
  OutbreakAssignmentRecord,
  CreateOutbreakPayload,
  OutbreakRecord,
  UpdateOutbreakPayload
} from "@/src/features/outbreak/types/outbreak";

interface ErrorPayload {
  message?: string;
}

export class OutbreakRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OutbreakRequestError";
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
    throw new OutbreakRequestError(
      payload?.message ?? "The outbreak request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export async function fetchOutbreaks() {
  const payload = await requestJson<unknown>("/api/outbreaks");

  if (Array.isArray(payload)) {
    return payload as OutbreakRecord[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "outbreaks" in payload &&
    Array.isArray((payload as { outbreaks?: unknown }).outbreaks)
  ) {
    return (payload as { outbreaks: OutbreakRecord[] }).outbreaks;
  }

  return [];
}

export async function fetchOutbreakAssignments() {
  const payload = await requestJson<unknown>("/api/outbreaks/assignments");

  if (Array.isArray(payload)) {
    return payload as OutbreakAssignmentRecord[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "assignments" in payload &&
    Array.isArray((payload as { assignments?: unknown }).assignments)
  ) {
    return (payload as { assignments: OutbreakAssignmentRecord[] }).assignments;
  }

  return [];
}

export function createOutbreak(payload: CreateOutbreakPayload) {
  return requestJson<unknown>("/api/outbreaks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function assignOutbreak(payload: AssignOutbreakPayload) {
  return requestJson<unknown>("/api/outbreaks/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function deleteOutbreak(outbreakId: number) {
  return requestJson<unknown>(`/api/outbreaks/${outbreakId}`, {
    method: "DELETE"
  });
}

export function closeOutbreak(outbreakId: number) {
  return requestJson<unknown>(`/api/outbreaks/${outbreakId}/close`, {
    method: "POST"
  });
}

export function updateOutbreak(outbreakId: number, payload: UpdateOutbreakPayload) {
  return requestJson<unknown>(`/api/outbreaks/${outbreakId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
