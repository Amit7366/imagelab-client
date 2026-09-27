"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UsersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin/users");
  }, [router]);
  return <p className="p-8 text-sm text-ink/70">Opening users…</p>;
}
