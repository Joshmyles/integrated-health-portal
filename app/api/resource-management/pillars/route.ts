import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type {
  PillarsResponse,
  PillarWritePayload
} from "@/src/features/resource-management/types/resource-management";

export async function GET() {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    const response = await requestResponseHealth<PillarsResponse>(
      "/api/resource-management/pillars"
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The pillars list could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  let payload: PillarWritePayload;

  try {
    payload = (await request.json()) as PillarWritePayload;
  } catch {
    return NextResponse.json(
      { message: "A valid JSON create payload is required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/resource-management/pillars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The pillar could not be created right now." },
      { status: 502 }
    );
  }
}
