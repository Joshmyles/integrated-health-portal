"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "@/src/features/users/hooks/user-query-keys";
import { updateUser } from "@/src/features/users/lib/users-client";
import type { UpdateUserPayload } from "@/src/features/users/types/users";

interface UpdateUserInput {
  payload: UpdateUserPayload;
  userId: number;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, userId }: UpdateUserInput) => updateUser(userId, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "list"] }),
        queryClient.invalidateQueries({
          queryKey: userQueryKeys.detail(variables.userId)
        }),
        queryClient.invalidateQueries({
          queryKey: userQueryKeys.permissions(variables.userId)
        })
      ]);
    }
  });
}
