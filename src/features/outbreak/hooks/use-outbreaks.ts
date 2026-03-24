"use client";

import { useQuery } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { fetchOutbreaks } from "@/src/features/outbreak/lib/outbreak-client";

export function useOutbreaks() {
  return useQuery({
    queryKey: outbreakQueryKeys.list(),
    queryFn: fetchOutbreaks,
    staleTime: 60 * 1000
  });
}
