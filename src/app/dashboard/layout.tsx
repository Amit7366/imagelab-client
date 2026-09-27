import type { Metadata } from "next";
import { DashboardGate } from "@/components/dashboard-gate";

export const metadata: Metadata = {
  title: "Developer console",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardGate>{children}</DashboardGate>;
}
