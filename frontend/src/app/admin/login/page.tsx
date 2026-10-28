import type { Metadata } from "next";

import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Masuk Admin",
};

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
