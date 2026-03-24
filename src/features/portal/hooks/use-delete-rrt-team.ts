"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import { deleteRrtTeam } from "@/src/features/portal/lib/rrt-team-client";

export function useDeleteRrtTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: number) => deleteRrtTeam(teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("deployment-rrt-teams")
      });
    }
  });
}
