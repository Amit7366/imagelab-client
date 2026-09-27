"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

const nav = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Developers", href: "/docs" },
  { label: "Lifecycle", href: "#lifecycle" },
];

const personas = [
  { name: "Developers", role: "Ship URLs", image: "/marketing/p2.jpg" },
  { name: "Editors", role: "Pick the crop", image: "/marketing/p1.jpg" },
  { name: "Storefronts", role: "Product stills", image: "/marketing/p3.jpg" },
  { name: "Studios", role: "Keep masters", image: "/marketing/p5.jpg" },
  { name: "Admins", role: "Assign roles", image: "/marketing/p4.jpg" },
  { name: "Apps", role: "Embed delivery", image: "/marketing/p6.jpg" },
];

const solutions = [
  { title: "Web performance", copy: "Width and format in the path, so each screen gets a lighter file.", image: "/marketing/land.jpg", tone: "accent" },
  { title: "Omnichannel", copy: "One original. A URL for the site, the app, and the share link.", image: "/marketing/city.jpg", tone: "dark" },
  { title: "Commerce", copy: "Product frames stay sharp. Thumbnails stay small.", image: "/marketing/product.jpg", tone: "light" },
  { title: "Studios", copy: "Masters stay on this server. Variants are requested, not duplicated.", image: "/marketing/studio.jpg", tone: "light" },
  { title: "Albums", copy: "Browse, search, and copy a public link from the dashboard.", image: "/marketing/fashion.jpg", tone: "light" },
  { title: "Access", copy: "Super admin, admin, and user each see only their work.", image: "/marketing/food.jpg", tone: "light" },
];

const logos = ["Next.js", "React", "Node", "Sharp", "REST", "WebP", "AVIF", "PostgreSQL", "Albums", "Roles", "URL API", "Disk"];

const stories = [
  { stat: "w_800", label: "sized for the page", title: "A catalog image, delivered at the width the layout asks for.", image: "/marketing/product.jpg" },
  { stat: "f_auto", label: "format on request", title: "The same master, served in the format the browser can use.", image: "/marketing/fashion.jpg" },
  { stat: "3 roles", label: "scoped accounts", title: "Admins create users. Users upload. Public URLs stay separate.", image: "/marketing/city.jpg" },
];

const capabilities = [
  {
    id: "upload",
    label: "Upload",
    title: "Originals land in the album",
    points: ["Drop a file in the dashboard", "Keep the master on this server", "Get a public URL immediately"],
  },
  {
    id: "transform",
    label: "Transform",
    title: "The variant is the URL",
    points: ["Set width with w_800", "Ask for a format with f_auto", "Reuse the path anywhere"],
  },
  {
    id: "share",
    label: "Share",
    title: "Publish a link, not the album",
    points: ["Copy the public URL", "Keep the dashboard private", "Hand the link to any page"],
  },
  {
    id: "govern",
    label: "Govern",
    title: "Roles decide who can change what",
    points: ["Super admin assigns roles", "Admins manage accounts", "Users stay inside the album"],
  },
];

const stages = [
  { n: "01", title: "Ingest", copy: "Upload the master." },
  { n: "02", title: "Store", copy: "File stays on disk." },
  { n: "03", title: "Organize", copy: "Album and roles." },
  { n: "04", title: "Transform", copy: "Width and format." },
  { n: "05", title: "Deliver", copy: "Public URL." },
];

export function HomeMarketing() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [cap, setCap] = useState(capabilities[1]);
  const [stage, setStage] = useState(3);
  const signedIn = ready && Boolean(user);
  const primaryHref = signedIn ? "/dashboard" : "/register";
  const primaryLabel = signedIn ? "Open album" : "Get started";

  return (
    <div className="bg-[#f7f3ec] text-[#1c1424]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#140e1c]/95 text-[#f7f3ec] backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-8 px-5">
          <Link href="/" className="flex items-center gap-2.5 font-serif text-[26px] tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ff5c39] text-sm text-white">IL</span>
            ImageLab
          </Link>
          <nav className="hidden flex-1 items-center gap-7 text-[14px] text-white/75 lg:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-4 lg:flex">
            {signedIn ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/75 hover:text-white">Dashboard</Link>
                <button type="button" onClick={() => logout()} className="text-sm text-white/75 hover:text-white">Log out</button>
              </>
            ) : (
              <Link href="/login" className="text-sm text-white/75 hover:text-white">Log in</Link>
            )}
            <Link href={primaryHref} className="rounded-full bg-[#ff5c39] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(255,92,57,0.35)]">
              {primaryLabel}
            </Link>
          </div>
          <button type="button" className="ml-auto rounded-full border border-white/20 px-3 py-1.5 text-sm lg:hidden" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
        </div>
        {open && (
          <div className="space-y-3 border-t border-white/10 px-5 py-4 text-sm lg:hidden">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="block text-white/80" onClick={() => setOpen(false)}>{item.label}</a>
            ))}
            <Link href={signedIn ? "/dashboard" : "/login"} className="block" onClick={() => setOpen(false)}>{signedIn ? "Dashboard" : "Log in"}</Link>
            <Link href={primaryHref} className="inline-flex rounded-full bg-[#ff5c39] px-4 py-2 text-white" onClick={() => setOpen(false)}>{primaryLabel}</Link>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-[#140e1c] text-[#f7f3ec]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_15%_-10%,rgba(255,92,57,0.45),transparent_55%),radial-gradient(700px_420px_at_85%_0%,rgba(120,70,180,0.45),transparent_50%),linear-gradient(180deg,#1a1028_0%,#140e1c_55%,#100b16_100%)]" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="relative z-20">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#f0c36a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c39]" />
              Image and delivery API
            </p>
            <h1 className="mt-6 max-w-[12ch] font-serif text-[46px] leading-[0.98] sm:text-[68px]">
              Visual files start on this server.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-7 text-white/70">
              Upload a master, keep it on disk, and hand out a public URL. Resize and format live in the path.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryHref} className="rounded-full bg-[#ff5c39] px-5 py-3 text-sm font-medium text-white">{primaryLabel}</Link>
              <Link href="/docs" className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm">API docs</Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                ["3", "account roles"],
                ["1", "master per file"],
                ["URL", "for every size"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dd className="font-serif text-3xl sm:text-4xl">{value}</dd>
                  <dt className="mt-1 text-xs uppercase tracking-wide text-white/45">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative z-10 w-full lg:justify-self-end">
            <HeroCollage />
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-24 border-b border-[#1c1424]/8 bg-[#efe8df]">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <div className="flex items-end justify-between gap-6">
            <h2 className="max-w-md font-serif text-4xl leading-tight sm:text-5xl">Built for the people who handle the files.</h2>
            <p className="hidden max-w-xs text-sm leading-6 text-[#1c1424]/60 md:block">Each seat uses the same album. The role decides what they can change.</p>
          </div>
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
            {personas.map((person) => (
              <article key={person.name} className="relative h-[280px] w-[200px] shrink-0 overflow-hidden rounded-2xl">
                <img src={person.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140e1c] via-[#140e1c]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">{person.role}</p>
                  <p className="mt-1 font-serif text-2xl">{person.name}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="scroll-mt-24 bg-[#231833] text-[#f7f3ec]">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <h2 className="font-serif text-4xl sm:text-5xl">A job for every file you publish.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((item) => (
              <article key={item.title} className={`overflow-hidden rounded-2xl ${item.tone === "accent" ? "bg-[#ff5c39] text-white" : item.tone === "dark" ? "bg-[#140e1c]" : "bg-white/8 text-[#f7f3ec] ring-1 ring-white/10"}`}>
                <img src={item.image} alt="" className="h-36 w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-serif text-2xl">{item.title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${item.tone === "accent" ? "text-white/85" : "text-white/65"}`}>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="font-serif text-4xl">Connects to the stack around the album.</h2>
            <Link href="/docs" className="text-sm text-[#ff5c39]">Read the API docs →</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {logos.map((name) => (
              <div key={name} className="grid h-20 place-items-center rounded-xl border border-[#1c1424]/10 bg-[#f7f3ec] text-sm font-medium tracking-tight">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f3ec]">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-[#1c1424]/45">What the server actually does</p>
          <div className="mt-6 grid gap-8 border-y border-[#1c1424]/10 py-8 md:grid-cols-3">
            {[
              ["On disk", "Masters are stored on this server, not sent to another host."],
              ["On demand", "A new size is a new request, not a second upload."],
              ["On roles", "Accounts stay separated: super admin, admin, user."],
            ].map(([title, copy]) => (
              <div key={title}>
                <p className="font-serif text-5xl text-[#ff5c39]">{title}</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[#1c1424]/70">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {stories.map((story) => (
              <article key={story.title} className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(20,14,28,0.06)]">
                <img src={story.image} alt="" className="h-52 w-full object-cover" />
                <div className="p-5">
                  <p className="font-serif text-4xl">{story.stat}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#1c1424]/45">{story.label}</p>
                  <p className="mt-3 text-sm leading-6">{story.title}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="developers" className="scroll-mt-24 bg-[#140e1c] text-[#f7f3ec]">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-16 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#f0c36a]">How a file moves</p>
            <h2 className="mt-3 font-serif text-4xl">Four actions. One album.</h2>
            <div className="mt-6 flex flex-col gap-2">
              {capabilities.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCap(item)}
                  className={`rounded-xl px-4 py-3 text-left text-sm ${cap.id === item.id ? "bg-[#ff5c39] text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-6 rounded-3xl bg-white p-6 text-[#1c1424] lg:grid-cols-[1fr_1.1fr] lg:p-8">
            <div>
              <h3 className="font-serif text-3xl">{cap.title}</h3>
              <ul className="mt-5 space-y-3">
                {cap.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5c39]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <pre className="overflow-x-auto rounded-2xl bg-[#1c1424] p-5 text-[13px] leading-7 text-[#f7f3ec]">
                <code>{`GET /image/upload/w_800,f_auto/{id}

# master
/image/upload/{id}

# thumbnail
/image/upload/w_400,f_auto/{id}`}</code>
              </pre>
              <Link href="/docs" className="mt-4 inline-block text-sm font-medium text-[#ff5c39]">
                Full API docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="lifecycle" className="scroll-mt-24 bg-[#f7f3ec]">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <h2 className="font-serif text-4xl sm:text-5xl">Every stage of one file.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-5">
            {stages.map((item, index) => (
              <button
                key={item.n}
                type="button"
                onClick={() => setStage(index)}
                className={`rounded-2xl border p-4 text-left ${stage === index ? "border-[#ff5c39] bg-white shadow-sm" : "border-[#1c1424]/10 bg-transparent"}`}
              >
                <p className="text-xs text-[#ff5c39]">{item.n}</p>
                <p className="mt-2 font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-[#1c1424]/55">{item.copy}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 grid overflow-hidden rounded-3xl bg-white shadow-sm md:grid-cols-[1.1fr_0.9fr]">
            <img src={stage % 2 === 0 ? "/marketing/studio.jpg" : "/marketing/land.jpg"} alt="" className="h-64 w-full object-cover md:h-full" />
            <div className="p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-[#ff5c39]">{stages[stage].n}</p>
              <h3 className="mt-2 font-serif text-4xl">{stages[stage].title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#1c1424]/70">{stages[stage].copy} The dashboard shows the result. The public URL is what the rest of the site uses.</p>
              <div className="mt-6 rounded-2xl bg-[#f7f3ec] p-4 font-mono text-xs leading-6">
                /image/upload/{stage >= 3 ? "w_800,f_auto/" : ""}{"{id}"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-4 px-5 py-16 md:grid-cols-2">
          <article className="rounded-[28px] bg-[#ff5c39] p-8 text-white sm:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">Delivery</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight">The page asks for a size. The server answers.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/85">Keep the sharp master. Send a lighter file to the layout that needs it.</p>
          </article>
          <article className="overflow-hidden rounded-[28px] bg-[#140e1c] text-[#f7f3ec] sm:grid sm:grid-cols-[1fr_160px]">
            <div className="p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-[#f0c36a]">Storage</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">The file never leaves this machine.</h2>
              <p className="mt-4 text-sm leading-6 text-white/70">Albums, roles, and public links all point at the same disk.</p>
            </div>
            <img src="/marketing/studio.jpg" alt="" className="hidden h-full w-full object-cover sm:block" />
          </article>
        </div>
      </section>

      <section className="bg-[#efe8df]">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <h2 className="font-serif text-4xl">Three surfaces. Same file.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Upload", "The album accepts the master and shows it back with a public URL.", "/marketing/p5.jpg"],
              ["Transform", "Change w_ and f_ in the path. No second file to manage.", "/marketing/land.jpg"],
              ["Access", "Super admin, admin, and user stay in their own lane.", "/marketing/p4.jpg"],
            ].map(([title, copy, image]) => (
              <article key={title} className="overflow-hidden rounded-3xl bg-white">
                <img src={image} alt="" className="h-44 w-full object-cover" />
                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#ff5c39]">ImageLab</p>
                  <h3 className="mt-2 font-serif text-3xl">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#1c1424]/70">{copy}</p>
                  <Link href={primaryHref} className="mt-4 inline-block text-sm font-medium text-[#ff5c39]">{primaryLabel} →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="resources" className="scroll-mt-24 bg-[#f7f3ec]">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <h2 className="font-serif text-4xl">Start from a real next step.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Sign in", "Open the dashboard with an account that already exists.", "/login", "/marketing/city.jpg"],
              ["Create an account", "Register, then upload the first image into the album.", "/register", "/marketing/fashion.jpg"],
              ["Share a URL", "Copy the public or transform link from an asset card.", primaryHref, "/marketing/product.jpg"],
            ].map(([title, copy, href, image]) => (
              <Link key={title} href={href} className="group overflow-hidden rounded-3xl bg-white shadow-sm">
                <img src={image} alt="" className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <div className="p-5">
                  <h3 className="font-serif text-2xl">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#1c1424]/65">{copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 overflow-hidden rounded-[28px] bg-[#f0c36a] px-8 py-10 text-[#140e1c] sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="font-serif text-4xl sm:text-5xl">Put the next image on this server.</h2>
            <p className="mt-2 text-sm text-[#140e1c]/70">Create an account, or open the album you already use.</p>
          </div>
          <Link href={primaryHref} className="rounded-full bg-[#140e1c] px-5 py-3 text-sm text-[#f7f3ec]">{primaryLabel}</Link>
        </div>
      </section>

      <footer className="bg-[#140e1c] text-[#f7f3ec]/70">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-2xl text-[#f7f3ec]">ImageLab</p>
            <p className="mt-3 max-w-xs text-sm leading-6">Upload, store, and share images from this server.</p>
          </div>
          <FooterCol title="Product" links={[["Album", "/dashboard"], ["API docs", "/docs"], ["Roles", "#platform"]]} />
          <FooterCol title="Account" links={[["Log in", "/login"], ["Register", "/register"], ["Dashboard", "/dashboard"]]} />
          <FooterCol title="Delivery" links={[["Public URL", "/docs"], ["Transforms", "/docs#delivery"], ["API keys", "/dashboard/api-keys"]]} />
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-medium text-[#f7f3ec]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-white">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroCollage() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[480px] overflow-hidden">
      <img src="/marketing/land.jpg" alt="" className="absolute right-0 top-6 h-64 w-48 rounded-[28px] object-cover shadow-2xl ring-1 ring-white/20 sm:h-72 sm:w-56" />
      <img src="/marketing/p3.jpg" alt="" className="absolute left-0 top-16 h-52 w-40 rounded-[24px] object-cover shadow-2xl ring-4 ring-[#140e1c] sm:h-60 sm:w-44" />
      <img src="/marketing/product.jpg" alt="" className="absolute right-10 top-0 h-28 w-24 rounded-2xl object-cover shadow-xl ring-4 ring-[#140e1c]" />
      <div className="absolute bottom-6 left-4 right-4 rounded-3xl bg-white p-4 text-[#1c1424] shadow-2xl">
        <div className="flex items-center gap-3">
          <img src="/marketing/fashion.jpg" alt="" className="h-16 w-16 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#1c1424]/45">Album asset</p>
            <p className="truncate font-medium">catalog-hero.jpg</p>
            <p className="truncate font-mono text-[11px] text-[#1c1424]/55">/image/upload/w_800,f_auto</p>
          </div>
          <span className="rounded-full bg-[#ff5c39] px-2.5 py-1 text-[11px] font-medium text-white">Live</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["/marketing/food.jpg", "/marketing/city.jpg", "/marketing/studio.jpg"].map((src) => (
            <img key={src} src={src} alt="" className="h-16 w-full rounded-lg object-cover" />
          ))}
        </div>
      </div>
    </div>
  );
}
