import type { Metadata } from "next";

import { ChatbotScreen } from "@/components/chatbot/ChatbotScreen";

export const instant = false;

export const metadata: Metadata = {
  title: "Chatbot Budaya",
  description:
    "Kanca Budaya, asisten AI yang berfokus pada budaya Indonesia dan cara memakai fitur GaleriBudaya.",
};

interface ChatbotPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function ChatbotPage({ searchParams }: ChatbotPageProps) {
  const query = await searchParams;
  const raw = firstValue(query.content_id);
  const contentId = raw && /^[1-9]\d*$/.test(raw) ? Number(raw) : undefined;

  return <ChatbotScreen initialContentId={contentId} />;
}
