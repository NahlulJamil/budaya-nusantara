"use client";

import { RelatedCultures } from "@/components/budaya/RelatedCultures";
import {
  ArticleSection,
  ArticleToc,
  BackToCategory,
  BodyText,
  ChatbotCta,
  ContentGallery,
  CultureBreadcrumb,
  DetailHero,
  EmptyNote,
  useActiveSection,
  type ArticleSectionLink,
} from "@/components/budaya/DetailParts";
import { getCategoryBySlug } from "@/data/budayaCategories";
import { getProvinceByName } from "@/data/provinceData";
import { plainText, resolveMediaUrl } from "@/lib/api";
import type { CultureDetailItem } from "@/lib/cultureApi";

const CATEGORY_LABEL = getCategoryBySlug("makanan")?.label ?? "Makanan Khas";

export function FoodDetail({ data }: { data: CultureDetailItem }) {
  const description = plainText(data.description);
  const history = plainText(data.history);
  const meaning = plainText(data.meaning);
  const ingredients = plainText(data.detail?.ingredients);
  const recipe = plainText(data.detail?.recipe);
  const servingMethod = plainText(data.detail?.serving_method);
  const image = resolveMediaUrl(data.main_image);

  const provinsi = data.daerah?.provinsi ?? null;
  const province = getProvinceByName(provinsi);
  const region = [data.daerah?.nama, data.daerah?.provinsi]
    .filter(Boolean)
    .join(" · ");
  const backHref = province ? `/jelajah/${province.slug}/makanan` : "/jelajah";
  const backLabel = province
    ? `${CATEGORY_LABEL} ${province.name}`
    : "katalog Jelajah Indonesia";

  // Bagian resep hanya muncul jika field-nya benar-benar terisi; tidak ada
  // resep atau bahan yang dikarang di frontend.
  const sections: ArticleSectionLink[] = [
    { id: "sejarah", label: "Sejarah & asal-usul" },
    ...(ingredients
      ? [{ id: "bahan", label: "Bahan utama" } satisfies ArticleSectionLink]
      : []),
    ...(recipe || servingMethod
      ? [
          {
            id: "pembuatan",
            label: "Cara pembuatan & penyajian",
          } satisfies ArticleSectionLink,
        ]
      : []),
    { id: "makna", label: "Makna & kaitan budaya" },
    { id: "galeri", label: "Galeri foto" },
  ];

  const activeSection = useActiveSection(sections);

  function sectionIndex(id: string): string {
    const position = sections.findIndex((section) => section.id === id);

    return String(Math.max(position + 1, 1)).padStart(2, "0");
  }

  return (
    <div className="shell pt-8 sm:pt-10 lg:pt-14">
      <CultureBreadcrumb
        title={data.title}
        provinsi={provinsi}
        categoryLabel={CATEGORY_LABEL}
        categorySlug="makanan"
      />

      <DetailHero
        eyebrow={[CATEGORY_LABEL, region].filter(Boolean).join(" · ")}
        title={data.title}
        description={description}
        image={image}
        region={region}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ArticleToc sections={sections} activeSection={activeSection} />
        </aside>

        <article className="min-w-0 space-y-10">
          <ArticleSection
            id="sejarah"
            index={sectionIndex("sejarah")}
            title="Sejarah & asal-usul"
          >
            {history ? (
              <BodyText>{history}</BodyText>
            ) : (
              <EmptyNote>
                Catatan sejarah dan asal-usul makanan ini belum tersedia di basis
                data.
              </EmptyNote>
            )}
          </ArticleSection>

          {ingredients ? (
            <ArticleSection
              id="bahan"
              index={sectionIndex("bahan")}
              title="Bahan utama"
            >
              <div className="rounded-xl border border-line bg-paper p-4">
                <BodyText>{ingredients}</BodyText>
              </div>
            </ArticleSection>
          ) : null}

          {recipe || servingMethod ? (
            <ArticleSection
              id="pembuatan"
              index={sectionIndex("pembuatan")}
              title="Cara pembuatan & penyajian"
            >
              {recipe ? (
                <>
                  <p className="eyebrow">Pembuatan</p>
                  <div className="mt-2">
                    <BodyText>{recipe}</BodyText>
                  </div>
                </>
              ) : null}

              {servingMethod ? (
                <div className={recipe ? "mt-5" : ""}>
                  <p className="eyebrow">Penyajian</p>
                  <div className="mt-2">
                    <BodyText>{servingMethod}</BodyText>
                  </div>
                </div>
              ) : null}
            </ArticleSection>
          ) : null}

          <ArticleSection
            id="makna"
            index={sectionIndex("makna")}
            title="Makna & kaitan budaya"
          >
            {meaning ? (
              <BodyText>{meaning}</BodyText>
            ) : (
              <EmptyNote>
                Uraian makna dan kaitan budaya makanan ini belum tersedia di
                basis data.
              </EmptyNote>
            )}
          </ArticleSection>

          <ArticleSection
            id="galeri"
            index={sectionIndex("galeri")}
            title="Galeri foto"
          >
            <ContentGallery contentId={data.id} />
          </ArticleSection>
        </article>
      </div>

      <ChatbotCta contentId={data.id} />

      <RelatedCultures
        contentId={data.id}
        provinsi={provinsi}
        category="makanan"
        heading="Makanan khas lain untuk dicoba"
      />

      <BackToCategory href={backHref} label={backLabel} />
    </div>
  );
}
