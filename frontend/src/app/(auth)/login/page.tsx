import type { Metadata } from "next";

import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke akun GaleriBudaya untuk mengunggah dokumentasi budaya dan menyimpan riwayat kuis aksara.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
