"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  AdminSidebarNav,
  AdminSidebarNavFallback,
} from "@/components/admin/AdminSidebarNav";
import { ArrowUpRightIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-7 pb-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="focus-ring text-[19px] tracking-[0.02em] text-[#f6f2e7]"
        >
          Galeri<span className="text-amber">Budaya</span>
        </Link>
        <p className="mt-2 text-[9.5px] font-medium tracking-[0.18em] text-[#8d8779] uppercase">
          Panel Admin
        </p>
      </div>

      <nav aria-label="Navigasi admin" className="flex-1">
        <p className="px-6 pb-2 text-[9.5px] font-medium tracking-[0.18em] text-[#8d8779] uppercase">
          Konten
        </p>
        <Suspense fallback={<AdminSidebarNavFallback />}>
          <AdminSidebarNav onNavigate={onNavigate} />
        </Suspense>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="focus-ring group flex items-center justify-between rounded-lg px-3 py-2.5 text-[12.5px] text-[#d8d2c4] transition-colors hover:bg-white/5 hover:text-white"
        >
          Lihat situs publik
          <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAdminAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-cream">
      <a
        href="#admin-main"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:border focus:border-line focus:bg-paper focus:px-4 focus:py-2 focus:text-[12px] focus:font-medium focus:text-ink"
      >
        Lewati ke konten admin
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/10 bg-night lg:block">
        <SidebarContent />
      </aside>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Tutup menu admin"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-night/60 lg:hidden"
          />
          <aside
            id="admin-mobile-navigation"
            aria-label="Navigasi admin mobile"
            className="fixed inset-y-0 left-0 z-50 w-[284px] bg-night shadow-2xl lg:hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu admin"
              className="focus-ring absolute top-4 right-4 rounded-md p-2 text-[#f3efe4]"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </>
      ) : null}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/95 backdrop-blur">
          <div className="flex h-[64px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="admin-mobile-navigation"
              aria-label="Buka menu admin"
              className="focus-ring rounded-md p-2 text-ink lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="eyebrow">Admin GaleriBudaya</p>
              <p className="truncate text-[13px] font-medium text-ink">
                Kelola konten budaya
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden max-w-[180px] truncate text-[12px] text-muted sm:block">
                {user?.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="focus-ring inline-flex h-9 items-center rounded-md border border-line bg-paper px-3.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loggingOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </div>
        </header>

        <main id="admin-main" className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
