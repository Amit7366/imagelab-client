"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { can } from "@/lib/types";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const showOverview = Boolean(user && can(user.role, "ops:read"));

  useEffect(() => {
    if (user && !can(user.role, "user:read")) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  if (!user || !can(user.role, "user:read")) {
    return <p className="p-8 text-sm text-ink/70">Opening admin…</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-line bg-paper px-8 pt-6">
        <p className="text-sm uppercase tracking-[0.2em] text-copper">Admin</p>
        <nav className="mt-4 flex gap-6 text-sm">
          {showOverview ? (
            <Link
              href="/dashboard/admin"
              className={`border-b-2 pb-3 ${pathname === "/dashboard/admin" ? "border-copper text-ink" : "border-transparent text-ink/50 hover:text-ink"}`}
            >
              Overview
            </Link>
          ) : null}
          <Link
            href="/dashboard/admin/users"
            className={`border-b-2 pb-3 ${pathname.startsWith("/dashboard/admin/users") ? "border-copper text-ink" : "border-transparent text-ink/50 hover:text-ink"}`}
          >
            Users
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
