import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Preloader } from "@/components/preloader";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const title = "Imagelab — Image API and Media Delivery";
const description =
  "Upload images and PDFs, deliver them on public URLs, and resize, crop, or convert format from the URL. API keys, plans, and a developer console included.";

export const metadata: Metadata = {
  metadataBase: new URL("https://imagelab.site"),
  title: {
    default: title,
    template: "%s · Imagelab",
  },
  description,
  applicationName: "Imagelab",
  keywords: [
    "Imagelab",
    "image API",
    "image CDN",
    "media delivery",
    "image transformation",
    "on-the-fly image resize",
  ],
  authors: [{ name: "Imagelab", url: "https://imagelab.site" }],
  creator: "Imagelab",
  openGraph: {
    type: "website",
    siteName: "Imagelab",
    title,
    description,
    url: "https://imagelab.site",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var p=location.pathname;var dark=p==='/'||p.indexOf('/dashboard')===0||p==='/login'||p==='/register';if(dark)return;var s=document.createElement('style');s.textContent='#il-preloader{background:#ffffff}';document.head.appendChild(s);})();",
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-background text-ink">
        <Preloader />
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
