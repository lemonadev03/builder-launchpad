"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

type SessionData = ReturnType<typeof authClient.useSession>;

const AuthContext = createContext<SessionData | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();

  return (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  return context;
}
