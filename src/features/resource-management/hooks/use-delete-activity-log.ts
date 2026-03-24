"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { deleteActivityLog } from "@/src/features/resource-management/lib/resource-management-client";

export function useDeleteActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivityLog,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: resourceManagementQueryKeys.activityLogs()
      });
    }
  });
}
