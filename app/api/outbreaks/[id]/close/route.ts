import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

function parseOutbreakId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 0;
  }

  return parsed;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const outbreakId = parseOutbreakId(id);

  if (!outbreakId) {
    return NextResponse.json({ message: "A valid outbreak id is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/outbreaks/${outbreakId}/close`, {
      method: "POST"
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The outbreak could not be closed right now." },
      { status: 502 }
    );
  }
}
