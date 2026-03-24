import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  ActivityLogMutationResponse,
  ActivityLogWritePayload
} from "@/src/features/resource-management/types/resource-management";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;

  try {
    const response = await forwardResponseHealth<ActivityLogMutationResponse>(
      `/api/resource-management/activity-logs/${id}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The activity log could not be loaded right now.");
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;

  const parsedPayload = await readJsonPayload<ActivityLogWritePayload>(
    request,
    "A valid JSON update payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  try {
    const response = await forwardResponseHealth<ActivityLogMutationResponse>(
      `/api/resource-management/activity-logs/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload.payload)
      }
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The activity log could not be updated right now.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;

  try {
    const response = await forwardResponseHealth<ActivityLogMutationResponse>(
      `/api/resource-management/activity-logs/${id}`,
      { method: "DELETE" }
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The activity log could not be deleted right now.");
  }
}
