"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { deleteResource } from "@/src/features/resource-management/lib/resource-management-client";

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resourceId: number) => deleteResource(resourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceManagementQueryKeys.resources() });
    }
  });
}
