"use client";

import { useState } from "react";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-2xl bg-plum p-5 text-[13px] leading-7 text-paper">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => void copy()}
        className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1 text-xs text-paper hover:bg-white/25"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
