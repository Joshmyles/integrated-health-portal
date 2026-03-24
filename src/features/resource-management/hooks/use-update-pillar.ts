"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { updateResourceManagementPillar } from "@/src/features/resource-management/lib/resource-management-client";
import type { PillarWritePayload } from "@/src/features/resource-management/types/resource-management";

interface UpdatePillarInput {
  payload: PillarWritePayload;
  pillarId: number;
}

export function useUpdatePillar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, pillarId }: UpdatePillarInput) =>
      updateResourceManagementPillar(pillarId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.pillars() }),
        queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.legacyPillars() })
      ]);
    }
  });
}
