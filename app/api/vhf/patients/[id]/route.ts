import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  VhfMutationResponse,
  VhfPatientDetailResponse,
  VhfPatientWritePayload
} from "@/src/features/cif/types/cif";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const { id } = await context.params;

  try {
    const response = await forwardResponseHealth<VhfPatientDetailResponse>(`/api/vhf/patients/${id}`);
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The selected VHF case could not be loaded right now.");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const parsedPayload = await readJsonPayload<VhfPatientWritePayload>(
    request,
    "A valid JSON update payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  const { id } = await context.params;

  try {
    const response = await forwardResponseHealth<VhfMutationResponse>(`/api/vhf/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(parsedPayload.payload)
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The selected VHF case could not be updated right now.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const { id } = await context.params;

  try {
    const response = await forwardResponseHealth<VhfMutationResponse>(`/api/vhf/patients/${id}`, {
      method: "DELETE"
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The selected VHF case could not be deleted right now.");
  }
}
