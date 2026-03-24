import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type {
  ResourceDetailResponse,
  ResourceWritePayload
} from "@/src/features/resource-management/types/resource-management";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const response = await requestResponseHealth<ResourceDetailResponse>(
      `/api/resource-management/resources/${id}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The selected resource could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  let payload: ResourceWritePayload;

  try {
    payload = (await request.json()) as ResourceWritePayload;
  } catch {
    return NextResponse.json(
      { message: "A valid JSON update payload is required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/resource-management/resources/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The selected resource could not be updated right now." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/resource-management/resources/${id}`,
      {
        method: "DELETE"
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The selected resource could not be deleted right now." },
      { status: 502 }
    );
  }
}
