interface ErrorPayload {
  message?: string;
}

export interface DepartmentPayload {
  code?: string;
  department_head_id?: number;
  description?: string;
  is_active: boolean;
  name: string;
}

export class DepartmentRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DepartmentRequestError";
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
    throw new DepartmentRequestError(
      payload?.message ?? "The department request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export function createDepartment(payload: DepartmentPayload) {
  return requestJson<{ message?: string }>("/api/departments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function updateDepartment(departmentId: number, payload: DepartmentPayload) {
  return requestJson<{ message?: string }>(`/api/departments/${departmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function deleteDepartment(departmentId: number) {
  return requestJson<{ message?: string }>(`/api/departments/${departmentId}`, {
    method: "DELETE"
  });
}
