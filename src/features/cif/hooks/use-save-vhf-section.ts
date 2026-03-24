"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cifQueryKeys } from "@/src/features/cif/hooks/cif-query-keys";
import { saveVhfSection } from "@/src/features/cif/lib/cif-client";
import type { VhfSectionKey, VhfSectionWritePayload } from "@/src/features/cif/types/cif";

interface SaveVhfSectionInput {
  patientId: number;
  payload: VhfSectionWritePayload;
}

export function useSaveVhfSection(section: VhfSectionKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, payload }: SaveVhfSectionInput) =>
      saveVhfSection(patientId, section, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: cifQueryKeys.vhfPatient(variables.patientId)
      });
    }
  });
}
