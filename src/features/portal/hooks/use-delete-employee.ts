"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import { deleteEmployee } from "@/src/features/portal/lib/employee-client";

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) => deleteEmployee(employeeId),
    onSuccess: async (data, employeeId) => {
      void data;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: portalQueryKeys.content("employees") }),
        queryClient.invalidateQueries({ queryKey: portalQueryKeys.content("human-resources") }),
        queryClient.invalidateQueries({
          queryKey: ["portal", "employee-detail", employeeId]
        })
      ]);
    }
  });
}
