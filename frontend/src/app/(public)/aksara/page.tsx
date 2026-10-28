import type { Metadata } from "next";

import { AksaraListScreen } from "@/components/aksara/AksaraListScreen";

export const metadata: Metadata = {
  title: "Belajar Aksara",
  description:
    "Pelajari aksara daerah Indonesia: bentuk karakter, bacaan Latin, dan kategorinya, lalu uji pemahaman lewat kuis.",
};

export default function AksaraPage() {
  return <AksaraListScreen />;
}
