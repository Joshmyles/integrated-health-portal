"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { updateOutbreak } from "@/src/features/outbreak/lib/outbreak-client";
import type { UpdateOutbreakPayload } from "@/src/features/outbreak/types/outbreak";

interface UpdateOutbreakInput {
  outbreakId: number;
  payload: UpdateOutbreakPayload;
}

export function useUpdateOutbreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ outbreakId, payload }: UpdateOutbreakInput) =>
      updateOutbreak(outbreakId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: outbreakQueryKeys.list() });
    }
  });
}
