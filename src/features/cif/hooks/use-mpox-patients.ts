"use client";

import { useQuery } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { fetchMpoxPatients } from "@/src/features/cif/lib/cif-client";

export function useMpoxPatients() {
  return useQuery({
    queryKey: cifQueryKeys.mpoxPatients(),
    queryFn: fetchMpoxPatients,
    staleTime: 60 * 1000
  });
}
