"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ApiSuccess, AuthSession, PublicUser } from "@/lib/types";

const STORAGE_KEY = "imagelab.session";

interface AuthContextValue {
  user: PublicUser | null;
  accessToken: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      queueMicrotask(() => setReady(true));
      return;
    }

    api<ApiSuccess<PublicUser>>("/auth/me", {}, stored.accessToken)
      .then((result) => {
        const next = { ...stored, user: result.data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession(next);
      })
      .catch(async () => {
        try {
          const refreshed = await api<ApiSuccess<AuthSession>>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken: stored.refreshToken }),
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed.data));
          setSession(refreshed.data);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      ready,
      async login(email, password) {
        const result = await api<ApiSuccess<AuthSession>>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        setSession(result.data);
      },
      async register(name, email, password) {
        const result = await api<ApiSuccess<AuthSession>>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        setSession(result.data);
      },
      async logout() {
        if (session?.refreshToken) {
          await api("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          }).catch(() => undefined);
        }
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      },
      async refreshUser() {
        if (!session?.accessToken) return;
        const result = await api<ApiSuccess<PublicUser>>("/auth/me", {}, session.accessToken);
        const next = { ...session, user: result.data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession(next);
      },
    }),
    [ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
