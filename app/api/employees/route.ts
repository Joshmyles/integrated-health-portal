import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

type JsonRecord = Record<string, unknown>;

interface CreateEmployeePayload {
  employee_id?: number;
  employee_cadre?: string;
  employee_email?: string;
  employee_fname: string;
  employee_lname: string;
  employee_phone?: string;
  employee_sex?: string;
  facility: number;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getOptionalString(payload: JsonRecord, field: keyof Omit<CreateEmployeePayload, "facility">) {
  const value = payload[field];

  return typeof value === "string" ? value.trim() : "";
}

function getFacilityValue(payload: JsonRecord) {
  const value = payload.facility;

  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);

    if (Number.isInteger(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
  }

  return null;
}

function getEmployeeIdValue(payload: JsonRecord) {
  const value = payload.employee_id;

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);

    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
  }

  return null;
}

function buildEmployeePayload(payload: JsonRecord): CreateEmployeePayload {
  return {
    employee_id: getEmployeeIdValue(payload) ?? undefined,
    employee_cadre: getOptionalString(payload, "employee_cadre"),
    employee_email: getOptionalString(payload, "employee_email"),
    employee_fname: getOptionalString(payload, "employee_fname"),
    employee_lname: getOptionalString(payload, "employee_lname"),
    employee_phone: getOptionalString(payload, "employee_phone"),
    employee_sex: getOptionalString(payload, "employee_sex"),
    facility: getFacilityValue(payload) ?? -1
  };
}

export async function POST(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "A valid JSON payload is required." },
      { status: 400 }
    );
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ message: "A valid JSON object is required." }, { status: 400 });
  }

  const createPayload = buildEmployeePayload(payload);

  if (!createPayload.employee_fname || !createPayload.employee_lname || createPayload.facility < 0) {
    return NextResponse.json(
      { message: "employee_fname, employee_lname, and facility are required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createPayload)
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The employee could not be created right now." },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "A valid JSON payload is required." },
      { status: 400 }
    );
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ message: "A valid JSON object is required." }, { status: 400 });
  }

  const updatePayload = buildEmployeePayload(payload);

  if (!updatePayload.employee_id) {
    return NextResponse.json(
      { message: "employee_id is required for updates." },
      { status: 400 }
    );
  }

  if (!updatePayload.employee_fname || !updatePayload.employee_lname || updatePayload.facility < 0) {
    return NextResponse.json(
      { message: "employee_fname, employee_lname, and facility are required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/employees", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatePayload)
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The employee could not be updated right now." },
      { status: 502 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "A valid JSON payload is required." },
      { status: 400 }
    );
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ message: "A valid JSON object is required." }, { status: 400 });
  }

  const employeeId = getEmployeeIdValue(payload);

  if (!employeeId) {
    return NextResponse.json(
      { message: "employee_id is required for deletion." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/employees", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ employee_id: employeeId })
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The employee could not be deleted right now." },
      { status: 502 }
    );
  }
}
