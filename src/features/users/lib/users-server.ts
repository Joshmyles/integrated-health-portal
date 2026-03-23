import "server-only";

import { cookies } from "next/headers";
import {
  UPSTREAM_RESPONSE_SESSION_COOKIE_NAME,
  UPSTREAM_RESPONSE_SESSION_KEY
} from "@/src/features/auth/lib/auth-session";

const RESPONSE_HEALTH_BASE_URL =
  process.env.HEALTH_PORTAL_BASE_URL ?? "https://response.health.go.ug";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

  return null;
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.trim() || null;
}

export class ResponseHealthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResponseHealthApiError";
    this.status = status;
  }
}

export function normalizePageSize(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsedValue), 100);
}

export async function requestResponseHealth<T>(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies();
  const upstreamSessionCookie = cookieStore.get(UPSTREAM_RESPONSE_SESSION_COOKIE_NAME)?.value;
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (upstreamSessionCookie) {
    headers.set(
      "Cookie",
      `${UPSTREAM_RESPONSE_SESSION_KEY}=${decodeURIComponent(upstreamSessionCookie)}`
    );
  }

  const response = await fetch(`${RESPONSE_HEALTH_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual"
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new ResponseHealthApiError(
      extractMessage(payload) ?? "The upstream platform request failed.",
      response.status
    );
  }

  return payload as T;
}
