"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ApiSuccess, AssetListData, PublicAsset } from "@/lib/types";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function isPdf(asset: PublicAsset) {
  return asset.format === "pdf" || asset.mime === "application/pdf";
}

function isAllowedFile(file: File) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return true;
  return file.type.startsWith("image/") && file.type !== "image/svg+xml";
}

function previewSrc(asset: PublicAsset) {
  const stamp = new Date(asset.updatedAt || asset.createdAt).getTime();
  return `${asset.url}?v=${stamp}`;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function AssetThumb({ asset, className }: { asset: PublicAsset; className?: string }) {
  if (isPdf(asset)) {
    return (
      <div className={`flex items-center justify-center bg-ink/5 text-xs font-semibold uppercase tracking-wide text-ink/50 ${className ?? ""}`}>
        PDF
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={previewSrc(asset)} alt={asset.originalName} className={className} />
  );
}

export function MediaLibrary({ accessToken }: { accessToken: string }) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<number>(0);
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState("");
  const [items, setItems] = useState<PublicAsset[]>([]);
  const [usage, setUsage] = useState({ usedBytes: 0, quotaBytes: MAX_BYTES });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<"summary" | "metadata">("summary");
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [editing, setEditing] = useState<PublicAsset | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);

  const load = useCallback(async (search = "") => {
    const q = search.trim();
    const path = q ? `/assets?q=${encodeURIComponent(q)}` : "/assets";
    const result = await api<ApiSuccess<AssetListData>>(path, {}, accessToken);
    setItems(result.data.items);
    setUsage(result.data.usage);
    setSelected((current) => {
      const ids = new Set(result.data.items.map((item) => item.id));
      return new Set([...current].filter((id) => ids.has(id)));
    });
    setFocusId((current) => (current && result.data.items.some((item) => item.id === current) ? current : null));
  }, [accessToken]);

  useEffect(() => {
    void load("").catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load assets");
    });
  }, [load]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu(null);
        setEditing(null);
        setConfirmBulk(false);
        setFocusId(null);
        setSelected(new Set());
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selected.size && !editing) {
        const target = event.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        event.preventDefault();
        setConfirmBulk(true);
      }
    }
    function onClick() {
      setMenu(null);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [editing, selected.size]);

  const focused = useMemo(
    () => items.find((item) => item.id === focusId) ?? (selected.size === 1 ? items.find((item) => selected.has(item.id)) : undefined),
    [focusId, items, selected],
  );
  const menuAsset = items.find((item) => item.id === menu?.id) ?? null;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function onSearchChange(value: string) {
    setQuery(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      void load(value).catch((err) => setError(err instanceof Error ? err.message : "Search failed"));
    }, 250);
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = [...files];
    if (!list.length) return;
    setError("");
    setConfirmBulk(false);
    for (const [index, file] of list.entries()) {
      if (!isAllowedFile(file)) {
        setError("Use JPEG, PNG, WebP, GIF, AVIF, or PDF.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File is too large. Max 10 MB.");
        return;
      }
      const body = new FormData();
      body.append("file", file);
      setUploading(`Uploading ${index + 1} of ${list.length}`);
      try {
        const result = await api<ApiSuccess<PublicAsset>>("/assets", { method: "POST", body }, accessToken);
        setFocusId(result.data.id);
        setSelected(new Set([result.data.id]));
      } catch (err) {
        setUploading("");
        setError(err instanceof ApiError || err instanceof Error ? err.message : "Upload failed");
        return;
      }
    }
    setUploading("");
    await load();
  }

  function selectAsset(id: string, additive: boolean) {
    setFocusId(id);
    setPanelTab("summary");
    setSelected((current) => {
      if (additive) {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      return new Set([id]);
    });
  }

  function toggleCheckbox(id: string) {
    setFocusId(id);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteIds(ids: string[]) {
    if (!ids.length) return;
    setBusy(true);
    setError("");
    try {
      if (ids.length === 1) {
        await api(`/assets/${ids[0]}`, { method: "DELETE" }, accessToken);
      } else {
        await api("/assets/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }, accessToken);
      }
      setMenu(null);
      setConfirmBulk(false);
      setSelected(new Set());
      setFocusId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await api(`/assets/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ originalName: editName }),
      }, accessToken);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setBusy(false);
    }
  }

  async function replaceFile(file: File) {
    if (!replaceId) return;
    if (!isAllowedFile(file)) {
      setError("Use JPEG, PNG, WebP, GIF, AVIF, or PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large. Max 10 MB.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    setError("");
    try {
      await api(`/assets/${replaceId}/replace`, { method: "POST", body }, accessToken);
      setReplaceId(null);
      setMenu(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not replace file");
    } finally {
      setBusy(false);
    }
  }

  function openMenu(event: React.MouseEvent, asset: PublicAsset) {
    event.preventDefault();
    event.stopPropagation();
    setFocusId(asset.id);
    if (!selected.has(asset.id)) setSelected(new Set([asset.id]));
    setMenu({
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 280),
      id: asset.id,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-4 border-b border-line bg-paper px-5 py-3">
        <p className="hidden shrink-0 text-sm text-ink/50 md:block">
          Media library <span className="text-ink/30">/</span> <span className="text-ink">Assets</span>
        </p>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search assets</span>
          <input
            value={query}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, public id, or type…"
            className="w-full rounded-full border border-line bg-background px-4 py-2 text-sm outline-none focus:border-copper"
          />
        </label>
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          className="shrink-0 rounded-full bg-apricot px-4 py-2 text-sm text-paper"
        >
          {uploading || "Upload"}
        </button>
        <input
          ref={uploadInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </header>

      <div
        className="relative flex min-h-0 flex-1"
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void uploadFiles(event.dataTransfer.files);
        }}
      >
        <section className={`min-w-0 flex-1 overflow-y-auto p-5 ${dragOver ? "bg-copper/5" : ""} ${focused ? "pr-[23.5rem]" : ""}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-ink/60">
              {items.length} {items.length === 1 ? "asset" : "assets"} · {formatBytes(usage.usedBytes)} of{" "}
              {formatBytes(usage.quotaBytes)}
            </p>
            {selected.size > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{selected.size} selected</span>
                <button type="button" onClick={() => setSelected(new Set(items.map((item) => item.id)))} className="underline">
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(new Set());
                    setFocusId(null);
                    setConfirmBulk(false);
                  }}
                  className="underline"
                >
                  Clear
                </button>
                {confirmBulk ? (
                  <>
                    <span className="text-copper">Delete {selected.size}?</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteIds([...selected])}
                      className="rounded-full bg-copper px-3 py-1 text-paper disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button type="button" onClick={() => setConfirmBulk(false)} className="underline">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmBulk(true)} className="rounded-full bg-copper px-3 py-1 text-paper">
                    Delete
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {error ? <p className="mb-3 text-sm text-copper">{error}</p> : null}
          {notice ? <p className="mb-3 text-sm text-pine">{notice}</p> : null}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-16 text-center">
              <p className="font-serif text-3xl">No assets yet</p>
              <p className="mt-2 text-sm text-ink/60">Upload images or PDFs, or drop files anywhere in this panel.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((asset) => (
                <li key={asset.id}>
                  <article
                    onClick={(event) => selectAsset(asset.id, event.metaKey || event.ctrlKey)}
                    onDoubleClick={() => window.open(asset.url, "_blank", "noreferrer")}
                    onContextMenu={(event) => openMenu(event, asset)}
                    className={`cursor-pointer overflow-hidden rounded-xl border bg-paper ${
                      selected.has(asset.id) ? "border-copper ring-2 ring-copper/40" : "border-line"
                    }`}
                  >
                    <div className="relative">
                      <label className="absolute left-2 top-2 z-10" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(asset.id)}
                          onChange={() => toggleCheckbox(asset.id)}
                          className="size-4 accent-copper"
                        />
                      </label>
                      <span className="absolute right-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] uppercase text-paper">
                        {asset.format}
                      </span>
                      <AssetThumb asset={asset} className="h-36 w-full object-cover" />
                    </div>
                    <p className="truncate px-3 py-2 text-xs">{asset.originalName}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        {focused ? (
          <aside className="absolute inset-y-0 right-0 z-20 flex w-[22rem] flex-col border-l border-line bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="truncate text-sm font-medium">{focused.originalName}</p>
              <button
                type="button"
                onClick={() => {
                  setFocusId(null);
                  setSelected(new Set());
                }}
                className="text-ink/50 hover:text-ink"
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            <div className="flex border-b border-line text-sm">
              <button
                type="button"
                onClick={() => setPanelTab("summary")}
                className={`flex-1 py-2 ${panelTab === "summary" ? "border-b-2 border-copper font-medium" : "text-ink/50"}`}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => setPanelTab("metadata")}
                className={`flex-1 py-2 ${panelTab === "metadata" ? "border-b-2 border-copper font-medium" : "text-ink/50"}`}
              >
                Metadata
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {panelTab === "summary" ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border border-line bg-background">
                    {isPdf(focused) ? (
                      <iframe title="PDF preview" src={previewSrc(focused)} className="h-64 w-full bg-white" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewSrc(focused)} alt={focused.originalName} className="max-h-64 w-full object-contain" />
                    )}
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/50">Format</dt>
                      <dd className="uppercase">{focused.format}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/50">File size</dt>
                      <dd>{formatBytes(focused.bytes)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/50">Dimensions</dt>
                      <dd>{focused.width && focused.height ? `${focused.width} × ${focused.height}` : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/50">Created</dt>
                      <dd className="text-right">{formatDate(focused.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/50">Last replaced</dt>
                      <dd className="text-right">{formatDate(focused.updatedAt || focused.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink/50">Access</dt>
                      <dd>Public</dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">Public ID</dt>
                      <dd className="mt-1 break-all rounded-lg bg-background px-2 py-1 font-mono text-xs">{focused.publicId}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <a href={focused.url} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-3 py-1.5 text-xs text-paper">
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyText(focused.url).then(() => flash("Public URL copied"))}
                      className="rounded-full border border-ink px-3 py-1.5 text-xs"
                    >
                      Copy URL
                    </button>
                    {!isPdf(focused) ? (
                      <button
                        type="button"
                        onClick={() => void copyText(focused.transformUrl).then(() => flash("Transform URL copied"))}
                        className="rounded-full border border-ink px-3 py-1.5 text-xs"
                      >
                        Copy transform
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-ink/50">File name</dt>
                    <dd className="mt-1">{focused.originalName}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">MIME</dt>
                    <dd className="mt-1 font-mono text-xs">{focused.mime}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">Public URL</dt>
                    <dd className="mt-1 break-all font-mono text-xs">{focused.url}</dd>
                  </div>
                  {!isPdf(focused) ? (
                    <div>
                      <dt className="text-ink/50">Transform URL</dt>
                      <dd className="mt-1 break-all font-mono text-xs">{focused.transformUrl}</dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {menu && menuAsset ? (
        <ul
          className="fixed z-50 min-w-48 overflow-hidden rounded-xl border border-line bg-paper py-1 text-sm shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <li>
            <button type="button" className="block w-full px-4 py-2 text-left hover:bg-background" onClick={() => { window.open(menuAsset.url, "_blank", "noreferrer"); setMenu(null); }}>
              Open
            </button>
          </li>
          <li>
            <button type="button" className="block w-full px-4 py-2 text-left hover:bg-background" onClick={() => { void copyText(menuAsset.url).then(() => flash("Public URL copied")); setMenu(null); }}>
              Copy URL
            </button>
          </li>
          <li>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-background"
              onClick={() => {
                setEditing(menuAsset);
                setEditName(menuAsset.originalName);
                setMenu(null);
              }}
            >
              Rename
            </button>
          </li>
          <li>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-background"
              onClick={() => {
                setReplaceId(menuAsset.id);
                setMenu(null);
                window.setTimeout(() => replaceInputRef.current?.click(), 0);
              }}
            >
              Replace file
            </button>
          </li>
          <li>
            <button type="button" className="block w-full px-4 py-2 text-left text-copper hover:bg-background" onClick={() => { setMenu(null); setConfirmBulk(true); }}>
              Delete
            </button>
          </li>
        </ul>
      ) : null}

      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void replaceFile(file);
          event.target.value = "";
        }}
      />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={(event) => void saveRename(event)}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-line bg-paper p-6"
          >
            <h3 className="font-serif text-3xl">Rename</h3>
            <label className="mt-4 block text-sm">
              File name
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
                required
                maxLength={180}
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-ink px-4 py-2 text-sm">
                Cancel
              </button>
              <button disabled={busy} className="rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
