"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ROLE_LABELS, can } from "@/lib/types";

const libraryLinks = [
  { href: "/dashboard", label: "Assets", exact: true },
  { href: "/dashboard/folders", label: "Folders", exact: true },
  { href: "/dashboard/collections", label: "Collections", exact: true },
];

export function MediaLibraryShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-sand text-ink">
      <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden bg-plum text-paper">
        <Link href="/" className="border-b border-white/10 px-5 py-4 font-serif text-2xl tracking-tight">
          ImageLab
        </Link>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 text-sm">
          <p className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Media library</p>
          <ul className="mt-2 space-y-0.5">
            {libraryLinks.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-lg px-3 py-2 ${active ? "bg-white/15 text-paper" : "text-white/70 hover:bg-white/10 hover:text-paper"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {user && can(user.role, "user:read") ? (
            <>
              <p className="mt-6 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Admin</p>
              <Link
                href="/dashboard/users"
                className={`mt-2 block rounded-lg px-3 py-2 ${pathname.startsWith("/dashboard/users") ? "bg-white/15 text-paper" : "text-white/70 hover:bg-white/10 hover:text-paper"}`}
              >
                Users
              </Link>
            </>
          ) : null}
        </nav>
        {user ? (
          <div className="border-t border-white/10 px-4 py-4">
            <p className="truncate text-sm">{user.name}</p>
            <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>
            <button type="button" onClick={() => void logout()} className="mt-2 text-xs text-white/70 hover:text-paper">
              Log out
            </button>
          </div>
        ) : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
