"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { createResourceManagementPillar } from "@/src/features/resource-management/lib/resource-management-client";
import type { PillarWritePayload } from "@/src/features/resource-management/types/resource-management";

export function useCreatePillar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PillarWritePayload) => createResourceManagementPillar(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.pillars() }),
        queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.legacyPillars() })
      ]);
    }
  });
}
