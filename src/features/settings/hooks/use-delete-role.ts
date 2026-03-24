"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { deleteRole } from "@/src/features/settings/lib/settings-client";

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}
