export const settingsQueryKeys = {
  rbacStats: () => ["settings", "rbac-stats"] as const,
  roleStats: () => ["settings", "role-stats"] as const,
  permissionStats: () => ["settings", "permission-stats"] as const,
  migrationStatus: () => ["settings", "migration-status"] as const,
  permissions: () => ["settings", "permissions"] as const,
  rbacUsers: () => ["settings", "rbac-users"] as const,
  userRoles: (userId: number) => ["settings", "user-roles", userId] as const
};
