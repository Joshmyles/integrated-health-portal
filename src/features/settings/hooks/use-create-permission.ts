"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { createPermission } from "@/src/features/settings/lib/settings-client";
import type { CreatePermissionPayload } from "@/src/features/settings/types/settings";

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) => createPermission(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.permissions() });
    }
  });
}
