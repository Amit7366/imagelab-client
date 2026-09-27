"use client";

import { useEffect } from "react";

export function Preloader() {
  useEffect(() => {
    const node = document.getElementById("il-preloader");
    if (!node) return;
    const started = performance.now();
    let finished = false;

    const hide = () => {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, 720 - (performance.now() - started));
      window.setTimeout(() => node.classList.add("is-done"), wait);
    };

    window.addEventListener("imagelab-ready", hide, { once: true });
    const cap = window.setTimeout(hide, 2800);
    return () => {
      window.removeEventListener("imagelab-ready", hide);
      window.clearTimeout(cap);
    };
  }, []);

  return (
    <div id="il-preloader" role="status" aria-live="polite" aria-label="Loading Imagelab">
      <div className="il-preloader-mark">
        <svg className="il-preloader-box" viewBox="0 0 80 80" aria-hidden="true">
          <rect x="3" y="3" width="74" height="74" rx="18" pathLength="100" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width="78" height="78" />
      </div>
    </div>
  );
}

export function BrandLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-3 p-8" role="status" aria-live="polite">
      <span className="il-inline-loader" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width="48" height="48" />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
