"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outbreakQueryKeys } from "@/src/features/outbreak/hooks/outbreak-query-keys";
import { deleteOutbreak } from "@/src/features/outbreak/lib/outbreak-client";

export function useDeleteOutbreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outbreakId: number) => deleteOutbreak(outbreakId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: outbreakQueryKeys.list() });
    }
  });
}
