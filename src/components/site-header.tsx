"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { ROLE_LABELS } from "@/lib/types";

export function SiteHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          ImageLab
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-copper">
                Dashboard
              </Link>
              <span className="rounded-full bg-pine px-3 py-1 text-xs text-paper">
                {ROLE_LABELS[user.role]}
              </span>
              <button type="button" onClick={() => logout()} className="hover:text-copper">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-copper">
                Log in
              </Link>
              <Link href="/register" className="rounded-full bg-copper px-4 py-2 text-paper">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
