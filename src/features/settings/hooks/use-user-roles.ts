"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { fetchUserRoles } from "@/src/features/settings/lib/settings-client";

/**
 * Normalizes the upstream role response to a plain number[] of role IDs,
 * regardless of whether the API returns { role_ids: [...] },
 * { roles: [{id, name}, ...] }, or a bare array.
 */
function extractRoleIds(data: unknown): number[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data
      .map((item) =>
        typeof item === "number" ? item : (item as Record<string, unknown>)?.id
      )
      .filter((id): id is number => typeof id === "number" && id > 0);
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.role_ids)) {
      return (obj.role_ids as unknown[]).filter(
        (id): id is number => typeof id === "number" && id > 0
      );
    }

    if (Array.isArray(obj.roles)) {
      return (obj.roles as unknown[])
        .map((item) =>
          typeof item === "number" ? item : (item as Record<string, unknown>)?.id
        )
        .filter((id): id is number => typeof id === "number" && id > 0);
    }
  }

  return [];
}

export function useUserRoles(userId: number | null) {
  return useQuery({
    queryKey: settingsQueryKeys.userRoles(userId ?? 0),
    queryFn: async () => {
      const data = await fetchUserRoles(userId!);
      return extractRoleIds(data);
    },
    enabled: userId !== null && userId > 0,
    staleTime: 60 * 1000
  });
}
