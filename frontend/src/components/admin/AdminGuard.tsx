"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { AdminLoadingScreen } from "@/components/admin/AdminLoadingScreen";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    } else if (status === "forbidden") {
      router.replace("/admin/login?reason=forbidden");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <AdminLoadingScreen />;
  }

  return <>{children}</>;
}
