"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  updateRrtDeployment,
  type RrtDeploymentPayload
} from "@/src/features/portal/lib/rrt-deployment-client";

export function useUpdateRrtDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deploymentId,
      payload
    }: {
      deploymentId: number;
      payload: RrtDeploymentPayload;
    }) => updateRrtDeployment(deploymentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("deployment-rrt-deployments")
      });
    }
  });
}
