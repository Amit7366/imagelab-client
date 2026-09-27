"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import {
  ASSET_SCOPE_LABELS,
  ASSET_SCOPES,
  type ApiSuccess,
  type AssetKeyScope,
  type CreatedApiKey,
  type PublicApiKey,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050/api/v1";

function maskKey(key: PublicApiKey) {
  return `${key.prefix}…${key.lastFour}`;
}

function formatWhen(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export default function ApiKeysPage() {
  const { accessToken } = useAuth();
  const [keys, setKeys] = useState<PublicApiKey[]>([]);
  const [name, setName] = useState("Production");
  const [scopes, setScopes] = useState<AssetKeyScope[]>([...ASSET_SCOPES]);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const activeCount = keys.filter((key) => key.status === "active").length;
  const atLimit = activeCount >= 8;

  const curl = useMemo(() => {
    if (!created) return "";
    return `curl -X POST "${API_URL}/assets" \\\n  -H "Authorization: Bearer ${created.secret}" \\\n  -F "file=@photo.jpg"`;
  }, [created]);

  async function load() {
    if (!accessToken) return;
    const result = await api<ApiSuccess<PublicApiKey[]>>("/api-keys", {}, accessToken);
    setKeys(result.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Could not load API keys"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function toggleScope(scope: AssetKeyScope) {
    setScopes((current) => {
      if (current.includes(scope)) {
        return current.filter((item) => item !== scope);
      }
      return [...current, scope];
    });
  }

  async function createKey() {
    if (!accessToken || atLimit || scopes.length === 0) return;
    setBusy("create");
    setError("");
    setCopied(false);
    try {
      const result = await api<ApiSuccess<CreatedApiKey>>(
        "/api-keys",
        { method: "POST", body: JSON.stringify({ name: name.trim() || undefined, scopes }) },
        accessToken,
      );
      setCreated(result.data);
      setName("Production");
      setScopes([...ASSET_SCOPES]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not create API key");
    } finally {
      setBusy("");
    }
  }

  async function revokeKey(id: string) {
    if (!accessToken) return;
    setBusy(id);
    setError("");
    try {
      await api(`/api-keys/${id}`, { method: "DELETE" }, accessToken);
      if (created?.id === id) setCreated(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not revoke API key");
    } finally {
      setBusy("");
    }
  }

  async function copySecret() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.secret);
      setCopied(true);
    } catch {
      setError("Could not copy the secret. Select it and copy manually.");
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8">
      <p className="text-sm uppercase tracking-[0.2em] text-copper">Developers</p>
      <h1 className="mt-2 font-serif text-4xl">API keys</h1>
      <p className="mt-3 max-w-xl text-sm text-ink/60">
        Use a secret key from your backend to upload, list, update, and delete files. Public delivery URLs stay open.
        Never put a key in a browser. See the{" "}
        <Link href="/docs" className="underline">
          API docs
        </Link>
        .
      </p>

      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}

      {created ? (
        <section className="mt-8 max-w-2xl rounded-2xl border border-copper bg-paper p-5">
          <p className="text-sm font-medium text-copper">Copy this secret now. ImageLab will not show it again.</p>
          <p className="mt-3 break-all rounded-xl bg-sand px-4 py-3 font-mono text-sm">{created.secret}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void copySecret()} className="rounded-full bg-apricot px-4 py-2 text-sm text-paper">
              {copied ? "Copied" : "Copy secret"}
            </button>
            <button type="button" onClick={() => setCreated(null)} className="rounded-full border border-line px-4 py-2 text-sm">
              I saved it
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-plum p-4 text-xs leading-6 text-paper">
            <code>{curl}</code>
          </pre>
        </section>
      ) : null}

      <section className="mt-8 max-w-2xl rounded-2xl border border-line bg-paper p-5">
        <h2 className="font-serif text-2xl">Create a key</h2>
        <p className="mt-2 text-sm text-ink/60">
          {activeCount} / 8 active keys. Local keys start with <code>il_sk_test_</code>. Live keys start with{" "}
          <code>il_sk_live_</code>.
        </p>
        <label className="mt-4 block text-sm">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-sand px-3 py-2"
            maxLength={80}
          />
        </label>
        <fieldset className="mt-4">
          <legend className="text-sm">Scopes</legend>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {ASSET_SCOPES.map((scope) => (
              <li key={scope}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                  {ASSET_SCOPE_LABELS[scope]}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <button
          type="button"
          disabled={Boolean(busy) || atLimit || scopes.length === 0}
          onClick={() => void createKey()}
          className="mt-5 rounded-full bg-apricot px-4 py-2 text-sm text-paper disabled:opacity-50"
        >
          {busy === "create" ? "Creating…" : atLimit ? "Key limit reached" : "Create API key"}
        </button>
      </section>

      <ul className="mt-8 max-w-3xl space-y-3">
        {keys.map((key) => (
          <li key={key.id} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="mt-1 font-mono text-xs text-ink/60">{maskKey(key)}</p>
                <p className="mt-2 text-sm text-ink/60">
                  {key.scopes.map((scope) => ASSET_SCOPE_LABELS[scope]).join(" · ") || "No scopes"}
                </p>
                <p className="mt-1 text-xs text-ink/50">Last used {formatWhen(key.lastUsedAt)}</p>
              </div>
              {key.status === "active" ? (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void revokeKey(key.id)}
                  className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
                >
                  {busy === key.id ? "Revoking…" : "Revoke"}
                </button>
              ) : (
                <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/50">Revoked</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {keys.length === 0 ? <p className="mt-8 text-sm text-ink/50">No keys yet. Create one to call the media API.</p> : null}
    </div>
  );
}
