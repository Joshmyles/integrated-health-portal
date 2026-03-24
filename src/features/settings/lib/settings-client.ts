import type {
  CreatePermissionPayload,
  CreateRolePayload,
  Permission,
  RbacUsersResponse,
  UpdatePermissionPayload,
  UpdateRolePayload,
  UserRolesResponse
} from "@/src/features/settings/types/settings";

interface ErrorPayload {
  message?: string;
}

export class SettingsRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SettingsRequestError";
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
    throw new SettingsRequestError(
      payload?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

// Stats
export function fetchRbacStats() {
  return requestJson<Record<string, unknown>>("/api/rbac/stats");
}

export function fetchRoleStats() {
  return requestJson<Record<string, unknown>>("/api/rbac/role-stats");
}

export function fetchPermissionStats() {
  return requestJson<Record<string, unknown>>("/api/rbac/permission-stats");
}

export function fetchMigrationStatus() {
  return requestJson<Record<string, unknown>>("/api/rbac/migration-status");
}

// Permissions CRUD
export function fetchPermissions() {
  return requestJson<Permission[] | { permissions: Permission[] }>("/api/rbac/permissions");
}

export function createPermission(payload: CreatePermissionPayload) {
  return requestJson<unknown>("/api/rbac/permissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function updatePermission(id: number, payload: UpdatePermissionPayload) {
  return requestJson<unknown>(`/api/rbac/permissions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function deletePermission(id: number) {
  return requestJson<unknown>(`/api/rbac/permissions/${id}`, {
    method: "DELETE"
  });
}

// Role mutations (list handled by existing useRoles from users feature)
export function createRole(payload: CreateRolePayload) {
  return requestJson<unknown>("/api/rbac/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function updateRole(id: number, payload: UpdateRolePayload) {
  return requestJson<unknown>(`/api/rbac/roles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function deleteRole(id: number) {
  return requestJson<unknown>(`/api/rbac/roles/${id}`, {
    method: "DELETE"
  });
}

// User access
export function fetchRbacUsers() {
  return requestJson<RbacUsersResponse>("/api/rbac/users");
}

export function fetchUserRoles(userId: number) {
  return requestJson<UserRolesResponse>(`/api/rbac/users/${userId}/roles`);
}

export function replaceUserRoles(userId: number, roleIds: number[]) {
  return requestJson<unknown>(`/api/rbac/users/${userId}/roles`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role_ids: roleIds })
  });
}
