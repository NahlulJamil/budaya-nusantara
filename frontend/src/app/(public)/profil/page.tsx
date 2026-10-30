import { redirect } from "next/navigation";

/** Alamat lama `/profil` dipertahankan agar tautan lama tetap bekerja. */
export default function LegacyProfilePage() {
  redirect("/profile");
}
