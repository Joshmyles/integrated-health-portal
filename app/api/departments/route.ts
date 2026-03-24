import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(payload: JsonRecord, field: string) {
  const value = payload[field];
  return typeof value === "string" ? value.trim() : "";
}

function getNumberValue(payload: JsonRecord, field: string) {
  const value = payload[field];

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function getBooleanValue(payload: JsonRecord, field: string) {
  const value = payload[field];
  return typeof value === "boolean" ? value : false;
}

function buildDepartmentPayload(payload: JsonRecord) {
  return {
    code: getStringValue(payload, "code") || undefined,
    department_head_id: getNumberValue(payload, "department_head_id") ?? undefined,
    description: getStringValue(payload, "description") || undefined,
    is_active: getBooleanValue(payload, "is_active"),
    name: getStringValue(payload, "name")
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
    return NextResponse.json({ message: "A valid JSON payload is required." }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ message: "A valid JSON object is required." }, { status: 400 });
  }

  const createPayload = buildDepartmentPayload(payload);

  if (!createPayload.name) {
    return NextResponse.json({ message: "name is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/departments/", {
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
      { message: "The department could not be created right now." },
      { status: 502 }
    );
  }
}
