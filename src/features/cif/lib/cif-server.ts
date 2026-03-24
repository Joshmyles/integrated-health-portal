import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

export async function requirePortalSession() {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  return null;
}

export function handleCifProxyError(error: unknown, fallbackMessage: string) {
  if (error instanceof ResponseHealthApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 502 });
}

export async function readJsonPayload<T>(request: Request, invalidMessage: string) {
  try {
    const payload = (await request.json()) as T;
    return { ok: true as const, payload };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ message: invalidMessage }, { status: 400 })
    };
  }
}

export async function forwardResponseHealth<T>(path: string, init?: RequestInit) {
  return requestResponseHealth<T>(path, init);
}
