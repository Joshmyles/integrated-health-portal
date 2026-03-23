import type { VhfPatientsResponse } from "@/src/features/cif/types/cif";

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

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json"
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

export function fetchVhfPatients() {
  return requestJson<VhfPatientsResponse>("/api/vhf/patients");
}
