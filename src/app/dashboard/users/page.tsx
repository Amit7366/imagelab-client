"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandLoader } from "@/components/preloader";

export default function UsersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin/users");
  }, [router]);
  return <BrandLoader label="Opening users" />;
}
