"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { PLAN_LABELS, type ApiSuccess, type BillingPlansData, type PublicApiKey, type StorageUsage } from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export function ConsoleOverview() {
  const { user, accessToken } = useAuth();
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [keys, setKeys] = useState<PublicApiKey[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<ApiSuccess<BillingPlansData>>("/billing/plans", {}, accessToken)
      .then((result) => setUsage(result.data.current))
      .catch(() => undefined);
    api<ApiSuccess<PublicApiKey[]>>("/api-keys", {}, accessToken)
      .then((result) => setKeys(result.data))
      .catch(() => undefined);
  }, [accessToken]);

  const storagePercent =
    usage && usage.quotaBytes > 0 ? Math.min(100, (usage.usedBytes / usage.quotaBytes) * 100) : 0;
  const creditPercent =
    usage && usage.quotaCredits > 0 ? Math.min(100, (usage.usedCredits / usage.quotaCredits) * 100) : 0;
  const activeKeys = keys.filter((key) => key.status === "active").length;

  return (
    <section className="shrink-0 border-b border-border-light bg-surface-container-lowest px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="font-label-badge text-[11px] text-on-surface-variant">
            <span className="text-syntax-green">{user?.name ?? "Workspace"}</span>
            <span> / </span>
            <span>{usage ? PLAN_LABELS[usage.plan] : "Plan"}</span>
          </p>
          <h1 className="font-headline-lg text-2xl font-bold tracking-tight text-on-surface sm:text-3xl md:text-4xl">Developer Console</h1>
          <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
            Upload media, deliver public URLs, and manage the keys that call the API.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          <Link
            href="/dashboard/api-keys"
            className="flex items-center gap-1 rounded-lg bg-surface-container px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high"
          >
            <Icon name="key" className="text-[18px] text-primary" />
            Create API key
          </Link>
          <button
            type="button"
            onClick={() => {
              document.getElementById("library")?.scrollIntoView({ block: "start" });
              window.dispatchEvent(new Event("imagelab-upload"));
            }}
            className="flex items-center gap-1 rounded-lg bg-primary-container px-4 py-2.5 text-sm text-on-primary-container shadow-[0_4px_20px_rgba(0,102,255,0.35)]"
          >
            <Icon name="cloud_upload" className="text-[18px]" />
            Upload assets
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Icon name="database" className="text-[18px] text-secondary" />
              Storage used
            </span>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-badge text-[11px] text-syntax-orange">
              {storagePercent.toFixed(0)}%
            </span>
          </div>
          <p className="mt-3 font-headline-md text-2xl text-on-surface">
            {usage ? formatBytes(usage.usedBytes) : "—"}
            <span className="ml-2 text-body-sm text-on-surface-variant">/ {usage ? formatBytes(usage.quotaBytes) : "—"}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary-container" style={{ width: `${storagePercent}%` }} />
          </div>
        </article>

        <article className="rounded-xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Icon name="auto_fix_high" className="text-[18px] text-tertiary" />
              Credits used
            </span>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-badge text-[11px] text-syntax-green">
              {creditPercent.toFixed(0)}%
            </span>
          </div>
          <p className="mt-3 font-headline-md text-2xl text-on-surface">
            {usage ? usage.usedCredits.toLocaleString() : "—"}
            <span className="ml-2 text-body-sm text-on-surface-variant">/ {usage ? usage.quotaCredits.toLocaleString() : "—"}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-tertiary" style={{ width: `${creditPercent}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-on-surface-variant">1 credit equals 1 MB stored. Public URLs keep working when credits run out.</p>
        </article>

        <article className="rounded-xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Icon name="key" className="text-[18px] text-primary" />
              Active API keys
            </span>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-badge text-[11px] text-primary">
              {activeKeys} active
            </span>
          </div>
          <p className="mt-3 font-headline-md text-2xl text-on-surface">
            {activeKeys}
            <span className="ml-2 text-body-sm text-on-surface-variant">/ 8</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (activeKeys / 8) * 100)}%` }} />
          </div>
          <Link href="/dashboard/api-keys" className="mt-2 inline-block text-[12px] text-primary hover:text-on-surface">
            Reveal, copy, or revoke keys
          </Link>
        </article>

        <article className="rounded-xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Icon name="cloud_done" className="text-[18px] text-syntax-orange" />
              Uploads
            </span>
            <span
              className={`rounded-full bg-surface-container px-2 py-0.5 font-label-badge text-[11px] ${
                usage?.canUpload ? "text-syntax-green" : "text-error"
              }`}
            >
              {usage ? (usage.canUpload ? "Open" : "Paused") : "—"}
            </span>
          </div>
          <p className="mt-3 font-headline-md text-2xl text-on-surface">{usage ? PLAN_LABELS[usage.plan] : "—"}</p>
          <p className="mt-2 text-[12px] text-on-surface-variant">
            JPEG, PNG, WebP, GIF, AVIF, and PDF. Max 10 MB each.
          </p>
          {!usage?.canUpload ? (
            <Link href="/dashboard/billing" className="mt-2 inline-block text-[12px] text-primary hover:text-on-surface">
              Update plan
            </Link>
          ) : null}
        </article>
      </div>
    </section>
  );
}
