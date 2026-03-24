import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

export async function GET(request: Request) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const outbreakId = searchParams.get("outbreak_id");
  const upstreamPath = outbreakId
    ? `/api/polio/patients?outbreak_id=${encodeURIComponent(outbreakId)}`
    : "/api/polio/patients";

  try {
    const response = await requestResponseHealth<unknown>(upstreamPath);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The polio patient list could not be loaded right now." },
      { status: 502 }
    );
  }
}
