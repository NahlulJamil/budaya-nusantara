import type { Metadata } from "next";

import { RegisterScreen } from "@/components/auth/RegisterScreen";

export const metadata: Metadata = {
  title: "Registrasi",
  description:
    "Buat akun GaleriBudaya untuk mengunggah dokumentasi budaya dan menyimpan riwayat kuis aksara.",
};

export default function RegistrasiPage() {
  return <RegisterScreen />;
}
