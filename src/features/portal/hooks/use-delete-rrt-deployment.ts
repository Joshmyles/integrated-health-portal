"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import { deleteRrtDeployment } from "@/src/features/portal/lib/rrt-deployment-client";

export function useDeleteRrtDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: number) => deleteRrtDeployment(deploymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("deployment-rrt-deployments")
      });
    }
  });
}
