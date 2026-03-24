import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

type JsonRecord = Record<string, unknown>;

function parseDeploymentId(value: string) {
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
  context: { params: Promise<{ deploymentId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { deploymentId } = await context.params;
  const parsedDeploymentId = parseDeploymentId(deploymentId);

  if (!parsedDeploymentId) {
    return NextResponse.json({ message: "A valid deployment ID is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/resource-management/rrt-deployments/${parsedDeploymentId}`
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The RRT deployment record could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ deploymentId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { deploymentId } = await context.params;
  const parsedDeploymentId = parseDeploymentId(deploymentId);

  if (!parsedDeploymentId) {
    return NextResponse.json({ message: "A valid deployment ID is required." }, { status: 400 });
  }

  try {
    const response = await requestWithFallback([
      () =>
        requestResponseHealth<unknown>(
          `/api/resource-management/rrt-deployments/${parsedDeploymentId}`,
          {
            method: "DELETE"
          }
        ),
      () =>
        requestResponseHealth<unknown>("/api/resource-management/rrt-deployments/", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: parsedDeploymentId })
        })
    ]);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The RRT deployment could not be deleted right now." },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ deploymentId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { deploymentId } = await context.params;
  const parsedDeploymentId = parseDeploymentId(deploymentId);

  if (!parsedDeploymentId) {
    return NextResponse.json({ message: "A valid deployment ID is required." }, { status: 400 });
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

  const updatePayload = {
    actual_return_date: normalizeDateValue(getStringValue(payload, "actual_return_date")),
    assigned_driver: getStringValue(payload, "assigned_driver") || undefined,
    assigned_vehicle: getStringValue(payload, "assigned_vehicle") || undefined,
    deployment_date: normalizeDateValue(getStringValue(payload, "deployment_date")),
    deployment_notes: getStringValue(payload, "deployment_notes") || undefined,
    deployment_purpose: getStringValue(payload, "deployment_purpose") || undefined,
    deployment_status: getStringValue(payload, "deployment_status"),
    expected_return_date: normalizeDateValue(getStringValue(payload, "expected_return_date")),
    id: parsedDeploymentId,
    outbreak_id: getNumberValue(payload, "outbreak_id"),
    team_id: getNumberValue(payload, "team_id")
  };

  if (!updatePayload.team_id || !updatePayload.outbreak_id || !updatePayload.deployment_date || !updatePayload.deployment_status) {
    return NextResponse.json(
      {
        message:
          "team_id, outbreak_id, deployment_date, and deployment_status are required."
      },
      { status: 400 }
    );
  }

  try {
    const response = await requestWithFallback([
      () =>
        requestResponseHealth<unknown>(
          `/api/resource-management/rrt-deployments/${parsedDeploymentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(updatePayload)
          }
        ),
      () =>
        requestResponseHealth<unknown>("/api/resource-management/rrt-deployments/", {
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
      { message: "The RRT deployment could not be updated right now." },
      { status: 502 }
    );
  }
}
