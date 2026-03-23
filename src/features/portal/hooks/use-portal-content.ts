"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import { fetchPortalContent } from "@/src/features/portal/lib/portal-client";

export function usePortalContent(nodeId: string) {
  return useQuery({
    queryKey: portalQueryKeys.content(nodeId),
    queryFn: () => fetchPortalContent(nodeId),
    enabled: Boolean(nodeId),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData
  });
}
