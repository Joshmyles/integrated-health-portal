import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

type JsonRecord = Record<string, unknown>;

function parseTeamId(value: string) {
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

function getBooleanValue(payload: JsonRecord, field: string) {
  const value = payload[field];
  return typeof value === "boolean" ? value : false;
}

function getNumberValue(payload: JsonRecord, field: string) {
  const value = payload[field];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getStringArrayValue(payload: JsonRecord, field: string) {
  const value = payload[field];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { teamId } = await context.params;
  const parsedTeamId = parseTeamId(teamId);

  if (!parsedTeamId) {
    return NextResponse.json({ message: "A valid team ID is required." }, { status: 400 });
  }

  try {
    const response = await requestWithFallback([
      () =>
        requestResponseHealth<unknown>(`/api/resource-management/rrt-teams/${parsedTeamId}`, {
          method: "DELETE"
        }),
      () =>
        requestResponseHealth<unknown>("/api/resource-management/rrt-teams/", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: parsedTeamId })
        })
    ]);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The RRT team could not be deleted right now." },
      { status: 502 }
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { teamId } = await context.params;
  const parsedTeamId = parseTeamId(teamId);

  if (!parsedTeamId) {
    return NextResponse.json({ message: "A valid team ID is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/resource-management/rrt-teams/${parsedTeamId}`
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The RRT team record could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { teamId } = await context.params;
  const parsedTeamId = parseTeamId(teamId);

  if (!parsedTeamId) {
    return NextResponse.json({ message: "A valid team ID is required." }, { status: 400 });
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

  const updatePayload = {
    id: parsedTeamId,
    team_name: getStringValue(payload, "team_name"),
    team_code: getStringValue(payload, "team_code"),
    team_type: getStringValue(payload, "team_type"),
    team_lead_name: getStringValue(payload, "team_lead_name"),
    team_lead_phone: getStringValue(payload, "team_lead_phone"),
    team_lead_email: getStringValue(payload, "team_lead_email"),
    team_size: getNumberValue(payload, "team_size") ?? 0,
    specializations: getStringArrayValue(payload, "specializations"),
    base_location: getStringValue(payload, "base_location"),
    is_active: getBooleanValue(payload, "is_active")
  };

  if (!updatePayload.team_name || !updatePayload.team_code || !updatePayload.team_type) {
    return NextResponse.json(
      { message: "team_name, team_code, and team_type are required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestWithFallback([
      () =>
        requestResponseHealth<unknown>(`/api/resource-management/rrt-teams/${parsedTeamId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatePayload)
        }),
      () =>
        requestResponseHealth<unknown>("/api/resource-management/rrt-teams/", {
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
      { message: "The RRT team could not be updated right now." },
      { status: 502 }
    );
  }
}
