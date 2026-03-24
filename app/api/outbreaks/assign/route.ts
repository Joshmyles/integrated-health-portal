import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type { AssignOutbreakPayload } from "@/src/features/outbreak/types/outbreak";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  const parsed = Math.floor(value);
  return parsed > 0 ? parsed : 0;
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

  const assignPayload: AssignOutbreakPayload = {
    outbreak_id: readPositiveInteger(payload.outbreak_id),
    user_id: readPositiveInteger(payload.user_id)
  };

  if (!assignPayload.outbreak_id || !assignPayload.user_id) {
    return NextResponse.json(
      { message: "outbreak_id and user_id must be positive integers." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/outbreaks/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(assignPayload)
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The outbreak assignment could not be completed right now." },
      { status: 502 }
    );
  }
}
