"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAuth = pathname === "/login" || pathname === "/register";
  const isLibrary = pathname.startsWith("/dashboard");
  const isDocs = pathname.startsWith("/docs");

  if (isLibrary) {
    return <div className="h-screen overflow-hidden bg-surface-container-high text-on-surface">{children}</div>;
  }

  if (isDocs) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-sand">{children}</main>
      </>
    );
  }

  if (isHome || isAuth) {
    return <div className="min-h-screen bg-surface text-on-surface">{children}</div>;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </>
  );
}
