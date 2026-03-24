"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { updateResource } from "@/src/features/resource-management/lib/resource-management-client";
import type { ResourceWritePayload } from "@/src/features/resource-management/types/resource-management";

interface UpdateResourceInput {
  payload: ResourceWritePayload;
  resourceId: number;
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, resourceId }: UpdateResourceInput) =>
      updateResource(resourceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.resources() });
    }
  });
}
