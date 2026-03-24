import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  CreateRequisitionPayload,
  RequisitionMutationResponse,
  RequisitionsResponse
} from "@/src/features/resource-management/types/resource-management";

export async function GET() {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  try {
    const response = await forwardResponseHealth<RequisitionsResponse>(
      "/api/resource-management/requisitions"
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The requisitions list could not be loaded right now.");
  }
}

export async function POST(request: Request) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const parsedPayload = await readJsonPayload<CreateRequisitionPayload>(
    request,
    "A valid JSON create payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  try {
    const response = await forwardResponseHealth<RequisitionMutationResponse>(
      "/api/resource-management/requisitions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload.payload)
      }
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleCifProxyError(error, "The requisition could not be created right now.");
  }
}
