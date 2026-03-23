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

export interface RoleSummary {
  created_at: string;
  description: string;
  id: number;
  is_active: boolean;
  name: string;
  permission_count: number;
  updated_at: string;
  user_count: number;
}

export interface RolesResponse {
  roles: RoleSummary[];
}

export interface UpdateUserPayload {
  department_id: number;
  email: string;
  first_name: string;
  is_active: boolean;
  is_locked: boolean;
  last_name: string;
  role_ids: number[];
  username: string;
}
