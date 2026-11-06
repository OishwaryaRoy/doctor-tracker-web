"use client";

import { createContext, useContext } from "react";
import type { User } from "@/lib/api/types";

const SessionContext = createContext<User | null>(null);

export function SessionProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSession must be used inside <SessionProvider>");
  return { user, canEdit: user.role === "admin" };
}
