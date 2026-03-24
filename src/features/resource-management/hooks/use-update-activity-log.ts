"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { updateActivityLog } from "@/src/features/resource-management/lib/resource-management-client";
import type { ActivityLogWritePayload } from "@/src/features/resource-management/types/resource-management";

export function useUpdateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActivityLogWritePayload }) =>
      updateActivityLog(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: resourceManagementQueryKeys.activityLogs()
      });
      queryClient.invalidateQueries({
        queryKey: resourceManagementQueryKeys.activityLog(id)
      });
    }
  });
}
