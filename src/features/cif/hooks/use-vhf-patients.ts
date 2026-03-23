"use client";

import { useQuery } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { fetchVhfPatients } from "@/src/features/cif/lib/cif-client";

export function useVhfPatients() {
  return useQuery({
    queryKey: cifQueryKeys.vhfPatients(),
    queryFn: fetchVhfPatients,
    staleTime: 60 * 1000
  });
}
