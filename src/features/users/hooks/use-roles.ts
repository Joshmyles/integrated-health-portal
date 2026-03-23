"use client";

import { useQuery } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { fetchRoles } from "@/src/features/users/lib/users-client";

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: userQueryKeys.roles(),
    queryFn: fetchRoles,
    enabled,
    staleTime: 5 * 60 * 1000
  });
}
