import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Imagelab developer console to manage media, API keys, and billing.",
};

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
