"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { deletePermission } from "@/src/features/settings/lib/settings-client";

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.permissions() });
    }
  });
}
