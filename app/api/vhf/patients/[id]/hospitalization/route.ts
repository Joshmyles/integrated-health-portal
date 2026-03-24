import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  VhfHospitalizationResponse,
  VhfMutationResponse,
  VhfSectionWritePayload
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
    const response = await forwardResponseHealth<VhfHospitalizationResponse>(
      `/api/vhf/patients/${id}/hospitalization`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The VHF hospitalization record could not be loaded right now.");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const parsedPayload = await readJsonPayload<VhfSectionWritePayload>(
    request,
    "A valid JSON hospitalization payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  const { id } = await context.params;

  try {
    const response = await forwardResponseHealth<VhfMutationResponse>(
      `/api/vhf/patients/${id}/hospitalization`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsedPayload.payload)
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The VHF hospitalization record could not be saved right now.");
  }
}
