import { NextResponse } from "next/server";
import {
  forwardResponseHealth,
  handleCifProxyError,
  readJsonPayload,
  requirePortalSession
} from "@/src/features/cif/lib/cif-server";
import type {
  VhfMutationResponse,
  VhfPatientsResponse,
  VhfPatientWritePayload
} from "@/src/features/cif/types/cif";

export async function GET(request: Request) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const upstreamUrl = new URL("/api/vhf/patients", request.url);
  const search = new URL(request.url).searchParams.toString();

  if (search) {
    upstreamUrl.search = search;
  }

  try {
    const response = await forwardResponseHealth<VhfPatientsResponse>(
      `${upstreamUrl.pathname}${upstreamUrl.search}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleCifProxyError(error, "The VHF patient list could not be loaded right now.");
  }
}

export async function POST(request: Request) {
  const authResponse = await requirePortalSession();

  if (authResponse) {
    return authResponse;
  }

  const parsedPayload = await readJsonPayload<VhfPatientWritePayload>(
    request,
    "A valid JSON create payload is required."
  );

  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  try {
    const response = await forwardResponseHealth<VhfMutationResponse>("/api/vhf/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(parsedPayload.payload)
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleCifProxyError(error, "The VHF case could not be created right now.");
  }
}
