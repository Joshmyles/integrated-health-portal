import "server-only";

import { cookies } from "next/headers";

export const PORTAL_SESSION_COOKIE_NAME = "one_health_portal_session";
export const UPSTREAM_RESPONSE_SESSION_COOKIE_NAME = "response_health_fiber_sess";
export const UPSTREAM_RESPONSE_SESSION_KEY = "fiber_sess";

export interface PortalSession {
  authenticatedAt: string;
  username: string;
}

function isPortalSession(value: unknown): value is PortalSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PortalSession>;

  return (
    typeof candidate.username === "string" &&
    candidate.username.length > 0 &&
    typeof candidate.authenticatedAt === "string" &&
    candidate.authenticatedAt.length > 0
  );
}

export function getPortalSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function extractCookieValue(setCookieHeaders: string[], cookieName: string) {
  for (const setCookieHeader of setCookieHeaders) {
    const cookiePair = setCookieHeader.split(";")[0]?.trim();

    if (!cookiePair) {
      continue;
    }

    const separatorIndex = cookiePair.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();

    if (name === cookieName && value) {
      return value;
    }
  }

  return null;
}

export function serializePortalSession(session: PortalSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function parsePortalSession(value: string): PortalSession | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as unknown;

    return isPortalSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function readPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PORTAL_SESSION_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  return parsePortalSession(rawValue);
}

export async function readUpstreamResponseSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(UPSTREAM_RESPONSE_SESSION_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}
