"use client";

import Link from "next/link";

import { SearchIcon, SlidersIcon } from "@/components/ui/icons";

const CATEGORIES = [
  { value: "tradisi", label: "Tradisi & upacara adat" },
  { value: "baju_adat", label: "Pakaian adat" },
  { value: "makanan", label: "Makanan daerah" },
  { value: "alat_musik", label: "Alat musik tradisional" },
];

export function HeroSearch() {
  return (
    <form
      action="/jelajah"
      method="get"
      role="search"
      className="flex h-11 w-full items-center gap-2.5 rounded-full border border-white/45 bg-black/25 px-4 text-[#f6f2e7] backdrop-blur-md transition-colors focus-within:border-white/80 sm:h-12 sm:w-[420px]"
    >
      <button
        type="submit"
        aria-label="Cari"
        className="focus-ring -ml-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-white/85 transition-colors hover:text-white"
      >
        <SearchIcon className="h-[18px] w-[18px]" />
      </button>

      <label htmlFor="hero-search" className="sr-only">
        Cari budaya, daerah, atau cerita
      </label>
      <input
        id="hero-search"
        name="q"
        type="search"
        placeholder="Cari budaya, daerah, atau cerita..."
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-[12.5px] tracking-[0.01em] text-white outline-none placeholder:text-white/75 [&::-webkit-search-cancel-button]:hidden"
      />

      <span className="h-5 w-px flex-none bg-white/30" aria-hidden="true" />

      <details className="group relative flex-none">
        <summary
          aria-label="Filter kategori"
          className="focus-ring flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden"
        >
          <SlidersIcon className="h-[18px] w-[18px]" />
        </summary>

        <div className="absolute top-full right-0 z-20 mt-3 w-56 rounded-xl border border-white/15 bg-[#12110d]/95 p-1.5 shadow-2xl backdrop-blur-md">
          <p className="px-3 pt-2 pb-1.5 text-[9px] tracking-[0.16em] text-white/50 uppercase">
            Jelajahi kategori
          </p>
          {CATEGORIES.map((category) => (
            <Link
              key={category.value}
              href={`/jelajah?kategori=${category.value}`}
              onClick={(event) => {
                event.currentTarget
                  .closest("details")
                  ?.removeAttribute("open");
              }}
              className="focus-ring block rounded-lg px-3 py-2 text-[12px] text-[#efeade]/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </details>
    </form>
  );
}
