"use client";

import { useQuery } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { fetchUserDetail } from "@/src/features/users/lib/users-client";

export function useUserDetail(userId: number | null) {
  return useQuery({
    queryKey: userQueryKeys.detail(userId ?? 0),
    queryFn: () => fetchUserDetail(userId ?? 0),
    enabled: userId !== null,
    staleTime: 60 * 1000
  });
}
