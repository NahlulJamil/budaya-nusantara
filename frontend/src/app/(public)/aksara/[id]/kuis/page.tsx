import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuizScreen } from "@/components/aksara/QuizScreen";

export const instant = false;

export const metadata: Metadata = {
  title: "Kuis Aksara",
  description:
    "Kerjakan kuis aksara daerah: jawaban diperiksa server dan dilengkapi penjelasan.",
};

interface AksaraQuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function AksaraQuizPage({ params }: AksaraQuizPageProps) {
  const { id } = await params;
  const aksaraId = Number(id);

  if (!Number.isInteger(aksaraId) || aksaraId < 1) {
    notFound();
  }

  return <QuizScreen aksaraId={aksaraId} />;
}
