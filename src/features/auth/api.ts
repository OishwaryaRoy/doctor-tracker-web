"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export type LoginInput = { email: string; password: string };

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api.post<{ data: { user: User; expiresAt: string } }>("/auth/login", input),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSettled: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}
