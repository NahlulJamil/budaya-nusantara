"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV_LINKS } from "@/components/layout/nav-links";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavbarInner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-night text-[#f3efe4]">
      <div className="shell grid h-[72px] grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="focus-ring justify-self-start text-[19px] font-normal tracking-[0.02em] text-[#f6f2e7]"
          aria-label="GaleriBudaya — Beranda"
        >
          Galeri<span className="text-amber">Budaya</span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-12 lg:flex xl:gap-14"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring text-[13.5px] tracking-[0.07em] transition-colors ${
                  active ? "text-amber" : "text-[#efeade]/90 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="focus-ring justify-self-end rounded-md p-2 text-[#f3efe4] lg:hidden"
        >
          {open ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-navigation"
          aria-label="Navigasi mobile"
          className="border-t border-white/10 bg-night lg:hidden"
        >
          <ul className="shell flex flex-col py-2">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`focus-ring block border-b border-white/5 py-3.5 text-[14px] tracking-[0.05em] ${
                      active ? "text-amber" : "text-[#efeade]/90"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
