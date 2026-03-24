import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type {
  PillarDetailResponse,
  PillarWritePayload
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
    const response = await requestResponseHealth<PillarDetailResponse>(
      `/api/resource-management/pillars/${id}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The selected pillar could not be loaded right now." },
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
  let payload: PillarWritePayload;

  try {
    payload = (await request.json()) as PillarWritePayload;
  } catch {
    return NextResponse.json(
      { message: "A valid JSON update payload is required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/resource-management/pillars/${id}`,
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
      { message: "The selected pillar could not be updated right now." },
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
      `/api/resource-management/pillars/${id}`,
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
      { message: "The selected pillar could not be deleted right now." },
      { status: 502 }
    );
  }
}
