"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/src/features/portal/hooks/portal-query-keys";
import {
  createRrtTeam,
  type CreateRrtTeamPayload
} from "@/src/features/portal/lib/rrt-team-client";

export function useCreateRrtTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRrtTeamPayload) => createRrtTeam(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.content("deployment-rrt-teams")
      });
    }
  });
}
