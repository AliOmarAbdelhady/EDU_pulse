"use client";

import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    role: session?.user?.role,
    id: session?.user?.id,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
