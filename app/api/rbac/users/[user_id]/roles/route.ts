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
  context: { params: Promise<{ user_id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { user_id } = await context.params;
  const userId = parseId(user_id);

  if (!userId) {
    return NextResponse.json({ message: "A valid user_id is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/rbac/users/${userId}/roles`);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The user roles could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ user_id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { user_id } = await context.params;
  const userId = parseId(user_id);

  if (!userId) {
    return NextResponse.json({ message: "A valid user_id is required." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "A valid JSON payload is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/rbac/users/${userId}/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The user roles could not be updated right now." },
      { status: 502 }
    );
  }
}
