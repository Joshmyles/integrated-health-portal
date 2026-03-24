"use client";

import { useQuery } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { fetchActivityLogs } from "@/src/features/resource-management/lib/resource-management-client";

export function useActivityLogs() {
  return useQuery({
    queryKey: resourceManagementQueryKeys.activityLogs(),
    queryFn: fetchActivityLogs,
    staleTime: 60 * 1000
  });
}
