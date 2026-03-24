"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { updateRole } from "@/src/features/settings/lib/settings-client";
import type { UpdateRolePayload } from "@/src/features/settings/types/settings";

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}
