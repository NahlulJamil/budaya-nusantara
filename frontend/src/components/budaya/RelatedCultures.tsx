"use client";

import { useEffect, useState } from "react";

import {
  CategoryContentCard,
  type CategoryContentItem,
} from "@/components/jelajah/CategoryContentCard";
import { CATEGORY_LABELS, plainText, resolveMediaUrl } from "@/lib/api";
import { fetchCultureList, type CultureListItem } from "@/lib/cultureApi";
import type { CulturalCategory } from "@/lib/types";

function toItem(item: CultureListItem): CategoryContentItem {
  return {
    id: item.id,
    title: item.title,
    description: plainText(item.description),
    image: resolveMediaUrl(item.main_image),
    region: item.daerah?.nama ?? item.daerah?.provinsi ?? "Indonesia",
    meta:
      plainText(item.detail?.jenis_tradisi?.nama) ??
      CATEGORY_LABELS[item.category],
    href: `/budaya/${item.id}`,
  };
}

const PER_PAGE_LOCAL = 6;
const PER_PAGE_GLOBAL = 12;
const MAX_ITEMS = 2;

interface RelatedCulturesProps {
  contentId: number;
  /** Provinsi konten aktif; dipakai agar rekomendasi diprioritaskan dari wilayah yang sama. */
  provinsi: string | null;
  category: CulturalCategory;
  heading: string;
}

export function RelatedCultures({
  contentId,
  provinsi,
  category,
  heading,
}: RelatedCulturesProps) {
  const [result, setResult] = useState<{
    key: string;
    items: CategoryContentItem[];
    failed: boolean;
  } | null>(null);

  const key = `${contentId}|${provinsi ?? ""}|${category}`;

  useEffect(() => {
    let active = true;

    async function load(): Promise<CategoryContentItem[]> {
      const picked: CultureListItem[] = [];

      if (provinsi) {
        const local = await fetchCultureList({
          category,
          provinsi,
          perPage: PER_PAGE_LOCAL,
        });

        picked.push(...local.items.filter((item) => item.id !== contentId));
      }

      if (picked.length < MAX_ITEMS) {
        const global = await fetchCultureList({
          category,
          perPage: PER_PAGE_GLOBAL,
        });

        for (const item of global.items) {
          if (
            item.id === contentId ||
            picked.some((entry) => entry.id === item.id)
          ) {
            continue;
          }

          picked.push(item);

          if (picked.length >= MAX_ITEMS) {
            break;
          }
        }
      }

      return picked.slice(0, MAX_ITEMS).map(toItem);
    }

    load()
      .then((items) => {
        if (active) {
          setResult({ key, items, failed: false });
        }
      })
      .catch(() => {
        if (active) {
          setResult({ key, items: [], failed: true });
        }
      });

    return () => {
      active = false;
    };
  }, [category, contentId, key, provinsi]);

  const current = result?.key === key ? result : null;
  const items = current?.items ?? null;
  const failed = current?.failed ?? false;

  return (
    <section aria-labelledby="rekomendasi-heading" className="mt-14">
      <p className="eyebrow">Lanjut menjelajah</p>
      <h2
        id="rekomendasi-heading"
        className="mt-1 font-serif text-[26px] leading-tight font-normal text-ink sm:text-[30px]"
      >
        {heading}
      </h2>

      {items === null ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: MAX_ITEMS }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-line/70 bg-paper"
            >
              <div className="skeleton aspect-[16/10] w-full" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-2.5 w-24 rounded" />
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {items !== null && failed ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-[12.5px] leading-[1.8] text-muted">
          Rekomendasi konten lain gagal dimuat. Anda tetap dapat kembali ke
          daftar kategori lewat tombol di bawah.
        </p>
      ) : null}

      {items !== null && !failed && items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-[12.5px] leading-[1.8] text-muted">
          Belum ada konten lain yang dipublikasikan untuk direkomendasikan.
        </p>
      ) : null}

      {items !== null && !failed && items.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <CategoryContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
