import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getPortalSessionCookieOptions,
  PORTAL_SESSION_COOKIE_NAME,
  UPSTREAM_RESPONSE_SESSION_COOKIE_NAME,
  UPSTREAM_RESPONSE_SESSION_KEY
} from "@/src/features/auth/lib/auth-session";

const UPSTREAM_LOGOUT_URL =
  process.env.HEALTH_PORTAL_LOGOUT_URL ?? "https://response.health.go.ug/logout";

export async function POST() {
  const cookieStore = await cookies();
  const upstreamSessionCookie = cookieStore.get(UPSTREAM_RESPONSE_SESSION_COOKIE_NAME)?.value;
  const upstreamHeaders = new Headers({
    Accept: "text/html,application/json"
  });

  if (upstreamSessionCookie) {
    upstreamHeaders.set(
      "Cookie",
      `${UPSTREAM_RESPONSE_SESSION_KEY}=${decodeURIComponent(upstreamSessionCookie)}`
    );
  }

  try {
    await fetch(UPSTREAM_LOGOUT_URL, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
      redirect: "manual"
    });
  } catch {
    // Local logout still completes even if the upstream service is unavailable.
  }

  const response = NextResponse.json({ message: "Logged out." });

  response.cookies.set(PORTAL_SESSION_COOKIE_NAME, "", {
    ...getPortalSessionCookieOptions(),
    maxAge: 0
  });

  response.cookies.set(UPSTREAM_RESPONSE_SESSION_COOKIE_NAME, "", {
    ...getPortalSessionCookieOptions(),
    maxAge: 0
  });

  return response;
}
