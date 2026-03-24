"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/src/features/users/lib/users-client";

const ASSIGNABLE_USERS_PAGE = 1;
const ASSIGNABLE_USERS_LIMIT = 100;

export function useAssignableUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["outbreaks", "assignable-users", ASSIGNABLE_USERS_PAGE, ASSIGNABLE_USERS_LIMIT],
    queryFn: () => fetchUsers(ASSIGNABLE_USERS_PAGE, ASSIGNABLE_USERS_LIMIT),
    enabled,
    staleTime: 60 * 1000
  });
}
