import type {
  RolesResponse,
  UpdateUserPayload,
  UserDetail,
  UserPermissionsResponse,
  UsersListResponse
} from "@/src/features/users/types/users";

interface ErrorPayload {
  message?: string;
}

export class UsersRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UsersRequestError";
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
    throw new UsersRequestError(
      payload?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export function fetchUsers(page: number, limit: number) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page)
  });

  return requestJson<UsersListResponse>(`/api/users?${params.toString()}`);
}

export function fetchUserDetail(userId: number) {
  return requestJson<UserDetail>(`/api/users/${userId}`);
}

export function fetchUserPermissions(userId: number) {
  return requestJson<UserPermissionsResponse>(`/api/users/${userId}/permissions`);
}

export function fetchRoles() {
  return requestJson<RolesResponse>("/api/rbac/roles");
}

export function updateUser(userId: number, payload: UpdateUserPayload) {
  return requestJson<unknown>(`/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
