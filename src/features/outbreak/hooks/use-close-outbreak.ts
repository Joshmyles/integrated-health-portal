"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { closeOutbreak } from "@/src/features/outbreak/lib/outbreak-client";

export function useCloseOutbreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outbreakId: number) => closeOutbreak(outbreakId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: outbreakQueryKeys.list() });
    }
  });
}
