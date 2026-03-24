"use client";

import { useQuery } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { fetchOutbreakAssignments } from "@/src/features/outbreak/lib/outbreak-client";

export function useOutbreakAssignments(enabled: boolean) {
  return useQuery({
    queryKey: outbreakQueryKeys.assignments(),
    queryFn: fetchOutbreakAssignments,
    enabled,
    staleTime: 60 * 1000
  });
}
