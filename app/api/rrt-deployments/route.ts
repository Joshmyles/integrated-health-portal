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
    const parsedValue = Number(value);

    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
  }

  return null;
}

function normalizeDateValue(value: string) {
  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00Z`;
  }

  return value;
}

function buildDeploymentPayload(payload: JsonRecord) {
  return {
    actual_return_date: normalizeDateValue(getStringValue(payload, "actual_return_date")),
    assigned_driver: getStringValue(payload, "assigned_driver") || undefined,
    assigned_vehicle: getStringValue(payload, "assigned_vehicle") || undefined,
    deployment_date: normalizeDateValue(getStringValue(payload, "deployment_date")),
    deployment_notes: getStringValue(payload, "deployment_notes") || undefined,
    deployment_purpose: getStringValue(payload, "deployment_purpose") || undefined,
    deployment_status: getStringValue(payload, "deployment_status"),
    expected_return_date: normalizeDateValue(getStringValue(payload, "expected_return_date")),
    outbreak_id: getNumberValue(payload, "outbreak_id"),
    team_id: getNumberValue(payload, "team_id")
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

  const createPayload = buildDeploymentPayload(payload);

  if (!createPayload.team_id || !createPayload.outbreak_id || !createPayload.deployment_date || !createPayload.deployment_status) {
    return NextResponse.json(
      {
        message:
          "team_id, outbreak_id, deployment_date, and deployment_status are required."
      },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>(
      "/api/resource-management/rrt-deployments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(createPayload)
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The RRT deployment could not be created right now." },
      { status: 502 }
    );
  }
}
