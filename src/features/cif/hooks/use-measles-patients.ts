"use client";

import { useQuery } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { fetchMeaslesPatients } from "@/src/features/cif/lib/cif-client";

export function useMeaslesPatients(outbreakId: string) {
  return useQuery({
    queryKey: cifQueryKeys.measlesPatients(outbreakId),
    queryFn: () => fetchMeaslesPatients(outbreakId),
    enabled: Boolean(outbreakId.trim()),
    staleTime: 60 * 1000
  });
}
