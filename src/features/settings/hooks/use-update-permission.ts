"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { updatePermission } from "@/src/features/settings/lib/settings-client";
import type { UpdatePermissionPayload } from "@/src/features/settings/types/settings";

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePermissionPayload }) =>
      updatePermission(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.permissions() });
    }
  });
}
