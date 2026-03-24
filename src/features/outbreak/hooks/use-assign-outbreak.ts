"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { assignOutbreak } from "@/src/features/outbreak/lib/outbreak-client";
import type { AssignOutbreakPayload } from "@/src/features/outbreak/types/outbreak";

export function useAssignOutbreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignOutbreakPayload) => assignOutbreak(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: outbreakQueryKeys.list() });
    }
  });
}
