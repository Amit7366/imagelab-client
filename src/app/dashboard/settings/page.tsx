"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import { PLAN_LABELS, ROLE_LABELS } from "@/lib/types";

export default function SettingsPage() {
  const { user, accessToken, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !accessToken) return;
    const next = name.trim();
    if (next.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ name: next }) }, accessToken);
      await refreshUser();
      setNotice("Name saved.");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not update name");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <p className="p-8 text-sm text-on-surface-variant">Loading account…</p>;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8">
      <p className="font-label-badge text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">Account</p>
      <h1 className="mt-2 font-headline-lg text-4xl font-bold text-on-surface">Settings</h1>
      <p className="mt-3 max-w-xl text-body-sm text-on-surface-variant">
        This workspace is your account. Plan changes happen in billing, and API access is managed with keys.
      </p>

      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-syntax-green">{notice}</p> : null}

      <form onSubmit={(event) => void saveName(event)} className="mt-8 max-w-xl rounded-xl bg-surface-container-low p-5">
        <label className="block text-body-sm text-on-surface">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            required
            className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 text-on-surface outline-none"
          />
        </label>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-on-surface-variant">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-on-surface-variant">Role</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-on-surface-variant">Plan</dt>
            <dd>{PLAN_LABELS[user.plan]}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={busy} className="rounded-lg bg-primary-container px-4 py-2 text-sm text-on-primary-container disabled:opacity-50">
            {busy ? "Saving…" : "Save name"}
          </button>
          <Link href="/dashboard/billing" className="rounded-lg bg-surface-container px-4 py-2 text-sm text-on-surface">
            Usage & billing
          </Link>
          <Link href="/dashboard/api-keys" className="rounded-lg bg-surface-container px-4 py-2 text-sm text-on-surface">
            API keys
          </Link>
        </div>
      </form>

      <button type="button" onClick={() => void logout()} className="mt-6 text-sm text-on-surface-variant hover:text-on-surface">
        Log out
      </button>
    </div>
  );
}
