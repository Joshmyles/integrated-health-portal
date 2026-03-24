"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  updateRrtTeam,
  type UpdateRrtTeamPayload
} from "@/src/features/portal/lib/rrt-team-client";

export function useUpdateRrtTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, payload }: { payload: UpdateRrtTeamPayload; teamId: number }) =>
      updateRrtTeam(teamId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("deployment-rrt-teams")
      });
    }
  });
}
