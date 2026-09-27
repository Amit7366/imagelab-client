"use client";

import { Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConsoleOverview } from "@/components/console-overview";
import { MediaLibrary } from "@/components/media-library";
import { BrandLoader } from "@/components/preloader";

export default function DashboardPage() {
  const { accessToken } = useAuth();
  if (!accessToken) return <BrandLoader label="Loading assets" />;
  return (
    <div className="h-full min-h-0 overflow-y-auto md:flex md:flex-col md:overflow-hidden">
      <ConsoleOverview />
      <Suspense fallback={<BrandLoader label="Loading assets" />}>
        <div className="h-[78vh] md:h-auto md:min-h-0 md:flex-1">
          <MediaLibrary accessToken={accessToken} />
        </div>
      </Suspense>
    </div>
  );
}
