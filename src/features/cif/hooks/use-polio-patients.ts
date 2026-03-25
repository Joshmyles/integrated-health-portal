"use client";

import { useQuery } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { fetchPolioPatients } from "@/src/features/cif/lib/cif-client";

export function usePolioPatients(outbreakId: string) {
  return useQuery({
    queryKey: cifQueryKeys.polioPatients(outbreakId),
    queryFn: () => fetchPolioPatients(outbreakId),
    enabled: Boolean(outbreakId.trim()),
    staleTime: 60 * 1000
  });
}
