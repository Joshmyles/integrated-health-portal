"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { updateVhfPatient } from "@/src/features/cif/lib/cif-client";
import type { VhfPatientWritePayload } from "@/src/features/cif/types/cif";

interface UpdateVhfPatientInput {
  patientId: number;
  payload: VhfPatientWritePayload;
}

export function useUpdateVhfPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, payload }: UpdateVhfPatientInput) =>
      updateVhfPatient(patientId, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cifQueryKeys.vhfPatients() }),
        queryClient.invalidateQueries({
          queryKey: cifQueryKeys.vhfPatient(variables.patientId)
        })
      ]);
    }
  });
}
