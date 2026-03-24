"use client";

import { useQuery } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { fetchVhfPatientDetail } from "@/src/features/cif/lib/cif-client";

export function useVhfPatientDetail(patientId: number | null) {
  return useQuery({
    queryKey: cifQueryKeys.vhfPatient(patientId ?? 0),
    queryFn: () => fetchVhfPatientDetail(patientId ?? 0),
    enabled: patientId !== null,
    staleTime: 60 * 1000
  });
}
