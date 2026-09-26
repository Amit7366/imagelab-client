"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import {
  PLAN_LABELS,
  type ApiSuccess,
  type BillingPlan,
  type BillingPlansData,
} from "@/lib/types";

type PaidCheckoutPlan = "starter" | "pro";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function priceLabel(plan: BillingPlan) {
  if (plan.priceCents === 0) return "Free";
  return `$${Math.round(plan.priceCents / 100)}/${plan.interval}`;
}

function BillingInner() {
  const searchParams = useSearchParams();
  const { accessToken, refreshUser } = useAuth();
  const [data, setData] = useState<BillingPlansData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string>("");

  async function load() {
    if (!accessToken) return;
    const result = await api<ApiSuccess<BillingPlansData>>("/billing/plans", {}, accessToken);
    setData(result.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Could not load billing"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setNotice("Payment received. Your plan updates as soon as Stripe confirms.");
      void refreshUser();
      void load().catch(() => undefined);
    }
    if (checkout === "cancel") {
      setNotice("Checkout was canceled. You are still on your current plan.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function startCheckout(plan: PaidCheckoutPlan) {
    if (!accessToken) return;
    setBusy(plan);
    setError("");
    try {
      const result = await api<ApiSuccess<{ url: string | null; plan: PaidCheckoutPlan }>>(
        "/billing/checkout",
        { method: "POST", body: JSON.stringify({ plan }) },
        accessToken,
      );
      if (result.data.url) {
        window.location.href = result.data.url;
        return;
      }
      setNotice(`You are now on the ${PLAN_LABELS[plan]} plan.`);
      await refreshUser();
      await load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy("");
    }
  }

  async function openPortal() {
    if (!accessToken) return;
    setBusy("portal");
    setError("");
    try {
      const result = await api<ApiSuccess<{ url: string }>>("/billing/portal", { method: "POST" }, accessToken);
      window.location.href = result.data.url;
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not open billing portal");
      setBusy("");
    }
  }

  const current = data?.current;
  const usedPercent = current && current.quotaBytes > 0 ? Math.min(100, (current.usedBytes / current.quotaBytes) * 100) : 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8">
      <p className="text-sm uppercase tracking-[0.2em] text-copper">Billing</p>
      <h1 className="mt-2 font-serif text-4xl">Plan and credits</h1>
      <p className="mt-3 max-w-xl text-sm text-ink/60">
        Free accounts include 25 credits (1 credit = 1 MB stored). When credits run out you can still view and share public URLs, but uploads pause until you upgrade or delete files.
      </p>

      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-pine">{notice}</p> : null}

      {current ? (
        <section className="mt-8 max-w-xl rounded-2xl border border-line bg-paper p-5">
          <p className="text-sm text-ink/60">Current plan</p>
          <p className="mt-1 font-serif text-3xl">{PLAN_LABELS[current.plan]}</p>
          <p className="mt-2 text-sm text-ink/70">
            {current.usedCredits} / {current.quotaCredits} credits · {formatBytes(current.usedBytes)} of {formatBytes(current.quotaBytes)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-apricot" style={{ width: `${usedPercent}%` }} />
          </div>
          {!current.canUpload ? (
            <p className="mt-3 text-sm text-copper">Credits finished. Public URLs still work.</p>
          ) : null}
          {current.plan !== "free" ? (
            <button
              type="button"
              disabled={Boolean(busy) || !data?.stripeEnabled}
              onClick={() => void openPortal()}
              className="mt-4 rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy === "portal" ? "Opening…" : "Manage subscription"}
            </button>
          ) : null}
        </section>
      ) : null}

      <ul className="mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
        {(data?.plans ?? []).map((plan) => {
          const currentPlan = current?.plan === plan.id;
          const paid = plan.id !== "free";
          return (
            <li key={plan.id} className={`rounded-2xl border bg-paper p-5 ${currentPlan ? "border-copper" : "border-line"}`}>
              <p className="text-sm uppercase tracking-[0.16em] text-copper">{plan.name}</p>
              <p className="mt-2 font-serif text-3xl">{priceLabel(plan)}</p>
              <p className="mt-2 text-sm text-ink/60">{plan.credits} credits · {formatBytes(plan.quotaBytes)}</p>
              {paid ? (
                <button
                  type="button"
                  disabled={currentPlan || Boolean(busy) || !data?.stripeEnabled}
                  onClick={() => void startCheckout(plan.id as PaidCheckoutPlan)}
                  className="mt-5 w-full rounded-full bg-apricot px-4 py-2 text-sm text-paper disabled:opacity-50"
                >
                  {currentPlan ? "Current plan" : busy === plan.id ? "Redirecting…" : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <p className="mt-5 text-sm text-ink/50">{currentPlan ? "You are on Free" : "Included at signup"}</p>
              )}
            </li>
          );
        })}
      </ul>

      {data && !data.stripeEnabled ? (
        <p className="mt-6 max-w-xl text-sm text-ink/50">
          Stripe checkout is not configured on this server yet. Add price IDs and a secret key, then paid upgrades will open Checkout here.
        </p>
      ) : null}

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="underline">
          Back to assets
        </Link>
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-ink/70">Loading billing…</p>}>
      <BillingInner />
    </Suspense>
  );
}
