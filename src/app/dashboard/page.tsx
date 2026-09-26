"use client";

import { useAuth } from "@/components/auth-provider";
import { MediaLibrary } from "@/components/media-library";

export default function DashboardPage() {
  const { accessToken } = useAuth();
  if (!accessToken) return <p className="p-8 text-sm text-ink/70">Loading assets...</p>;
  return <MediaLibrary accessToken={accessToken} />;
}
