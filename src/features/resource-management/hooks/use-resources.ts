"use client";

import { useQuery } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { fetchResources } from "@/src/features/resource-management/lib/resource-management-client";

export function useResources(enabled = true) {
  return useQuery({
    queryKey: resourceManagementQueryKeys.resources(),
    queryFn: fetchResources,
    enabled,
    staleTime: 60 * 1000
  });
}
