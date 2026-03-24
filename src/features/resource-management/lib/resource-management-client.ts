"use client";

import type {
  ActivityLogMutationResponse,
  ActivityLogsResponse,
  ActivityLogWritePayload,
  CreateRequisitionPayload,
  RequisitionMutationResponse,
  RequisitionsResponse,
  PillarDetailResponse,
  PillarMutationResponse,
  PillarsResponse,
  PillarWritePayload,
  ResourceCategoriesResponse,
  ResourceCategoryDetailResponse,
  ResourceCategoryMutationResponse,
  ResourceCategoryWritePayload,
  ResourceDetailResponse,
  ResourceMutationResponse,
  ResourcesResponse,
  ResourceWritePayload
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
  const payload = await requestJson<RequisitionsResponse>("/api/resource-management/requisitions");
  return payload;
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

export async function updateRequisition(
  id: number,
  data: CreateRequisitionPayload
): Promise<RequisitionMutationResponse> {
  return requestJson<RequisitionMutationResponse>(`/api/resource-management/requisitions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function deleteRequisition(
  id: number
): Promise<RequisitionMutationResponse> {
  return requestJson<RequisitionMutationResponse>(`/api/resource-management/requisitions/${id}`, {
    method: "DELETE"
  });
}
function createJsonRequest(path: string, method: string, payload?: object) {
  return requestJson<PillarMutationResponse | ResourceMutationResponse>(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

function createTypedJsonRequest<T>(path: string, method: string, payload?: object) {
  return requestJson<T>(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

export function fetchLegacyPillars() {
  return requestJson<PillarsResponse>("/api/pillars");
}

export function fetchResourceManagementPillars() {
  return requestJson<PillarsResponse>("/api/resource-management/pillars");
}

export function fetchResourceManagementPillar(pillarId: number) {
  return requestJson<PillarDetailResponse>(`/api/resource-management/pillars/${pillarId}`);
}

export function createResourceManagementPillar(payload: PillarWritePayload) {
  return createTypedJsonRequest<PillarMutationResponse>(
    "/api/resource-management/pillars",
    "POST",
    payload
  );
}

export function updateResourceManagementPillar(
  pillarId: number,
  payload: PillarWritePayload
) {
  return createTypedJsonRequest<PillarMutationResponse>(
    `/api/resource-management/pillars/${pillarId}`,
    "PUT",
    payload
  );
}

export function deleteResourceManagementPillar(pillarId: number) {
  return createTypedJsonRequest<PillarMutationResponse>(
    `/api/resource-management/pillars/${pillarId}`,
    "DELETE"
  );
}

export function fetchResourceCategories() {
  return requestJson<ResourceCategoriesResponse>(
    "/api/resource-management/resource-categories"
  );
}

export function fetchResourceCategory(categoryId: number) {
  return requestJson<ResourceCategoryDetailResponse>(
    `/api/resource-management/resource-categories/${categoryId}`
  );
}

export function createResourceCategory(payload: ResourceCategoryWritePayload) {
  return createTypedJsonRequest<ResourceCategoryMutationResponse>(
    "/api/resource-management/resource-categories",
    "POST",
    payload
  );
}

export function fetchResources() {
  return requestJson<ResourcesResponse>("/api/resource-management/resources");
}

export function fetchResource(resourceId: number) {
  return requestJson<ResourceDetailResponse>(`/api/resource-management/resources/${resourceId}`);
}

export function createResource(payload: ResourceWritePayload) {
  return createTypedJsonRequest<ResourceMutationResponse>(
    "/api/resource-management/resources",
    "POST",
    payload
  );
}

export function updateResource(resourceId: number, payload: ResourceWritePayload) {
  return createTypedJsonRequest<ResourceMutationResponse>(
    `/api/resource-management/resources/${resourceId}`,
    "PUT",
    payload
  );
}

export function deleteResource(resourceId: number) {
  return createTypedJsonRequest<ResourceMutationResponse>(
    `/api/resource-management/resources/${resourceId}`,
    "DELETE"
  );
}

export function fetchActivityLogs(): Promise<ActivityLogsResponse> {
  return requestJson<ActivityLogsResponse>("/api/resource-management/activity-logs");
}

export function fetchActivityLog(id: number): Promise<{ activity_log: ActivityLogMutationResponse }> {
  return requestJson(`/api/resource-management/activity-logs/${id}`);
}

export function createActivityLog(
  payload: ActivityLogWritePayload
): Promise<ActivityLogMutationResponse> {
  return createTypedJsonRequest<ActivityLogMutationResponse>(
    "/api/resource-management/activity-logs",
    "POST",
    payload
  );
}

export function updateActivityLog(
  id: number,
  payload: ActivityLogWritePayload
): Promise<ActivityLogMutationResponse> {
  return createTypedJsonRequest<ActivityLogMutationResponse>(
    `/api/resource-management/activity-logs/${id}`,
    "PUT",
    payload
  );
}

export function deleteActivityLog(id: number): Promise<ActivityLogMutationResponse> {
  return createTypedJsonRequest<ActivityLogMutationResponse>(
    `/api/resource-management/activity-logs/${id}`,
    "DELETE"
  );
}
