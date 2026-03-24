import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

function parseId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 0;
  }

  return parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const permissionId = parseId(id);

  if (!permissionId) {
    return NextResponse.json({ message: "A valid permission id is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/rbac/permissions/${permissionId}`);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The permission could not be loaded right now." },
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
  const permissionId = parseId(id);

  if (!permissionId) {
    return NextResponse.json({ message: "A valid permission id is required." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "A valid JSON payload is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/rbac/permissions/${permissionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The permission could not be updated right now." },
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
  const permissionId = parseId(id);

  if (!permissionId) {
    return NextResponse.json({ message: "A valid permission id is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/rbac/permissions/${permissionId}`,
      { method: "DELETE" }
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The permission could not be deleted right now." },
      { status: 502 }
    );
  }
}
