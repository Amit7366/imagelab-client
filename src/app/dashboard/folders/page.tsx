"use client";

import { Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { MediaLibrary } from "@/components/media-library";
import { BrandLoader } from "@/components/preloader";

function FoldersLibrary() {
  const { accessToken } = useAuth();
  if (!accessToken) return <BrandLoader label="Loading folders" />;
  return <MediaLibrary accessToken={accessToken} />;
}

export default function FoldersPage() {
  return (
    <div className="h-full min-h-0">
      <Suspense fallback={<BrandLoader label="Loading folders" />}>
        <FoldersLibrary />
      </Suspense>
    </div>
  );
}
