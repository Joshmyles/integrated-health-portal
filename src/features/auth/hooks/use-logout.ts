"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "@/src/features/auth/hooks/auth-query-keys";
import { logout } from "@/src/features/auth/lib/auth-client";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries({ queryKey: ["portal"] });
      queryClient.removeQueries({ queryKey: authQueryKeys.session });
    }
  });
}
