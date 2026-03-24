"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { deleteVhfPatient } from "@/src/features/cif/lib/cif-client";

export function useDeleteVhfPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: number) => deleteVhfPatient(patientId),
    onSuccess: async (_, patientId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cifQueryKeys.vhfPatients() }),
        queryClient.removeQueries({ queryKey: cifQueryKeys.vhfPatient(patientId) })
      ]);
    }
  });
}
