"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { createRequisition } from "@/src/features/resource-management/lib/resource-management-client";
import type { CreateRequisitionPayload } from "@/src/features/resource-management/types/resource-management";

export function useCreateRequisition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRequisitionPayload) => createRequisition(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: resourceManagementQueryKeys.requisitions()
      });
    }
  });
}
