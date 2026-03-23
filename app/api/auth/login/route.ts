import { NextResponse } from "next/server";
import {
  extractCookieValue,
  getPortalSessionCookieOptions,
  PORTAL_SESSION_COOKIE_NAME,
  UPSTREAM_RESPONSE_SESSION_COOKIE_NAME,
  UPSTREAM_RESPONSE_SESSION_KEY,
  serializePortalSession
} from "@/src/features/auth/lib/auth-session";

const UPSTREAM_LOGIN_URL =
  process.env.HEALTH_PORTAL_LOGIN_URL ?? "https://response.health.go.ug/login";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readSetCookieHeaders(headers: Headers) {
  const headerStore = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headerStore.getSetCookie === "function") {
    return headerStore.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? [setCookieHeader] : [];
}

async function parseUpstreamPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.trim();
}

function extractMessage(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload || null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedMessage = extractMessage(item);

      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const key of ["message", "detail", "error", "title"]) {
    const nestedMessage = extractMessage(payload[key]);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (isRecord(payload.errors)) {
    for (const value of Object.values(payload.errors)) {
      const nestedMessage = extractMessage(value);

      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "A valid JSON login payload is required." },
      { status: 400 }
    );
  }

  const username =
    isRecord(body) && typeof body.username === "string" ? body.username.trim() : "";
  const password =
    isRecord(body) && typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { message: "Both username and password are required." },
      { status: 400 }
    );
  }

  try {
    const upstreamResponse = await fetch(UPSTREAM_LOGIN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password, username }),
      cache: "no-store"
    });

    const upstreamPayload = await parseUpstreamPayload(upstreamResponse);

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          message:
            extractMessage(upstreamPayload) ??
            "Login failed. Please verify your username and password."
        },
        { status: upstreamResponse.status }
      );
    }

    const response = NextResponse.json({
      message: extractMessage(upstreamPayload) ?? "Login successful.",
      user: { username }
    });
    const upstreamSessionValue = extractCookieValue(
      readSetCookieHeaders(upstreamResponse.headers),
      UPSTREAM_RESPONSE_SESSION_KEY
    );

    response.cookies.set(
      PORTAL_SESSION_COOKIE_NAME,
      serializePortalSession({
        authenticatedAt: new Date().toISOString(),
        username
      }),
      getPortalSessionCookieOptions()
    );

    if (upstreamSessionValue) {
      response.cookies.set(
        UPSTREAM_RESPONSE_SESSION_COOKIE_NAME,
        encodeURIComponent(upstreamSessionValue),
        getPortalSessionCookieOptions()
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        message:
          "The authentication service is unavailable right now. Please try again shortly."
      },
      { status: 502 }
    );
  }
}
