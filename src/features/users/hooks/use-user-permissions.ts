"use client";

import { useQuery } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { fetchUserPermissions } from "@/src/features/users/lib/users-client";

export function useUserPermissions(userId: number | null) {
  return useQuery({
    queryKey: userQueryKeys.permissions(userId ?? 0),
    queryFn: () => fetchUserPermissions(userId ?? 0),
    enabled: userId !== null,
    staleTime: 60 * 1000
  });
}
