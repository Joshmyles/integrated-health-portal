"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { createRole } from "@/src/features/settings/lib/settings-client";
import type { CreateRolePayload } from "@/src/features/settings/types/settings";

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}
