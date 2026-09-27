"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { PLAN_LABELS, can, type AdminOverview, type ApiSuccess, type PlanId } from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

function formatCount(value: number) {
  return value.toLocaleString();
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDay(day: string) {
  const [, month, date] = day.split("-");
  return `${Number(month)}/${Number(date)}`;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const { user, accessToken, ready } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!can(user.role, "ops:read")) {
      router.replace("/dashboard/admin/users");
    }
  }, [ready, router, user]);

  useEffect(() => {
    if (!accessToken || !user || !can(user.role, "ops:read")) return;
    api<ApiSuccess<AdminOverview>>("/admin/overview", {}, accessToken)
      .then((result) => setData(result.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load overview"));
  }, [accessToken, user]);

  if (!user || !can(user.role, "ops:read")) {
    return <p className="p-8 text-sm text-ink/70">Loading overview…</p>;
  }

  const maxSignups = Math.max(1, ...(data?.signups.series.map((item) => item.count) ?? [1]));
  const maxBandwidth = Math.max(1, ...(data?.bandwidth.series.map((item) => item.outboundBytes) ?? [1]));
  const planEntries = (["free", "starter", "pro"] as PlanId[]).map((id) => [id, data?.plans[id] ?? 0] as const);
  const planTotal = Math.max(1, planEntries.reduce((sum, [, count]) => sum + count, 0));
  const usedPercent = data?.storage.usedPercent ?? 0;
  const barWidth = usedPercent === 0 ? 0 : Math.min(100, Math.max(usedPercent, 1.2));
  const barTone = usedPercent >= 90 ? "bg-copper" : usedPercent >= 70 ? "bg-gold" : "bg-apricot";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8">
      <h1 className="font-serif text-4xl">Overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/60">
        Platform storage, delivery bandwidth, registrations, and estimated monthly revenue.
      </p>
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}

      {data ? (
        <>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Accounts", String(data.users.total), `${data.users.active} active · ${data.users.paused} paused`],
              ["Signups", String(data.signups.last7), `${data.signups.last30} in 30 days`],
              ["Outbound, 30 days", formatBytes(data.bandwidth.last30.outboundBytes), `${formatCount(data.bandwidth.last30.requests)} requests`],
              ["Estimated MRR", money(data.revenue.estimatedMrrCents), `${data.revenue.paidActive} paid · ${data.atQuota} at quota`],
            ].map(([label, value, hint]) => (
              <li key={label} className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-sm text-ink/50">{label}</p>
                <p className="mt-2 font-serif text-3xl">{value}</p>
                <p className="mt-2 text-xs text-ink/50">{hint}</p>
              </li>
            ))}
          </ul>

          <section className="mt-8 rounded-3xl border border-line bg-paper p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-copper">Platform storage</p>
                <h2 className="mt-2 font-serif text-3xl">{formatBytes(data.storage.capacityBytes)} pool</h2>
                <p className="mt-1 text-sm text-ink/60">
                  {formatBytes(data.storage.usedBytes)} used · {formatBytes(data.storage.freeBytes)} free
                </p>
              </div>
              <p className="font-serif text-4xl tabular-nums">{usedPercent < 0.1 && data.storage.usedBytes > 0 ? "<0.1" : usedPercent.toFixed(1)}%</p>
            </div>

            <div className="mt-5">
              <div className="flex h-4 overflow-hidden rounded-full bg-sand ring-1 ring-line">
                <div className={`h-full ${barTone}`} style={{ width: `${barWidth}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-5 text-sm">
                <p className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${barTone}`} />
                  Used {formatBytes(data.storage.usedBytes)}
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sand ring-1 ring-line" />
                  Available {formatBytes(data.storage.freeBytes)}
                </p>
              </div>
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Originals", formatBytes(data.storage.originalBytes), "Files on disk"],
                ["Transforms", formatBytes(data.storage.variantBytes), "Cached variants"],
                ["Library", `${formatCount(data.storage.assets)} files`, formatBytes(data.storage.libraryBytes)],
              ].map(([label, value, hint]) => (
                <li key={label} className="rounded-2xl bg-sand px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink/45">{label}</p>
                  <p className="mt-2 font-serif text-2xl">{value}</p>
                  <p className="mt-1 text-xs text-ink/50">{hint}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-3xl border border-line bg-paper p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-copper">Bandwidth</p>
                <h2 className="mt-2 font-serif text-3xl">Traffic, 30 days</h2>
                <p className="mt-1 text-sm text-ink/60">{data.bandwidth.note}</p>
              </div>
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Outbound", formatBytes(data.bandwidth.last30.outboundBytes), `${formatBytes(data.bandwidth.last7.outboundBytes)} last 7 days`],
                ["Inbound", formatBytes(data.bandwidth.last30.inboundBytes), `${formatCount(data.bandwidth.last30.uploads)} uploads`],
                ["Requests", formatCount(data.bandwidth.last30.requests), `${formatCount(data.bandwidth.last30.originals)} original · ${formatCount(data.bandwidth.last30.transforms)} transform`],
              ].map(([label, value, hint]) => (
                <li key={label} className="rounded-2xl bg-sand px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink/45">{label}</p>
                  <p className="mt-2 font-serif text-2xl">{value}</p>
                  <p className="mt-1 text-xs text-ink/50">{hint}</p>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-serif text-xl">Outbound, 14 days</h3>
            <div className="mt-4 flex h-36 items-end gap-1">
              {data.bandwidth.series.map((item) => (
                <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-plum"
                    style={{ height: `${Math.max(6, (item.outboundBytes / maxBandwidth) * 100)}%` }}
                    title={`${item.day}: ${formatBytes(item.outboundBytes)} · ${item.requests} requests`}
                  />
                  <p className="mt-2 text-[10px] text-ink/40">{formatDay(item.day)}</p>
                </div>
              ))}
            </div>
            {data.bandwidth.last30.requests === 0 ? (
              <p className="mt-4 text-sm text-ink/50">No delivery traffic recorded yet. Counts start as public URLs are requested.</p>
            ) : null}
          </section>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-paper p-5">
              <h2 className="font-serif text-2xl">Plan mix</h2>
              <ul className="mt-5 space-y-3">
                {planEntries.map(([id, count]) => (
                  <li key={id}>
                    <div className="flex justify-between text-sm">
                      <span>{PLAN_LABELS[id]}</span>
                      <span className="text-ink/50">{count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand">
                      <div className="h-full rounded-full bg-apricot" style={{ width: `${(count / planTotal) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-ink/50">{data.revenue.note}</p>
            </section>

            <section className="rounded-2xl border border-line bg-paper p-5">
              <h2 className="font-serif text-2xl">Signups, 14 days</h2>
              <div className="mt-5 flex h-36 items-end gap-1">
                {data.signups.series.map((item) => (
                  <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t bg-plum"
                      style={{ height: `${Math.max(6, (item.count / maxSignups) * 100)}%` }}
                      title={`${item.day}: ${item.count}`}
                    />
                    <p className="mt-2 text-[10px] text-ink/40">{formatDay(item.day)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-serif text-2xl">Recent registrations</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((account) => (
                  <tr key={account.id} className="border-t border-line">
                    <td className="px-5 py-3">{account.name}</td>
                    <td className="px-5 py-3 text-ink/70">{account.email}</td>
                    <td className="px-5 py-3">{PLAN_LABELS[account.plan]}</td>
                    <td className="px-5 py-3 text-ink/50">{new Date(account.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recent.length === 0 ? <p className="px-5 py-6 text-sm text-ink/50">No accounts yet.</p> : null}
          </section>
        </>
      ) : !error ? (
        <p className="mt-8 text-sm text-ink/50">Loading metrics…</p>
      ) : null}
    </div>
  );
}
