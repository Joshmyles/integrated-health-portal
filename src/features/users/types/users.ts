export interface UserPagination {
  limit: number;
  page: number;
  total: number;
  total_pages: number;
}

export interface UserListItem {
  created_at: string;
  department_name: string;
  email: string;
  first_name: string;
  id: number;
  is_active: boolean;
  is_locked: boolean;
  last_login_at: string;
  last_name: string;
  roles: string[];
  username: string;
}

export interface UsersListResponse {
  pagination: UserPagination;
  users: UserListItem[];
}

export interface UserDetail extends UserListItem {
  department_id: number;
  role_ids: number[];
  updated_at: string;
}

export interface UserPermission {
  action: string;
  description: string;
  id: number;
  is_active: boolean;
  name: string;
  resource: string;
}

export interface UserPermissionsResponse {
  permissions: UserPermission[];
}

export type UpdateUserPayload = Record<string, unknown>;
