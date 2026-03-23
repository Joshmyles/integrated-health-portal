"use client";

import { useMutation } from "@tanstack/react-query";
import { login, type LoginCredentials } from "@/src/features/auth/lib/auth-client";

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials)
  });
}
