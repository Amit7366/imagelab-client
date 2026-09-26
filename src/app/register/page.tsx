"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await register(String(form.get("name")), String(form.get("email")), String(form.get("password")));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-8">
      <h1 className="font-serif text-4xl">Create account</h1>
      <p className="mt-2 text-sm text-ink/70">New accounts join as a user. An admin can raise the role later.</p>
      <label className="mt-6 block text-sm">
        Name
        <input name="name" required minLength={2} className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2" />
      </label>
      <label className="mt-4 block text-sm">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2" />
      </label>
      <label className="mt-4 block text-sm">
        Password
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2" />
      </label>
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      <button disabled={pending} className="mt-6 w-full rounded-full bg-copper py-3 text-paper disabled:opacity-60">
        {pending ? "Creating..." : "Register"}
      </button>
      <p className="mt-4 text-sm">
        Already registered? <Link href="/login" className="underline">Log in</Link>
      </p>
    </form>
  );
}
