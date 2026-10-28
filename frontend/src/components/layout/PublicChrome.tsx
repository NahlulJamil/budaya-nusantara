import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:border focus:border-line focus:bg-paper focus:px-4 focus:py-2 focus:text-[12px] focus:font-medium focus:text-ink"
      >
        Lewati ke konten
      </a>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
