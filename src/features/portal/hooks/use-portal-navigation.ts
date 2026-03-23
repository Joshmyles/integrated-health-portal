"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPortalNavigation } from "@/src/features/portal/lib/portal-client";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";

export function usePortalNavigation() {
  return useQuery({
    queryKey: portalQueryKeys.navigation,
    queryFn: fetchPortalNavigation,
    staleTime: 10 * 60 * 1000
  });
}
