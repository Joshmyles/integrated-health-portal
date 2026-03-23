export const userQueryKeys = {
  detail: (userId: number) => ["users", "detail", userId] as const,
  list: (page: number, limit: number) => ["users", "list", page, limit] as const,
  permissions: (userId: number) => ["users", "permissions", userId] as const
};
