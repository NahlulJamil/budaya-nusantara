"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  CategoryContentCard,
  type CategoryContentItem,
} from "@/components/jelajah/CategoryContentCard";
import {
  AlertIcon,
  ArrowUpRightIcon,
  RefreshIcon,
  SearchIcon,
  SlidersIcon,
} from "@/components/ui/icons";
import type { CategoryView } from "@/data/budayaCategories";
import type { ProvinceData } from "@/data/provinceData";
import { AksaraApiError, fetchAksaraPage } from "@/lib/aksaraApi";
import { CATEGORY_LABELS, plainText, resolveMediaUrl } from "@/lib/api";
import {
  CultureApiError,
  fetchCultureList,
  fetchDaerahByProvince,
  type CultureDaerah,
  type CultureListItem,
} from "@/lib/cultureApi";
import type { PaginationMeta } from "@/lib/types";

const PER_PAGE = 9;
const MAX_QUERY = 100;

type LoadState =
  | {
      key: string;
      status: "ready";
      items: CategoryContentItem[];
      meta: PaginationMeta;
    }
  | { key: string; status: "error"; message: string };

interface BrowseHrefParams {
  q?: string;
  page?: number;
  daerahId?: number | null;
}

function browseHref(
  provinceSlug: string,
  categorySlug: string,
  { q, page, daerahId }: BrowseHrefParams,
): string {
  const params = new URLSearchParams();
  const keyword = q?.trim();

  if (keyword) {
    params.set("q", keyword);
  }
  if (daerahId) {
    params.set("daerah", String(daerahId));
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();

  return `/jelajah/${provinceSlug}/${categorySlug}${search ? `?${search}` : ""}`;
}

function toBudayaItem(
  item: CultureListItem,
  fallbackRegion: string,
): CategoryContentItem {
  const jenisTradisi =
    item.category === "tradisi" ? item.detail?.jenis_tradisi?.nama : null;

  return {
    id: item.id,
    title: item.title,
    description: plainText(item.description),
    image: resolveMediaUrl(item.main_image),
    region: item.daerah?.nama ?? fallbackRegion,
    meta: jenisTradisi ?? CATEGORY_LABELS[item.category],
    href: `/budaya/${item.id}`,
  };
}

function pageNumbers(
  current: number,
  last: number,
): Array<number | "gap"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const visible = new Set<number>([1, last]);
  for (const page of [current - 1, current, current + 1]) {
    if (page > 1 && page < last) {
      visible.add(page);
    }
  }

  const pages = [...visible].sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  let previous = 0;

  for (const page of pages) {
    if (previous && page - previous > 1) {
      result.push("gap");
    }
    result.push(page);
    previous = page;
  }

  return result;
}

function BrowseSkeleton() {
  return (
    <div
      className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-line/70 bg-paper"
        >
          <div className="skeleton aspect-[16/10] w-full" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-2.5 w-24 rounded" />
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CategoryBrowseScreenProps {
  province: ProvinceData;
  category: CategoryView;
  initialQuery: string;
  initialPage: number;
  initialDaerahId: number | null;
}

export function CategoryBrowseScreen({
  province,
  category,
  initialQuery,
  initialPage,
  initialDaerahId,
}: CategoryBrowseScreenProps) {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [daerahOptions, setDaerahOptions] = useState<CultureDaerah[] | null>(
    null,
  );
  const [daerahFailed, setDaerahFailed] = useState(false);

  const key = `${province.slug}|${category.slug}|${initialQuery}|${initialPage}|${initialDaerahId ?? 0}|${reloadKey}`;

  useEffect(() => {
    let active = true;

    const request = category.apiCategory
      ? fetchCultureList({
          category: category.apiCategory,
          q: initialQuery,
          provinsi: province.name,
          daerahId: initialDaerahId,
          page: initialPage,
          perPage: PER_PAGE,
        }).then((response) => ({
          items: response.items.map((item) =>
            toBudayaItem(item, province.name),
          ),
          meta: response.meta,
        }))
      : fetchAksaraPage({
          q: initialQuery,
          provinsi: province.name,
          daerahId: initialDaerahId,
          page: initialPage,
          perPage: PER_PAGE,
        }).then((response) => ({
          items: response.items.map(
            (item): CategoryContentItem => ({
              id: item.id,
              title: item.name,
              description: plainText(item.description),
              image: resolveMediaUrl(item.main_image),
              region: item.daerah?.nama ?? province.name,
              meta: category.shortLabel,
              href: `/aksara/${item.id}`,
            }),
          ),
          meta: response.meta,
        }));

    request
      .then((response) => {
        if (!active) {
          return;
        }

        setLoad({ key, status: "ready", ...response });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setLoad({
          key,
          status: "error",
          message:
            cause instanceof CultureApiError || cause instanceof AksaraApiError
              ? cause.message
              : `Gagal memuat ${category.label.toLowerCase()}. Coba lagi.`,
        });
      });

    return () => {
      active = false;
    };
  }, [
    key,
    category.apiCategory,
    category.label,
    category.shortLabel,
    initialDaerahId,
    initialPage,
    initialQuery,
    province.name,
  ]);

  useEffect(() => {
    let active = true;

    fetchDaerahByProvince(province.name)
      .then((items) => {
        if (active) {
          setDaerahOptions(items);
          setDaerahFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setDaerahOptions([]);
          setDaerahFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [province.name]);

  const loading = load === null || load.key !== key;
  const current = loading ? null : load;
  const error = current?.status === "error" ? current.message : null;
  const items = current?.status === "ready" ? current.items : [];
  const meta = current?.status === "ready" ? current.meta : null;
  const hasFilter = Boolean(initialQuery || initialDaerahId);
  const beyondLastPage = Boolean(
    meta && meta.total > 0 && items.length === 0 && initialPage > 1,
  );
  const selectedDaerah = daerahOptions?.find(
    (daerah) => daerah.id === initialDaerahId,
  );

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") ?? "")
      .trim()
      .slice(0, MAX_QUERY);

    router.push(
      browseHref(province.slug, category.slug, {
        q: query,
        daerahId: initialDaerahId,
      }),
    );
  }

  return (
    <main id="main" className="bg-[#F8F6EF] pb-20">
      <section className="shell pt-9 sm:pt-12 lg:pt-16">
        <nav aria-label="Breadcrumb" className="text-[11.5px] text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="focus-ring transition-colors hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/jelajah"
                className="focus-ring transition-colors hover:text-ink"
              >
                Jelajah Indonesia
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/jelajah/${province.slug}`}
                className="focus-ring transition-colors hover:text-ink"
              >
                {province.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {category.label}
            </li>
          </ol>
        </nav>

        <div className="mt-9 max-w-[900px]">
          <h1 className="font-serif text-[clamp(34px,4.6vw,56px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
            {category.heading}
          </h1>
          <p className="mt-4 max-w-[780px] text-[13.5px] leading-[1.8] text-muted">
            {category.description}
          </p>
        </div>

        <form
          role="search"
          onSubmit={handleSearch}
          className="mt-8 flex h-14 w-full items-center gap-3 rounded-lg border border-line bg-paper px-4 transition-colors focus-within:border-ink/40"
        >
          <SearchIcon className="h-[18px] w-[18px] flex-none text-muted" />
          <label htmlFor="category-search" className="sr-only">
            {category.searchPlaceholder}
          </label>
          <input
            key={initialQuery}
            id="category-search"
            name="q"
            type="search"
            defaultValue={initialQuery}
            maxLength={MAX_QUERY}
            autoComplete="off"
            placeholder={category.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />

          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            aria-controls="category-filter"
            aria-label="Filter daerah"
            className="focus-ring -mr-1 flex h-10 w-10 flex-none items-center justify-center rounded-md text-ink transition-colors hover:bg-cream"
          >
            <SlidersIcon className="h-[18px] w-[18px]" />
          </button>
        </form>

        {filterOpen ? (
          <div
            id="category-filter"
            className="mt-3 rounded-lg border border-line bg-paper p-4"
          >
            <p className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
              Filter daerah
            </p>

            {daerahFailed ? (
              <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                Data daerah gagal dimuat. Pencarian tetap bisa dipakai.
              </p>
            ) : daerahOptions === null ? (
              <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                Memuat daftar daerah...
              </p>
            ) : daerahOptions.length === 0 ? (
              <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                Belum ada data daerah untuk {province.name}. Pencarian tetap
                bisa dipakai.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={browseHref(province.slug, category.slug, {
                    q: initialQuery,
                  })}
                  onClick={() => setFilterOpen(false)}
                  aria-current={!initialDaerahId ? "true" : undefined}
                  className={`focus-ring rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                    !initialDaerahId
                      ? "border-night bg-night text-[#f6f2e7]"
                      : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                  }`}
                >
                  Semua daerah
                </Link>

                {daerahOptions.map((daerah) => {
                  const active = initialDaerahId === daerah.id;

                  return (
                    <Link
                      key={daerah.id}
                      href={browseHref(province.slug, category.slug, {
                        q: initialQuery,
                        daerahId: daerah.id,
                      })}
                      onClick={() => setFilterOpen(false)}
                      aria-current={active ? "true" : undefined}
                      className={`focus-ring rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                        active
                          ? "border-night bg-night text-[#f6f2e7]"
                          : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                      }`}
                    >
                      {daerah.nama}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11.5px] text-muted" aria-live="polite">
            {loading
              ? `Memuat ${category.label.toLowerCase()}...`
              : meta
                ? `${meta.total} ${
                    category.slug === "aksara" ? "aksara" : "konten"
                  } ditemukan${selectedDaerah ? ` di ${selectedDaerah.nama}` : ""}`
                : ""}
          </p>

          {hasFilter ? (
            <Link
              href={browseHref(province.slug, category.slug, {})}
              className="focus-ring text-[11.5px] font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Hapus pencarian & filter
            </Link>
          ) : null}
        </div>

        {loading ? <BrowseSkeleton /> : null}

        {!loading && error ? (
          <div
            role="alert"
            className="mt-8 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
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
          <div className="mt-8 rounded-xl border border-dashed border-line bg-paper px-5 py-14 text-center">
            <p className="mx-auto max-w-[440px] text-[13px] leading-[1.8] text-muted">
              {beyondLastPage
                ? "Halaman ini tidak memiliki konten."
                : hasFilter
                  ? `Tidak ada ${category.label.toLowerCase()} di ${province.name} yang cocok dengan pencarian atau filter ini.`
                  : `Belum ada ${category.label.toLowerCase()} yang dipublikasikan untuk ${province.name}.`}
            </p>

            {beyondLastPage ? (
              <Link
                href={browseHref(province.slug, category.slug, {
                  q: initialQuery,
                  daerahId: initialDaerahId,
                })}
                className="focus-ring mt-5 inline-flex h-9 items-center rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Ke halaman pertama
              </Link>
            ) : hasFilter ? (
              <Link
                href={browseHref(province.slug, category.slug, {})}
                className="focus-ring mt-5 inline-flex h-9 items-center rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Hapus pencarian & filter
              </Link>
            ) : (
              <Link
                href={`/jelajah/${province.slug}`}
                className="focus-ring mt-5 inline-flex h-9 items-center rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Kembali ke {province.name}
              </Link>
            )}
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CategoryContentCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}

        {!loading && !error && meta && meta.last_page > 1 ? (
          <nav
            aria-label={`Navigasi halaman ${category.label.toLowerCase()}`}
            className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:justify-end"
          >
            {meta.current_page > 1 ? (
              <Link
                href={browseHref(province.slug, category.slug, {
                  q: initialQuery,
                  page: meta.current_page - 1,
                  daerahId: initialDaerahId,
                })}
                className="focus-ring inline-flex h-9 items-center gap-1 rounded-full border border-line bg-paper px-3.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <span
                className="inline-flex h-9 items-center rounded-full border border-line/60 bg-cream px-3.5 text-[11.5px] text-muted/70"
                aria-disabled="true"
              >
                ← Sebelumnya
              </span>
            )}

            {pageNumbers(meta.current_page, meta.last_page).map((page, index) =>
              page === "gap" ? (
                <span
                  key={`gap-${index}`}
                  aria-hidden="true"
                  className="px-1 text-[11.5px] text-muted"
                >
                  …
                </span>
              ) : (
                <Link
                  key={page}
                  href={browseHref(province.slug, category.slug, {
                    q: initialQuery,
                    page,
                    daerahId: initialDaerahId,
                  })}
                  aria-current={page === meta.current_page ? "page" : undefined}
                  aria-label={`Halaman ${page}`}
                  className={`focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-medium transition-colors ${
                    page === meta.current_page
                      ? "bg-night text-[#f6f2e7]"
                      : "border border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                  }`}
                >
                  {page}
                </Link>
              ),
            )}

            {meta.current_page < meta.last_page ? (
              <Link
                href={browseHref(province.slug, category.slug, {
                  q: initialQuery,
                  page: meta.current_page + 1,
                  daerahId: initialDaerahId,
                })}
                className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                Berikutnya
                <ArrowUpRightIcon className="h-3 w-3" />
              </Link>
            ) : (
              <span
                className="inline-flex h-9 items-center rounded-full border border-line/60 bg-cream px-3.5 text-[11.5px] text-muted/70"
                aria-disabled="true"
              >
                Berikutnya
              </span>
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
