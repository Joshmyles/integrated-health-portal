"use client";

import { useQuery } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { fetchLegacyPillars } from "@/src/features/resource-management/lib/resource-management-client";

export function useLegacyPillars(enabled = true) {
  return useQuery({
    queryKey: resourceManagementQueryKeys.legacyPillars(),
    queryFn: fetchLegacyPillars,
    enabled,
    staleTime: 60 * 1000
  });
}
