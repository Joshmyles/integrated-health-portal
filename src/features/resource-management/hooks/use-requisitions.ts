"use client";

import { useQuery } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { fetchRequisitions } from "@/src/features/resource-management/lib/resource-management-client";

export function useRequisitions() {
  return useQuery({
    queryKey: resourceManagementQueryKeys.requisitions(),
    queryFn: fetchRequisitions,
    staleTime: 60 * 1000
  });
}
