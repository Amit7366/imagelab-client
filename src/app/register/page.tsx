import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an Imagelab account to upload images and PDFs and deliver them on public URLs.",
};

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}
