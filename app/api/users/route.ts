import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  normalizePageSize,
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type { UsersListResponse } from "@/src/features/users/types/users";

export async function GET(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = normalizePageSize(searchParams.get("page"), 1);
  const limit = normalizePageSize(searchParams.get("limit"), 20);
  const upstreamParams = new URLSearchParams({
    limit: String(limit),
    page: String(page)
  });

  try {
    const response = await requestResponseHealth<UsersListResponse>(
      `/api/users?${upstreamParams.toString()}`
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The user list could not be loaded right now." },
      { status: 502 }
    );
  }
}
