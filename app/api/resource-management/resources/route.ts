import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type {
  ResourcesResponse,
  ResourceWritePayload
} from "@/src/features/resource-management/types/resource-management";

export async function GET() {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    const response = await requestResponseHealth<ResourcesResponse>(
      "/api/resource-management/resources"
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The resources list could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  let payload: ResourceWritePayload;

  try {
    payload = (await request.json()) as ResourceWritePayload;
  } catch {
    return NextResponse.json(
      { message: "A valid JSON create payload is required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>("/api/resource-management/resources", {
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
      { message: "The resource could not be created right now." },
      { status: 502 }
    );
  }
}
