"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  createEmployee,
  type CreateEmployeePayload
} from "@/src/features/portal/lib/employee-client";

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployee(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: portalQueryKeys.content("employees") }),
        queryClient.invalidateQueries({ queryKey: portalQueryKeys.content("human-resources") })
      ]);
    }
  });
}
