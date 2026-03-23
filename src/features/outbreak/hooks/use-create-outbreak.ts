"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { createOutbreak } from "@/src/features/outbreak/lib/outbreak-client";
import type { CreateOutbreakPayload } from "@/src/features/outbreak/types/outbreak";

export function useCreateOutbreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOutbreakPayload) => createOutbreak(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: outbreakQueryKeys.list() });
    }
  });
}
