"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import { replaceUserRoles } from "@/src/features/settings/lib/settings-client";

export function useReplaceUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      replaceUserRoles(userId, roleIds),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.userRoles(userId) });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.rbacUsers() });
    }
  });
}
