"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isLibrary = pathname.startsWith("/dashboard");
  const isDocs = pathname.startsWith("/docs");

  if (isLibrary) {
    return <div className="h-screen overflow-hidden bg-sand">{children}</div>;
  }

  if (isDocs) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-sand">{children}</main>
      </>
    );
  }

  return (
    <>
      {!isHome && <SiteHeader />}
      <main className={isHome ? "min-h-screen" : "mx-auto w-full max-w-5xl px-6 py-10"}>{children}</main>
    </>
  );
}
