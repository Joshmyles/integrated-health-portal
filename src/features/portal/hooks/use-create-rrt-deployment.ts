"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  createRrtDeployment,
  type RrtDeploymentPayload
} from "@/src/features/portal/lib/rrt-deployment-client";

export function useCreateRrtDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RrtDeploymentPayload) => createRrtDeployment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("deployment-rrt-deployments")
      });
    }
  });
}
