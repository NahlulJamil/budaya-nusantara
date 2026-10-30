import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GaleriBudaya — Beragam akar, satu ruang untuk mengenal",
    template: "%s · GaleriBudaya",
  },
  description:
    "Galeri budaya Indonesia: jelajahi tradisi, pakaian adat, makanan daerah, alat musik tradisional, dan aksara daerah.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${newsreader.variable} antialiased`}>
        {children}
        <FloatingChatbot />
      </body>
    </html>
  );
}
