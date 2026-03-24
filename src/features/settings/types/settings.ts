export interface Permission {
  action: string;
  created_at: string;
  description: string;
  id: number;
  is_active: boolean;
  name: string;
  resource: string;
  updated_at: string;
}

export interface PermissionsResponse {
  permissions?: Permission[];
}

export interface CreatePermissionPayload {
  action: string;
  description: string;
  name: string;
  resource: string;
}

export type UpdatePermissionPayload = CreatePermissionPayload;

export interface CreateRolePayload {
  description: string;
  name: string;
}

export type UpdateRolePayload = CreateRolePayload;

export interface RbacUserListItem {
  created_at?: string;
  department_name?: string;
  email?: string;
  first_name?: string;
  id: number;
  is_active?: boolean;
  is_locked?: boolean;
  last_login_at?: string;
  last_name?: string;
  roles?: string[];
  username: string;
}

export interface RbacUsersResponse {
  users?: RbacUserListItem[];
  pagination?: {
    page: number;
    total: number;
    total_pages: number;
    limit: number;
  };
}

export interface UserRolesResponse {
  role_ids?: number[];
  roles?: string[];
  [key: string]: unknown;
}
