"use client";

import { useMemo, useState } from "react";
import { api, ApiError, uploadWithProgress } from "@/lib/api";
import {
  allowedQueueFiles,
  folderPathsToEnsure,
  parentFolderPath,
  type QueueItem,
} from "@/lib/upload-queue";
import type { ApiSuccess, PublicAsset, PublicFolder } from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function UploadQueueModal({
  accessToken,
  currentFolderId,
  items: initialItems,
  onClose,
  onFinished,
}: {
  accessToken: string;
  currentFolderId: string | null;
  items: QueueItem[];
  onClose: () => void;
  onFinished: (openFolderId: string | null) => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [phase, setPhase] = useState<"review" | "uploading" | "done">("review");
  const [overall, setOverall] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const ready = useMemo(() => allowedQueueFiles(items), [items]);
  const skipped = items.filter((item) => item.skip);
  const folders = items.filter((item) => item.kind === "folder" && !item.skip);
  const totalBytes = ready.reduce((sum, item) => sum + item.size, 0);
  const canStart = ready.length > 0 || folders.length > 0;

  function patch(id: string, update: Partial<QueueItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }

  async function start() {
    if (!canStart) return;
    setPhase("uploading");
    setError("");
    const pathIds = new Map<string, string>();
    let rootFolderId: string | null = null;
    const paths = folderPathsToEnsure(items);

    try {
      for (const path of paths) {
        const result = await api<ApiSuccess<PublicFolder>>(
          "/folders/ensure",
          { method: "POST", body: JSON.stringify({ path, parent: currentFolderId ?? undefined }) },
          accessToken,
        );
        pathIds.set(path, result.data.id);
        const top = path.split("/")[0];
        if (top && path === top) rootFolderId = result.data.id;
      }
      if (!rootFolderId && paths[0]) rootFolderId = pathIds.get(paths[0]) ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create folders");
      setPhase("review");
      return;
    }

    let completedBytes = 0;
    for (const item of items) {
      if (item.kind !== "file" || !item.file || item.skip) continue;
      patch(item.id, { status: "uploading", progress: 0 });
      const body = new FormData();
      body.append("file", item.file, item.file.name);
      const folderPath = parentFolderPath(item.relativePath);
      const folderId = folderPath ? pathIds.get(folderPath) : currentFolderId;
      if (folderId) body.append("folder", folderId);
      try {
        const result = await uploadWithProgress<ApiSuccess<PublicAsset>>(
          "/assets",
          body,
          accessToken,
          (loaded, total) => {
            const ratio = total > 0 ? loaded / total : 0;
            patch(item.id, { progress: Math.min(100, Math.round(ratio * 100)) });
            const sent = completedBytes + Math.min(item.size, loaded);
            setOverall(totalBytes > 0 ? Math.min(100, Math.round((sent / totalBytes) * 100)) : 100);
          },
        );
        completedBytes += item.size;
        setOverall(totalBytes > 0 ? Math.min(100, Math.round((completedBytes / totalBytes) * 100)) : 100);
        patch(item.id, { status: "done", progress: 100, url: result.data.url });
      } catch (err) {
        const message =
          err instanceof ApiError && err.status === 402
            ? "Credits finished. Upgrade your plan to upload more."
            : err instanceof Error
              ? err.message
              : "Upload failed";
        patch(item.id, { status: "failed", error: message });
        setError(message);
        if (err instanceof ApiError && err.status === 402) {
          setItems((current) =>
            current.map((row) =>
              row.status === "queued" && row.kind === "file" ? { ...row, status: "failed", error: "Stopped" } : row,
            ),
          );
          setPhase("done");
          onFinished(rootFolderId);
          return;
        }
      }
    }
    setOverall(100);
    setPhase("done");
    onFinished(rootFolderId);
  }

  const title = phase === "review" ? "Review upload" : phase === "uploading" ? "Uploading" : "Upload complete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={phase === "uploading" ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-queue-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-xl"
      >
        <div className="border-b border-line px-6 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-copper">Upload</p>
          <h2 id="upload-queue-title" className="mt-2 font-serif text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            {ready.length} ready · {folders.length} folders · {skipped.length} skipped
            {totalBytes ? ` · ${formatBytes(totalBytes)}` : ""}
          </p>
        </div>

        {phase !== "review" ? (
          <div className="border-b border-line px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">Overall</span>
              <span className="font-medium tabular-nums">{overall}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sand ring-1 ring-line">
              <div className="h-full rounded-full bg-apricot transition-[width] duration-150" style={{ width: `${overall}%` }} />
            </div>
          </div>
        ) : null}

        {error ? <p className="px-6 pt-3 text-sm text-copper">{error}</p> : null}

        <ul className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {items.map((item) => (
            <li key={item.id} className="border-b border-line py-3 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-ink/50">{item.relativePath}</p>
                  {item.skip || item.error ? <p className="mt-1 text-xs text-copper">{item.skip || item.error}</p> : null}
                </div>
                <div className="shrink-0 text-right">
                  {item.kind === "file" && !item.skip ? <p className="text-xs text-ink/50">{formatBytes(item.size)}</p> : null}
                  {item.status === "done" && item.url ? (
                    <button
                      type="button"
                      className="mt-1 text-xs underline"
                      onClick={() => {
                        void copyText(item.url ?? "").then(() => {
                          setCopied(item.id);
                          window.setTimeout(() => setCopied(""), 1200);
                        });
                      }}
                    >
                      {copied === item.id ? "Copied" : "Copy URL"}
                    </button>
                  ) : (
                    <p className="mt-1 text-xs capitalize text-ink/45">{item.status}</p>
                  )}
                </div>
              </div>
              {item.kind === "file" && !item.skip && (item.status === "uploading" || item.status === "done") ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full bg-plum" style={{ width: `${item.progress}%` }} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          {phase === "review" ? (
            <>
              <button type="button" onClick={onClose} className="rounded-full border border-ink px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => void start()}
                className="rounded-full bg-apricot px-4 py-2 text-sm text-paper disabled:opacity-50"
              >
                {ready.length ? `Upload ${ready.length} file${ready.length === 1 ? "" : "s"}` : "Create folders"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={phase === "uploading"}
              onClick={onClose}
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
            >
              {phase === "uploading" ? "Uploading…" : "Done"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
