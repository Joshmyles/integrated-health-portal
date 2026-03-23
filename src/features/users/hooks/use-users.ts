"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { fetchUsers } from "@/src/features/users/lib/users-client";

export function useUsers(page: number, limit: number) {
  return useQuery({
    queryKey: userQueryKeys.list(page, limit),
    queryFn: () => fetchUsers(page, limit),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000
  });
}
