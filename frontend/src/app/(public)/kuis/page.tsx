import type { Metadata } from "next";

import { QuizHubScreen } from "@/components/aksara/QuizHubScreen";

export const metadata: Metadata = {
  title: "Kuis Aksara",
  description:
    "Pilih aksara daerah dan uji pemahamanmu lewat kuis dengan pemeriksaan jawaban dari server.",
};

export default function KuisPage() {
  return <QuizHubScreen />;
}
