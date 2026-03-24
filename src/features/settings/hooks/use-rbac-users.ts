"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { fetchRbacUsers } from "@/src/features/settings/lib/settings-client";
import type { RbacUserListItem } from "@/src/features/settings/types/settings";

function normalizeUsers(data: unknown): RbacUserListItem[] {
  if (Array.isArray(data)) {
    return data as RbacUserListItem[];
  }

  if (data && typeof data === "object" && "users" in data) {
    const u = (data as { users?: unknown }).users;
    return Array.isArray(u) ? (u as RbacUserListItem[]) : [];
  }

  return [];
}

export function useRbacUsers() {
  return useQuery({
    queryKey: settingsQueryKeys.rbacUsers(),
    queryFn: async () => {
      const data = await fetchRbacUsers();
      return normalizeUsers(data);
    },
    staleTime: 2 * 60 * 1000
  });
}
