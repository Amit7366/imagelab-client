"use client";

import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { api } from "@/lib/api";
import { PLAN_LABELS, ROLE_LABELS, can, type ApiSuccess, type BillingPlansData, type PlanId } from "@/lib/types";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
});

type Credits = {
  remaining: number;
  quota: number;
  plan: PlanId;
  usedBytes: number;
  quotaBytes: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export function MediaLibraryShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, logout } = useAuth();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [hash, setHash] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("console-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    api<ApiSuccess<BillingPlansData>>("/billing/plans", {}, accessToken)
      .then((result) => {
        setCredits({
          remaining: result.data.current.remainingCredits,
          quota: result.data.current.quotaCredits,
          plan: result.data.current.plan,
          usedBytes: result.data.current.usedBytes,
          quotaBytes: result.data.current.quotaBytes,
        });
      })
      .catch(() => undefined);
  }, [accessToken, pathname]);

  const plan = credits?.plan ?? user?.plan ?? "free";
  const usedPercent =
    credits && credits.quotaBytes > 0 ? Math.min(100, (credits.usedBytes / credits.quotaBytes) * 100) : 0;
  const onDashboard = pathname === "/dashboard";

  function active(href: string) {
    if (href === "/dashboard") return onDashboard && hash !== "#library";
    if (href === "/dashboard#library") return onDashboard && hash === "#library";
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
    if (href === "/dashboard/admin/users") {
      return pathname.startsWith("/dashboard/admin/users") || pathname.startsWith("/dashboard/users");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = search.trim();
    router.push(q ? `/dashboard?q=${encodeURIComponent(q)}#library` : "/dashboard#library");
    window.setTimeout(() => document.getElementById("asset-search")?.focus(), 50);
  }

  const links: Array<{ href: string; label: string; icon: string; group: string }> = [
    { href: "/dashboard", label: "Overview", icon: "dashboard", group: "Console" },
    { href: "/dashboard#library", label: "Media library", icon: "photo_library", group: "Console" },
    { href: "/dashboard/folders", label: "Folders", icon: "folder", group: "Library" },
    { href: "/dashboard/collections", label: "Collections", icon: "collections_bookmark", group: "Library" },
    { href: "/dashboard/transformations", label: "Transformations", icon: "auto_fix_high", group: "Delivery" },
    { href: "/dashboard/api-keys", label: "API keys", icon: "key", group: "Account" },
    { href: "/dashboard/billing", label: "Usage & billing", icon: "monitoring", group: "Account" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings", group: "Account" },
  ];

  const groups = ["Console", "Library", "Delivery", "Account"];

  return (
    <div className={`console flex h-full min-h-0 flex-col bg-surface-dark text-on-surface ${jakarta.variable} ${inter.variable} ${mono.variable}`}>
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-surface-dark/80 px-4 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center">
            <BrandLogo tone="on-dark" height={28} priority />
          </Link>
          <span className="hidden h-4 w-px bg-surface-container-highest md:block" />
          {user ? (
            <div className="hidden min-w-0 items-center gap-2 rounded bg-surface-container-low px-2 py-1 md:flex">
              <Icon name="layers" className="text-[16px] text-on-surface-variant" />
              <span className="max-w-40 truncate text-body-sm">{user.name}</span>
              <span className="text-on-surface-variant">/</span>
              <span className="text-body-sm text-primary">{PLAN_LABELS[plan]}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={submitSearch} className="hidden items-center sm:flex">
            <label className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-on-surface-variant">
              <Icon name="search" className="text-[18px]" />
              <span className="sr-only">Search assets</span>
              <input
                id="console-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assets"
                className="w-36 bg-transparent text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant lg:w-52"
              />
              <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-badge text-[10px] text-on-surface-variant">⌘K</span>
            </label>
          </form>
          <Link href="/docs" className="hidden text-body-sm text-on-surface-variant hover:text-on-surface xl:inline">
            Docs
          </Link>
          {user ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary-container">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/10 bg-surface-container-lowest p-4">
          <nav className="flex flex-col gap-5">
            {groups.map((group) => (
              <div key={group}>
                <p className="px-3 font-label-badge text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{group}</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {links
                    .filter((link) => link.group === group)
                    .map((link) => {
                      const isActive = active(link.href);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => {
                              window.setTimeout(() => setHash(window.location.hash), 0);
                            }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm transition-colors ${
                              isActive
                                ? "bg-primary-container font-semibold text-on-primary-container"
                                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                            }`}
                          >
                            <Icon name={link.icon} className="text-[20px]" />
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
            {user && can(user.role, "user:read") ? (
              <div>
                <p className="px-3 font-label-badge text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Admin</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {can(user.role, "ops:read") ? (
                    <li>
                      <Link
                        href="/dashboard/admin"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm transition-colors ${
                          active("/dashboard/admin")
                            ? "bg-primary-container font-semibold text-on-primary-container"
                            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                        }`}
                      >
                        <Icon name="analytics" className="text-[20px]" />
                        <span>Admin overview</span>
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link
                      href="/dashboard/admin/users"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm transition-colors ${
                        active("/dashboard/admin/users")
                          ? "bg-primary-container font-semibold text-on-primary-container"
                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      }`}
                    >
                      <Icon name="group" className="text-[20px]" />
                      <span>Users</span>
                    </Link>
                  </li>
                </ul>
              </div>
            ) : null}
          </nav>

          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-xl bg-surface-container-low p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-body-sm">Storage</span>
                <span className="font-label-badge text-[11px] text-syntax-orange">{usedPercent.toFixed(0)}%</span>
              </div>
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full rounded-full bg-primary-container" style={{ width: `${usedPercent}%` }} />
              </div>
              <div className="flex items-center justify-between font-label-badge text-[11px] text-on-surface-variant">
                <span>{credits ? formatBytes(credits.usedBytes) : "—"} used</span>
                <span>{credits ? formatBytes(credits.quotaBytes) : "—"}</span>
              </div>
              {credits ? (
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  {credits.remaining} / {credits.quota} credits left
                </p>
              ) : null}
            </div>
            {user ? (
              <div className="px-1">
                <p className="truncate text-body-sm">{user.name}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {ROLE_LABELS[user.role]} · {PLAN_LABELS[plan]}
                </p>
                <button type="button" onClick={() => void logout()} className="mt-2 text-body-sm text-on-surface-variant hover:text-on-surface">
                  Log out
                </button>
              </div>
            ) : null}
            <Link href="/docs" className="flex items-center gap-1 px-1 text-body-sm text-on-surface-variant hover:text-primary">
              API docs
              <Icon name="open_in_new" className="text-[14px]" />
            </Link>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
