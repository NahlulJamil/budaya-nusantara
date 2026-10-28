import type { Metadata } from "next";

import { CultureCatalogScreen } from "@/components/budaya/CultureCatalogScreen";
import { CULTURE_CATEGORIES } from "@/lib/cultureApi";
import type { CulturalCategory } from "@/lib/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Jelajah Indonesia",
  description:
    "Katalog budaya Indonesia: tradisi, pakaian adat, makanan daerah, dan alat musik tradisional yang sudah dipublikasikan.",
};

interface JelajahPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function JelajahPage({ searchParams }: JelajahPageProps) {
  const query = await searchParams;

  const rawCategory = firstValue(query.kategori);
  const category =
    rawCategory &&
    CULTURE_CATEGORIES.includes(rawCategory as CulturalCategory)
      ? (rawCategory as CulturalCategory)
      : null;

  const search = (firstValue(query.q) ?? "").trim().slice(0, 100);

  const rawPage = Number(firstValue(query.page));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <CultureCatalogScreen
      initialCategory={category}
      initialQuery={search}
      initialPage={page}
    />
  );
}
