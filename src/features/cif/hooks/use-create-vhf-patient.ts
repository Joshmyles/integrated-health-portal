"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { createVhfPatient } from "@/src/features/cif/lib/cif-client";
import type { VhfPatientWritePayload } from "@/src/features/cif/types/cif";

export function useCreateVhfPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VhfPatientWritePayload) => createVhfPatient(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cifQueryKeys.vhfPatients() });
    }
  });
}
