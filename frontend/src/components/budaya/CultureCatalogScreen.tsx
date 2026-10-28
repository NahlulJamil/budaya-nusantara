"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { CultureCatalogCard } from "@/components/budaya/CultureCatalogCard";
import { AlertIcon, RefreshIcon, SearchIcon } from "@/components/ui/icons";
import { CATEGORY_LABELS } from "@/lib/api";
import {
  CULTURE_CATEGORIES,
  CultureApiError,
  fetchCultureList,
  type CultureListItem,
} from "@/lib/cultureApi";
import type { CulturalCategory, PaginationMeta } from "@/lib/types";

const PER_PAGE = 9;
const MAX_QUERY = 100;

type LoadState =
  | {
      key: string;
      status: "ready";
      items: CultureListItem[];
      meta: PaginationMeta;
    }
  | { key: string; status: "error"; message: string };

function catalogHref(
  category: CulturalCategory | null,
  query: string,
  page: number,
): string {
  const params = new URLSearchParams();

  if (category) {
    params.set("kategori", category);
  }
  if (query) {
    params.set("q", query);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();

  return `/jelajah${search ? `?${search}` : ""}`;
}

function CatalogSkeleton() {
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[10px] border border-line/80 bg-paper"
        >
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CultureCatalogScreenProps {
  initialCategory: CulturalCategory | null;
  initialQuery: string;
  initialPage: number;
}

export function CultureCatalogScreen({
  initialCategory,
  initialQuery,
  initialPage,
}: CultureCatalogScreenProps) {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const key = `${initialCategory ?? "all"}|${initialQuery}|${initialPage}|${reloadKey}`;

  useEffect(() => {
    let active = true;

    fetchCultureList({
      category: initialCategory,
      q: initialQuery,
      page: initialPage,
      perPage: PER_PAGE,
    })
      .then((response) => {
        if (!active) {
          return;
        }

        setLoad({
          key,
          status: "ready",
          items: response.items,
          meta: response.meta,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setLoad({
          key,
          status: "error",
          message:
            cause instanceof CultureApiError
              ? cause.message
              : "Gagal memuat katalog budaya. Coba lagi.",
        });
      });

    return () => {
      active = false;
    };
  }, [key, initialCategory, initialQuery, initialPage]);

  const loading = load === null || load.key !== key;
  const current = loading ? null : load;
  const error = current?.status === "error" ? current.message : null;
  const items = current?.status === "ready" ? current.items : [];
  const meta = current?.status === "ready" ? current.meta : null;

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") ?? "")
      .trim()
      .slice(0, MAX_QUERY);

    router.push(catalogHref(initialCategory, query, 1));
  }

  const hasFilter = Boolean(initialCategory || initialQuery);
  const beyondLastPage = Boolean(
    meta && meta.total > 0 && items.length === 0 && initialPage > 1,
  );

  return (
    <main id="main" className="pb-20">
      <section className="shell pt-14 sm:pt-16 lg:pt-20">
        <div className="max-w-[700px]">
          <p className="eyebrow">Jelajah Indonesia</p>
          <h1 className="mt-3 font-serif text-[clamp(34px,4.4vw,54px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
            Katalog budaya Nusantara
          </h1>
          <p className="mt-4 text-[13px] leading-[1.8] text-muted">
            Telusuri tradisi, pakaian adat, makanan, dan alat musik dari berbagai
            daerah. Semua konten berasal dari basis data budaya yang
            dipublikasikan.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-center">
          <form
            action="/jelajah"
            method="get"
            role="search"
            onSubmit={handleSearch}
            className="flex h-11 w-full items-center gap-2 rounded-full border border-line bg-paper px-4 transition-colors focus-within:border-ink/40"
          >
            <SearchIcon className="h-4 w-4 flex-none text-muted" />
            <label htmlFor="katalog-search" className="sr-only">
              Cari konten budaya
            </label>
            <input
              key={initialQuery}
              id="katalog-search"
              name="q"
              type="search"
              defaultValue={initialQuery}
              maxLength={MAX_QUERY}
              autoComplete="off"
              placeholder="Cari judul konten budaya..."
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {initialCategory ? (
              <input type="hidden" name="kategori" value={initialCategory} />
            ) : null}
            <button
              type="submit"
              className="focus-ring inline-flex h-8 flex-none items-center rounded-full bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
            >
              Cari
            </button>
          </form>

          <div
            role="group"
            aria-label="Filter kategori"
            className="flex flex-wrap gap-2"
          >
            <Link
              href={catalogHref(null, initialQuery, 1)}
              aria-current={!initialCategory ? "page" : undefined}
              className={`focus-ring rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                !initialCategory
                  ? "border-night bg-night text-[#f6f2e7]"
                  : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
              }`}
            >
              Semua
            </Link>
            {CULTURE_CATEGORIES.map((category) => {
              const active = initialCategory === category;

              return (
                <Link
                  key={category}
                  href={catalogHref(category, initialQuery, 1)}
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                    active
                      ? "border-night bg-night text-[#f6f2e7]"
                      : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11.5px] text-muted" aria-live="polite">
            {loading
              ? "Memuat konten..."
              : meta
                ? `${meta.total} konten ditemukan`
                : ""}
          </p>
          {hasFilter ? (
            <Link
              href="/jelajah"
              className="focus-ring text-[11.5px] font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Hapus pencarian & filter
            </Link>
          ) : null}
        </div>

        {loading ? <CatalogSkeleton /> : null}

        {!loading && error ? (
          <div
            role="alert"
            className="mt-7 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
          >
            <AlertIcon className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshIcon className="h-3 w-3" />
              Coba lagi
            </button>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="mt-7 rounded-lg border border-dashed border-line bg-paper px-5 py-12 text-center">
            <p className="text-[13px] leading-[1.8] text-muted">
              {beyondLastPage
                ? "Halaman ini tidak memiliki konten."
                : hasFilter
                  ? "Tidak ada konten budaya yang cocok dengan pencarian atau filter ini."
                  : "Belum ada konten budaya yang dipublikasikan."}
            </p>
            {beyondLastPage ? (
              <Link
                href={catalogHref(initialCategory, initialQuery, 1)}
                className="focus-ring mt-4 inline-flex h-9 items-center rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Ke halaman pertama
              </Link>
            ) : hasFilter ? (
              <Link
                href="/jelajah"
                className="focus-ring mt-4 inline-flex h-9 items-center rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Tampilkan semua konten
              </Link>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CultureCatalogCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}

        {!loading && !error && meta && meta.last_page > 1 ? (
          <nav
            aria-label="Navigasi halaman katalog"
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {meta.current_page > 1 ? (
              <Link
                href={catalogHref(
                  initialCategory,
                  initialQuery,
                  meta.current_page - 1,
                )}
                className="focus-ring inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex h-9 items-center rounded-md border border-line/60 bg-cream px-3 text-[11.5px] text-muted/70"
              >
                ← Sebelumnya
              </span>
            )}

            <span className="text-[11.5px] text-muted">
              Halaman {meta.current_page} dari {meta.last_page}
            </span>

            {meta.current_page < meta.last_page ? (
              <Link
                href={catalogHref(
                  initialCategory,
                  initialQuery,
                  meta.current_page + 1,
                )}
                className="focus-ring inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                Berikutnya →
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex h-9 items-center rounded-md border border-line/60 bg-cream px-3 text-[11.5px] text-muted/70"
              >
                Berikutnya →
              </span>
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
