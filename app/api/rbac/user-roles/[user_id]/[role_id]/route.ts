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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ user_id: string; role_id: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { user_id, role_id } = await context.params;
  const userId = parseId(user_id);
  const roleId = parseId(role_id);

  if (!userId || !roleId) {
    return NextResponse.json(
      { message: "Valid user_id and role_id are required." },
      { status: 400 }
    );
  }

  try {
    const response = await requestResponseHealth<unknown>(
      `/api/rbac/user-roles/${userId}/${roleId}`,
      { method: "DELETE" }
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The role could not be removed from the user right now." },
      { status: 502 }
    );
  }
}
