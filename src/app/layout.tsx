import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
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

export const metadata: Metadata = {
  title: "ImageLab",
  description: "Upload images, store them on this server, and share public URLs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-ink">
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
