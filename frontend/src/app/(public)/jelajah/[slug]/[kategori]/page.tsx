import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryBrowseScreen } from "@/components/jelajah/CategoryBrowseScreen";
import { getCategoryBySlug, toCategoryView } from "@/data/budayaCategories";
import { getProvinceBySlug } from "@/data/provinceData";

export const instant = false;

interface CategoryBrowsePageProps {
  params: Promise<{ slug: string; kategori: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);

  return Number.isInteger(page) && page > 1 ? page : 1;
}

function parseDaerahId(value: string | undefined): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: CategoryBrowsePageProps): Promise<Metadata> {
  const { slug, kategori } = await params;
  const province = getProvinceBySlug(slug);
  const category = getCategoryBySlug(kategori);

  if (!province || !category) {
    return { title: "Kategori Tidak Ditemukan - Galeri Budaya" };
  }

  return {
    title: `${category.label} ${province.name} - Jelajah Indonesia | Galeri Budaya`,
    description: category.description(province.name),
  };
}

export default async function CategoryBrowsePage({
  params,
  searchParams,
}: CategoryBrowsePageProps) {
  const { slug, kategori } = await params;
  const province = getProvinceBySlug(slug);
  const category = getCategoryBySlug(kategori);

  if (!province || !category) {
    notFound();
  }

  const filters = await searchParams;
  const query = (firstValue(filters.q) ?? "").trim().slice(0, 100);
  const page = parsePage(firstValue(filters.page));
  const daerahId = parseDaerahId(firstValue(filters.daerah));

  return (
    <CategoryBrowseScreen
      province={province}
      category={toCategoryView(category, province.name)}
      initialQuery={query}
      initialPage={page}
      initialDaerahId={daerahId}
    />
  );
}
