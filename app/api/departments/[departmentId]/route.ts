import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

type JsonRecord = Record<string, unknown>;

function parseDepartmentId(value: string) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

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

function buildDepartmentPayload(payload: JsonRecord, departmentId: number) {
  return {
    code: getStringValue(payload, "code") || undefined,
    department_head_id: getNumberValue(payload, "department_head_id") ?? undefined,
    description: getStringValue(payload, "description") || undefined,
    id: departmentId,
    is_active: getBooleanValue(payload, "is_active"),
    name: getStringValue(payload, "name")
  };
}

async function requestWithFallback<T>(attempts: Array<() => Promise<T>>) {
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;

      if (!(error instanceof ResponseHealthApiError)) {
        throw error;
      }

      if (error.status !== 404 && error.status !== 405) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ departmentId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { departmentId } = await context.params;
  const parsedDepartmentId = parseDepartmentId(departmentId);

  if (!parsedDepartmentId) {
    return NextResponse.json({ message: "A valid department ID is required." }, { status: 400 });
  }

  try {
    const response = await requestWithFallback([
      () => requestResponseHealth<unknown>(`/api/departments/${parsedDepartmentId}`),
      () => requestResponseHealth<unknown>(`/api/departments?id=${parsedDepartmentId}`)
    ]);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The department record could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ departmentId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { departmentId } = await context.params;
  const parsedDepartmentId = parseDepartmentId(departmentId);

  if (!parsedDepartmentId) {
    return NextResponse.json({ message: "A valid department ID is required." }, { status: 400 });
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

  const updatePayload = buildDepartmentPayload(payload, parsedDepartmentId);

  if (!updatePayload.name) {
    return NextResponse.json({ message: "name is required." }, { status: 400 });
  }

  try {
    const response = await requestWithFallback([
      () =>
        requestResponseHealth<unknown>(`/api/departments/${parsedDepartmentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatePayload)
        }),
      () =>
        requestResponseHealth<unknown>("/api/departments/", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatePayload)
        })
    ]);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The department could not be updated right now." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ departmentId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { departmentId } = await context.params;
  const parsedDepartmentId = parseDepartmentId(departmentId);

  if (!parsedDepartmentId) {
    return NextResponse.json({ message: "A valid department ID is required." }, { status: 400 });
  }

  try {
    const response = await requestWithFallback([
      () =>
        requestResponseHealth<unknown>(`/api/departments/${parsedDepartmentId}`, {
          method: "DELETE"
        }),
      () =>
        requestResponseHealth<unknown>("/api/departments/", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: parsedDepartmentId })
        })
    ]);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The department could not be deleted right now." },
      { status: 502 }
    );
  }
}
