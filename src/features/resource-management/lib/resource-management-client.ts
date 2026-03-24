"use client";

import type {
  CreateRequisitionPayload,
  RequisitionMutationResponse,
  RequisitionsResponse
} from "@/src/features/resource-management/types/resource-management";

interface ErrorPayload {
  message?: string;
}

export class ResourceManagementRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResourceManagementRequestError";
    this.status = status;
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = await readJson<T & ErrorPayload>(response);

  if (!response.ok) {
    throw new ResourceManagementRequestError(
      payload?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export async function fetchRequisitions(): Promise<RequisitionsResponse> {
  const payload = await requestJson<unknown>("/api/resource-management/requisitions");

  if (Array.isArray(payload)) {
    return payload as RequisitionsResponse;
  }

  return [];
}

export async function createRequisition(
  data: CreateRequisitionPayload
): Promise<RequisitionMutationResponse> {
  return requestJson<RequisitionMutationResponse>("/api/resource-management/requisitions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
