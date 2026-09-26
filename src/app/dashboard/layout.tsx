"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { MediaLibraryShell } from "@/components/media-library-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, router, user]);

  if (!user) return <p className="p-8 text-sm text-ink/70">Loading workspace...</p>;

  return <MediaLibraryShell>{children}</MediaLibraryShell>;
}
