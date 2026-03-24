"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { deleteResourceManagementPillar } from "@/src/features/resource-management/lib/resource-management-client";

export function useDeletePillar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pillarId: number) => deleteResourceManagementPillar(pillarId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.pillars() }),
        queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.legacyPillars() })
      ]);
    }
  });
}
