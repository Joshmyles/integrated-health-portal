export interface CreateEmployeePayload {
  employee_id?: number;
  employee_cadre?: string;
  employee_email?: string;
  employee_fname: string;
  employee_lname: string;
  employee_phone?: string;
  employee_sex?: string;
  facility: number;
}

export interface EmployeeDetail {
  employee_cadre: string;
  employee_email: string;
  employee_fname: string;
  employee_id: number;
  employee_lname: string;
  employee_phone: string;
  employee_sex: string;
  facility: number;
  facility_name: string;
}

interface ErrorPayload {
  message?: string;
}

export class EmployeeRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EmployeeRequestError";
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
    throw new EmployeeRequestError(
      payload?.message ?? "The employee request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export function createEmployee(payload: CreateEmployeePayload) {
  return requestJson<unknown>("/api/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function fetchEmployeeDetail(employeeId: number) {
  return requestJson<EmployeeDetail>(`/api/employees/${employeeId}`);
}

export function updateEmployee(payload: CreateEmployeePayload) {
  return requestJson<unknown>("/api/employees", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function deleteEmployee(employee_id: number) {
  return requestJson<unknown>(`/api/employees/${employee_id}`, {
    method: "DELETE"
  });
}
