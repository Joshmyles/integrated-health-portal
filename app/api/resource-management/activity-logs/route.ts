import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  ActivityLogMutationResponse,
  ActivityLogsResponse,
  ActivityLogWritePayload
} from "@/src/features/resource-management/types/resource-management";

export async function GET() {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  try {
    const response = await forwardResponseHealth<ActivityLogsResponse>(
      "/api/resource-management/activity-logs"
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The activity logs could not be loaded right now.");
  }
}

export async function POST(request: Request) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const parsedPayload = await readJsonPayload<ActivityLogWritePayload>(
    request,
    "A valid JSON create payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  try {
    const response = await forwardResponseHealth<ActivityLogMutationResponse>(
      "/api/resource-management/activity-logs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload.payload)
      }
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleCifProxyError(error, "The activity log could not be created right now.");
  }
}
