"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { createResource } from "@/src/features/resource-management/lib/resource-management-client";
import type { ResourceWritePayload } from "@/src/features/resource-management/types/resource-management";

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ResourceWritePayload) => createResource(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.resources() });
    }
  });
}
