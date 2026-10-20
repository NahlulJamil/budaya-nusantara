import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${newsreader.variable} antialiased`}>
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:border focus:border-line focus:bg-paper focus:px-4 focus:py-2 focus:text-[12px] focus:font-medium focus:text-ink"
        >
          Lewati ke konten
        </a>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
