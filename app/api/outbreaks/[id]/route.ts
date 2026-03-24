import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type { CreateOutbreakPayload } from "@/src/features/outbreak/types/outbreak";

type JsonRecord = Record<string, unknown>;

function parseOutbreakId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 0;
  }

  return parsed;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(payload: JsonRecord, field: keyof CreateOutbreakPayload) {
  const value = payload[field];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const outbreakId = parseOutbreakId(id);

  if (!outbreakId) {
    return NextResponse.json({ message: "A valid outbreak id is required." }, { status: 400 });
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

  const updatePayload: CreateOutbreakPayload = {
    description: getStringValue(payload, "description"),
    end_date: getStringValue(payload, "end_date"),
    name: getStringValue(payload, "name"),
    outbreak_category: getStringValue(payload, "outbreak_category"),
    outbreak_type: getStringValue(payload, "outbreak_type"),
    start_date: getStringValue(payload, "start_date"),
    status: getStringValue(payload, "status")
  };

  if (!updatePayload.name || !updatePayload.outbreak_type || !updatePayload.start_date) {
    return NextResponse.json(
      { message: "name, outbreak_type, and start_date are required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/outbreaks/${outbreakId}`, {
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
      { message: "The outbreak could not be updated right now." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const outbreakId = parseOutbreakId(id);

  if (!outbreakId) {
    return NextResponse.json({ message: "A valid outbreak id is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/outbreaks/${outbreakId}`, {
      method: "DELETE"
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The outbreak could not be deleted right now." },
      { status: 502 }
    );
  }
}
