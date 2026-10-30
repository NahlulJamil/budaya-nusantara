import Link from "next/link";
import { Suspense } from "react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { NavbarInner } from "@/components/layout/NavbarInner";

/** Tampilan statis saat `usePathname()` belum tersedia di proses prerender. */
function NavbarFallback() {
  return (
    <header className="relative z-50 bg-night text-[#f3efe4]">
      <div className="shell grid h-[72px] grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]">
        <BrandLogo size="md" className="justify-self-start" />

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-12 lg:flex xl:gap-14"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring text-[13.5px] tracking-[0.07em] text-[#efeade]/90 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block" aria-hidden="true" />
        <div className="h-9 w-9 justify-self-end lg:hidden" aria-hidden="true" />
      </div>
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarInner />
    </Suspense>
  );
}
