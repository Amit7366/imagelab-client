import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";

export const metadata: Metadata = {
  title: "API reference",
  description: "Upload, list, update, and delete images and PDFs with an Imagelab API key. Public delivery URLs stay open.",
};

const LIVE_API = "https://api.imagelab.site";
const LOCAL_API = "http://localhost:5050";
const OPENAPI = `${LIVE_API}/api/v1/openapi.json`;

const toc = [
  { href: "#quickstart", label: "Quickstart" },
  { href: "#auth", label: "Authentication" },
  { href: "#assets", label: "Media API" },
  { href: "#delivery", label: "Delivery URLs" },
  { href: "#credits", label: "Credits" },
  { href: "#errors", label: "Errors" },
  { href: "#limits", label: "Rate limits" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-sm uppercase tracking-[0.2em] text-copper">Developers</p>
        <h1 className="mt-2 font-serif text-3xl">API reference</h1>
        <nav className="mt-6 space-y-2 text-sm">
          {toc.map((item) => (
            <a key={item.href} href={item.href} className="block text-ink/70 hover:text-copper">
              {item.label}
            </a>
          ))}
        </nav>
        <p className="mt-6 text-xs leading-5 text-ink/50">
          Machine-readable spec:{" "}
          <a href={OPENAPI} className="underline">
            openapi.json
          </a>
        </p>
      </aside>

      <article className="max-w-3xl space-y-14 text-sm leading-7 text-ink/80">
        <section id="quickstart" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Quickstart</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>
              Sign in and create a secret at{" "}
              <Link href="/dashboard/api-keys" className="underline">
                Dashboard → API keys
              </Link>
              .
            </li>
            <li>
              Store the secret on your server, or reveal it later from View details if you lose it.
            </li>
            <li>Upload from your backend with the Bearer header. Use the returned <code>url</code> in your app.</li>
          </ol>
          <p className="mt-4">Production base: <code>{LIVE_API}</code>. Local: <code>{LOCAL_API}</code> (this machine uses port 5050).</p>
          <div className="mt-4">
            <CodeBlock
              code={`curl -X POST "${LIVE_API}/api/v1/assets" \\
  -H "Authorization: Bearer il_sk_live_..." \\
  -F "file=@photo.jpg"`}
            />
          </div>
          <p className="mt-4">Node:</p>
          <div className="mt-2">
            <CodeBlock
              code={`const body = new FormData();
body.append("file", fileBlob, "photo.jpg");

const res = await fetch("${LIVE_API}/api/v1/assets", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.IMAGELAB_API_KEY}\` },
  body,
});
const json = await res.json();
// json.data.url  json.data.publicId`}
            />
          </div>
        </section>

        <section id="auth" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Authentication</h2>
          <p className="mt-3">
            Send <code>Authorization: Bearer &lt;secret&gt;</code>. Local keys start with <code>il_sk_test_</code>. Live keys start
            with <code>il_sk_live_</code>.
          </p>
          <p className="mt-3">
            Secrets are stored encrypted so you can reveal them later from Dashboard → API keys → View details. You can create up to
            8 active keys, each with scopes: upload, read, update, delete. Revoking a key is permanent. API keys cannot call billing,
            users, roles, auth, or key-management routes — those need a dashboard session.
          </p>
          <p className="mt-3 font-medium text-ink">Never put a secret key in a website, mobile app, or public repository.</p>
        </section>

        <section id="assets" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Media API</h2>
          <p className="mt-3">
            All routes below are under <code>/api/v1/assets</code>. Responses use{" "}
            <code>{`{ success, message, data }`}</code>. <code>:id</code> may be the Mongo id or the <code>publicId</code> from the
            delivery URL.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand text-ink">
                <tr>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Scope</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["POST", "/", "asset:upload", "multipart field file. 201 PublicAsset."],
                  ["GET", "/", "asset:read", "Optional ?q=. Returns items and usage."],
                  ["GET", "/:id", "asset:read", "One PublicAsset."],
                  ["PATCH", "/:id", "asset:update", '{ "originalName": "hero.jpg" }'],
                  ["POST", "/:id/replace", "asset:update", "multipart file. Same publicId."],
                  ["DELETE", "/:id", "asset:delete", "Soft-delete. Frees credits."],
                  ["POST", "/bulk-delete", "asset:delete", '{ "ids": ["publicId", "..."] } max 50'],
                ].map(([method, path, scope, notes]) => (
                  <tr key={path + method} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-xs">{method}</td>
                    <td className="px-4 py-3 font-mono text-xs">{path}</td>
                    <td className="px-4 py-3 font-mono text-xs">{scope}</td>
                    <td className="px-4 py-3 text-ink/70">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6">Upload response (trimmed):</p>
          <div className="mt-2">
            <CodeBlock
              code={`{
  "success": true,
  "message": "Image uploaded",
  "data": {
    "id": "68d0…",
    "publicId": "nK8s2Q…",
    "bytes": 184320,
    "format": "jpeg",
    "url": "${LIVE_API}/image/upload/nK8s2Q…",
    "transformUrl": "${LIVE_API}/image/upload/w_800,f_auto,q_auto/nK8s2Q…"
  }
}`}
            />
          </div>
          <p className="mt-4">Fetch one asset:</p>
          <div className="mt-2">
            <CodeBlock
              code={`curl "${LIVE_API}/api/v1/assets/nK8s2Q…" \\
  -H "Authorization: Bearer il_sk_live_..."`}
            />
          </div>
          <p className="mt-4">Delete:</p>
          <div className="mt-2">
            <CodeBlock
              code={`curl -X DELETE "${LIVE_API}/api/v1/assets/nK8s2Q…" \\
  -H "Authorization: Bearer il_sk_live_..."`}
            />
          </div>
        </section>

        <section id="delivery" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Delivery URLs</h2>
          <p className="mt-3">
            Delivery is public. No API key. Original: <code>/image/upload/{"{publicId}"}</code>. Transformed image:{" "}
            <code>/image/upload/{"{tokens}"}/{"{publicId}"}</code>. PDFs are original-only.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand text-ink">
                <tr>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["w_", "Width in pixels, 1–4000"],
                  ["h_", "Height in pixels, 1–4000"],
                  ["c_", "Crop: fill, fit, limit, scale, thumb"],
                  ["q_", "Quality 1–100 or auto"],
                  ["f_", "jpeg, png, webp, avif, or auto"],
                ].map(([token, meaning]) => (
                  <tr key={token} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-xs">{token}</td>
                    <td className="px-4 py-3">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <CodeBlock
              code={`GET ${LIVE_API}/image/upload/{publicId}
GET ${LIVE_API}/image/upload/w_800,f_auto,q_auto/{publicId}`}
            />
          </div>
        </section>

        <section id="credits" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Credits</h2>
          <p className="mt-3">
            API uploads use the same plan quota as the dashboard. 1 credit = 1 MiB stored. Free is 250 credits. Starter is 1,024.
            Pro is 10,240. Used credits are the sum of ready file sizes, not a spent counter. Deleting a file frees credits. Views
            and transforms never consume credits. When the file would not fit, upload and replace return <code>402</code> with
            “Credits finished. Upgrade your plan to upload more.”
          </p>
        </section>

        <section id="errors" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Errors</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand text-ink">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["400", "Validation, missing file, or invalid scopes"],
                  ["401", "Missing, revoked, or unknown API key"],
                  ["402", "Not enough credits for this upload"],
                  ["403", "Key lacks the required scope, or a key was used on a dashboard-only route"],
                  ["404", "Asset not found"],
                  ["413", "File larger than the server max (default 10 MB)"],
                  ["429", "Too many requests"],
                ].map(([status, when]) => (
                  <tr key={status} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-xs">{status}</td>
                    <td className="px-4 py-3">{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <CodeBlock code={`{ "success": false, "message": "Credits finished. Upgrade your plan to upload more." }`} />
          </div>
        </section>

        <section id="limits" className="scroll-mt-8">
          <h2 className="font-serif text-3xl text-ink">Rate limits</h2>
          <p className="mt-3">
            API keys are limited to 120 requests per minute per key on media routes. Uploads and replacements are also limited to 200
            per 15 minutes per account. Standard rate-limit headers are included.
          </p>
          <p className="mt-6">
            <Link href="/dashboard/api-keys" className="rounded-full bg-apricot px-4 py-2 text-paper">
              Create an API key
            </Link>
          </p>
        </section>
      </article>
    </div>
  );
}
