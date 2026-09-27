"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { BrandLoader } from "@/components/preloader";
import { MediaLibraryShell } from "@/components/media-library-shell";

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, router, user]);

  if (!user) return <BrandLoader label="Loading workspace" />;

  return <MediaLibraryShell>{children}</MediaLibraryShell>;
}
