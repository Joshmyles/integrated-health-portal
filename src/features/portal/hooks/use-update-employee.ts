"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  updateEmployee,
  type CreateEmployeePayload
} from "@/src/features/portal/lib/employee-client";

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => updateEmployee(payload),
    onSuccess: async (_data, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: portalQueryKeys.content("employees") }),
        queryClient.invalidateQueries({ queryKey: portalQueryKeys.content("human-resources") }),
        queryClient.invalidateQueries({
          queryKey: ["portal", "employee-detail", payload.employee_id ?? null]
        })
      ]);
    }
  });
}
