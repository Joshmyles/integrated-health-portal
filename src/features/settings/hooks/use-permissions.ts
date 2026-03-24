"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { fetchPermissions } from "@/src/features/settings/lib/settings-client";
import type { Permission } from "@/src/features/settings/types/settings";

function normalizePermissions(data: unknown): Permission[] {
  if (Array.isArray(data)) {
    return data as Permission[];
  }

  if (data && typeof data === "object" && "permissions" in data) {
    const p = (data as { permissions?: unknown }).permissions;
    return Array.isArray(p) ? (p as Permission[]) : [];
  }

  return [];
}

export function usePermissions() {
  return useQuery({
    queryKey: settingsQueryKeys.permissions(),
    queryFn: async () => {
      const data = await fetchPermissions();
      return normalizePermissions(data);
    },
    staleTime: 2 * 60 * 1000
  });
}
