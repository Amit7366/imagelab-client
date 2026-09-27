"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { ApiSuccess, AssetListData, PublicAsset } from "@/lib/types";

const CROPS = ["fill", "fit", "limit", "scale", "thumb"] as const;
const FORMATS = ["auto", "avif", "webp", "jpeg", "png"] as const;

function deliveryBase(asset: PublicAsset) {
  const marker = `/${asset.publicId}`;
  const index = asset.url.lastIndexOf(marker);
  return index >= 0 ? asset.url.slice(0, index) : asset.url;
}

function buildUrl(asset: PublicAsset, tokens: string[]) {
  const chain = tokens.filter(Boolean).join(",");
  if (!chain) return asset.url;
  return `${deliveryBase(asset)}/${chain}/${asset.publicId}`;
}

export default function TransformationsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<PublicAsset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("");
  const [crop, setCrop] = useState("");
  const [quality, setQuality] = useState("auto");
  const [format, setFormat] = useState("auto");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    api<ApiSuccess<AssetListData>>("/assets", {}, accessToken)
      .then((result) => {
        const images = result.data.items.filter((item) => item.format !== "pdf" && item.mime !== "application/pdf");
        setItems(images);
        setAssetId((current) => current || images[0]?.id || "");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load assets"));
  }, [accessToken]);

  const asset = items.find((item) => item.id === assetId) ?? null;

  const tokens = useMemo(() => {
    const parts: string[] = [];
    if (crop) parts.push(`c_${crop}`);
    if (format) parts.push(`f_${format}`);
    if (/^\d+$/.test(height) && Number(height) >= 1 && Number(height) <= 4000) parts.push(`h_${height}`);
    if (quality === "auto" || (/^\d+$/.test(quality) && Number(quality) >= 1 && Number(quality) <= 100)) {
      parts.push(`q_${quality}`);
    }
    if (/^\d+$/.test(width) && Number(width) >= 1 && Number(width) <= 4000) parts.push(`w_${width}`);
    return parts;
  }, [crop, format, height, quality, width]);

  const url = asset ? buildUrl(asset, tokens) : "";
  const srcset = asset
    ? [320, 640, 1280]
        .map((size) => {
          const next = tokens.filter((token) => !token.startsWith("w_"));
          next.push(`w_${size}`);
          return `${buildUrl(asset, next)} ${size}w`;
        })
        .join(", ")
    : "";

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
      window.setTimeout(() => setNotice(""), 1800);
    } catch {
      setError("Could not copy. Select the URL and copy it manually.");
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-8">
      <p className="font-label-badge text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">Delivery</p>
      <h1 className="mt-2 font-headline-lg text-4xl font-bold text-on-surface">Transformations</h1>
      <p className="mt-3 max-w-2xl text-body-sm text-on-surface-variant">
        Image URLs accept <span className="font-code-base text-primary">w</span>, <span className="font-code-base text-primary">h</span>,{" "}
        <span className="font-code-base text-primary">c</span>, <span className="font-code-base text-primary">q</span>, and{" "}
        <span className="font-code-base text-primary">f</span>. Width and height must be between 1 and 4000. PDFs are delivered as the original file.
      </p>

      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-syntax-green">{notice}</p> : null}

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-on-surface-variant">
          Upload an image in the <Link href="/dashboard#library" className="text-primary">media library</Link> to build a transform URL.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <form className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-5 lg:col-span-5" onSubmit={(event) => event.preventDefault()}>
            <label className="text-body-sm">
              Asset
              <select
                value={assetId}
                onChange={(event) => setAssetId(event.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 text-on-surface outline-none"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.originalName}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-body-sm">
                Width
                <input
                  value={width}
                  onChange={(event) => setWidth(event.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="800"
                  className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 font-code-base text-on-surface outline-none"
                />
              </label>
              <label className="text-body-sm">
                Height
                <input
                  value={height}
                  onChange={(event) => setHeight(event.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="optional"
                  className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 font-code-base text-on-surface outline-none"
                />
              </label>
            </div>
            <label className="text-body-sm">
              Crop
              <select
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 text-on-surface outline-none"
              >
                <option value="">None</option>
                {CROPS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-body-sm">
                Quality
                <input
                  value={quality}
                  onChange={(event) => {
                  const value = event.target.value.toLowerCase();
                  if ("auto".startsWith(value)) setQuality(value);
                  else setQuality(value.replace(/[^\d]/g, "").slice(0, 3));
                }}
                  placeholder="auto"
                  className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 font-code-base text-on-surface outline-none"
                />
              </label>
              <label className="text-body-sm">
                Format
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className="mt-1 w-full rounded-lg bg-surface-container px-3 py-2 text-on-surface outline-none"
                >
                  {FORMATS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormat("auto");
                  setQuality("auto");
                }}
                className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface"
              >
                Auto-optimize
              </button>
              <button
                type="button"
                onClick={() => {
                  setWidth("1280");
                  setCrop("fit");
                  setFormat("auto");
                  setQuality("auto");
                }}
                className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface"
              >
                Responsive fit
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-4 lg:col-span-7">
            {asset ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url || asset.url} alt={asset.originalName} className="max-h-72 w-full rounded-xl bg-surface-container-low object-contain" />
            ) : null}
            <div className="rounded-xl bg-surface-container-low p-5">
              <p className="text-body-sm text-on-surface-variant">Transform URL</p>
              <p className="mt-2 break-all font-code-base text-sm text-primary">{url}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copy(url, "Transform URL copied")}
                  className="rounded-lg bg-primary-container px-4 py-2 text-sm text-on-primary-container"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => void copy(srcset, "Srcset copied")}
                  className="rounded-lg bg-surface-container px-4 py-2 text-sm text-on-surface"
                >
                  Copy srcset
                </button>
              </div>
              <p className="mt-4 break-all font-code-base text-[12px] text-on-surface-variant">{srcset}</p>
              <p className="mt-3 text-[12px] text-on-surface-variant">
                Srcset uses the same crop, format, quality, and height at 320, 640, and 1280 pixels wide. Re-encoded images drop the original camera orientation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
