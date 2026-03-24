import "server-only";

import { UPSTREAM_RESPONSE_SESSION_KEY, readUpstreamResponseSession } from "@/src/features/auth/lib/auth-session";

export interface UpstreamEmployee {
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

interface UpstreamEmployeesResponse {
  employees: UpstreamEmployee[];
}

export interface EmployeeRecord {
  cadre: string;
  email: string;
  facilityId: number;
  facilityName: string;
  firstName: string;
  fullName: string;
  id: number;
  lastName: string;
  phone: string;
  sex: string;
}

const EMPLOYEES_ENDPOINT =
  process.env.HEALTH_PORTAL_EMPLOYEES_URL ??
  "https://response.health.go.ug/api/employees";

function normalizeText(value: string, fallback: string) {
  const normalized = value.trim();

  return normalized.length > 0 ? normalized : fallback;
}

function buildFullName(firstName: string, lastName: string) {
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  return fullName.length > 0 ? fullName : "Unnamed Employee";
}

export async function fetchEmployees() {
  const upstreamSession = await readUpstreamResponseSession();
  const response = await fetch(EMPLOYEES_ENDPOINT, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(upstreamSession
        ? {
            Cookie: `${UPSTREAM_RESPONSE_SESSION_KEY}=${upstreamSession}`
          }
        : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Employee request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as UpstreamEmployeesResponse;

  return payload.employees
    .map(
      (employee): EmployeeRecord => ({
        cadre: normalizeText(employee.employee_cadre, "Not set"),
        email: normalizeText(employee.employee_email, "Not set"),
        facilityId: employee.facility,
        facilityName:
          employee.facility > 0
            ? normalizeText(employee.facility_name, `Facility ${employee.facility}`)
            : "Unassigned",
        firstName: normalizeText(employee.employee_fname, ""),
        fullName: buildFullName(employee.employee_fname, employee.employee_lname),
        id: employee.employee_id,
        lastName: normalizeText(employee.employee_lname, ""),
        phone: normalizeText(employee.employee_phone, "Not set"),
        sex: normalizeText(employee.employee_sex, "Not set")
      })
    )
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}
