"use client";

import { useQuery } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { fetchResourceManagementPillars } from "@/src/features/resource-management/lib/resource-management-client";

export function usePillars(enabled = true) {
  return useQuery({
    queryKey: resourceManagementQueryKeys.pillars(),
    queryFn: fetchResourceManagementPillars,
    enabled,
    staleTime: 60 * 1000
  });
}
