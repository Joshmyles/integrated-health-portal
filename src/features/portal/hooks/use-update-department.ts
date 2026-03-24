"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  updateDepartment,
  type DepartmentPayload
} from "@/src/features/portal/lib/department-client";

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      departmentId,
      payload
    }: {
      departmentId: number;
      payload: DepartmentPayload;
    }) => updateDepartment(departmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("departments")
      });
    }
  });
}
