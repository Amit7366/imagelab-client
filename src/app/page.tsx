import type { Metadata } from "next";
import { HomeMarketing } from "@/components/home-marketing";

export const metadata: Metadata = {
  title: {
    absolute: "Imagelab — Image API and Media Delivery",
  },
  description:
    "Upload images and PDFs, deliver them on public URLs, and resize, crop, or convert format from the URL. API keys, plans, and a developer console included.",
};

export default function HomePage() {
  return <HomeMarketing />;
}
