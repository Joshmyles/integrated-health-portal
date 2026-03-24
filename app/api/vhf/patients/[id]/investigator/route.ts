import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  VhfInvestigatorResponse,
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
    const response = await forwardResponseHealth<VhfInvestigatorResponse>(
      `/api/vhf/patients/${id}/investigator`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The VHF investigator record could not be loaded right now.");
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
    "A valid JSON investigator payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  const { id } = await context.params;

  try {
    const response = await forwardResponseHealth<VhfMutationResponse>(
      `/api/vhf/patients/${id}/investigator`,
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
    return handleCifProxyError(error, "The VHF investigator record could not be saved right now.");
  }
}
