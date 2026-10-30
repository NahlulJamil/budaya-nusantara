"use client";

import { MusicVisual } from "@/components/budaya/MusicVisual";
import { RelatedCultures } from "@/components/budaya/RelatedCultures";
import {
  ArticleSection,
  BackToCategory,
  BodyText,
  ChatbotCta,
  ContentGallery,
  CultureBreadcrumb,
  type ArticleSectionLink,
} from "@/components/budaya/DetailParts";
import { getCategoryBySlug } from "@/data/budayaCategories";
import { getProvinceByName } from "@/data/provinceData";
import { plainText } from "@/lib/api";
import type { CultureDetailItem } from "@/lib/cultureApi";

const CATEGORY_LABEL = getCategoryBySlug("alat-musik")?.label ?? "Alat Musik";

export function MusicDetail({ data }: { data: CultureDetailItem }) {
  const description = plainText(data.description);
  const history = plainText(data.history);
  const meaning = plainText(data.meaning);
  const material = plainText(data.detail?.material);
  const howToPlay = plainText(data.detail?.how_to_play);
  const func = plainText(data.detail?.function);

  const provinsi = data.daerah?.provinsi ?? null;
  const province = getProvinceByName(provinsi);
  const region = [data.daerah?.nama, data.daerah?.provinsi]
    .filter(Boolean)
    .join(" · ");
  const backHref = province
    ? `/jelajah/${province.slug}/alat-musik`
    : "/jelajah";
  const backLabel = province
    ? `${CATEGORY_LABEL} ${province.name}`
    : "katalog Jelajah Indonesia";

  // Bagian artikel hanya dibuat untuk field yang benar-benar tersedia pada
  // respons API; konteks pertunjukan tidak ditampilkan karena tidak ada field-nya.
  const sections: ArticleSectionLink[] = [
    ...(history
      ? [{ id: "sejarah", label: "Sejarah & asal-usul" } satisfies ArticleSectionLink]
      : []),
    ...(material
      ? [{ id: "bahan", label: "Bahan pembuatan" } satisfies ArticleSectionLink]
      : []),
    ...(howToPlay
      ? [
          {
            id: "cara-memainkan",
            label: "Cara memainkan",
          } satisfies ArticleSectionLink,
        ]
      : []),
    ...(func || meaning
      ? [
          {
            id: "fungsi",
            label: "Fungsi & peran budaya",
          } satisfies ArticleSectionLink,
        ]
      : []),
    { id: "galeri", label: "Galeri foto" },
  ];

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
        categorySlug="alat-musik"
      />

      <header className="mt-10 max-w-[880px]">
        <p className="eyebrow">
          {[CATEGORY_LABEL, region].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(32px,4.8vw,56px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
          Melodi yang Bernyawa, Irama yang Menyatukan.
        </h1>
        <p className="mt-4 max-w-[760px] text-[13.5px] leading-[1.85] text-muted">
          Setiap petikan senar, tabuhan gendang, dan tiupan bambu menyimpan
          sejarah serta filosofi hidup masyarakat Indonesia. Kenali ragam alat
          musik tradisional dan suarakan kembali kekayaan warisan Nusantara.
        </p>
      </header>

      <MusicVisual
        key={data.id}
        title={data.title}
        mainImage={data.main_image}
        audio={data.detail?.audio ?? null}
      />

      <div className="mx-auto mt-10 max-w-[760px] text-center">
        <h2 className="font-serif text-[clamp(28px,3.6vw,42px)] leading-[1.15] font-normal text-[#7b5b3c]">
          {data.title}
        </h2>
        <p className="mt-2 text-[11.5px] text-muted">
          {region || "Indonesia"}
        </p>
        {description ? (
          <p className="mt-5 whitespace-pre-line text-[14px] leading-[1.9] text-ink/70 sm:text-[15px]">
            {description}
          </p>
        ) : (
          <p className="mt-5 text-[13px] leading-[1.85] text-muted">
            Deskripsi alat musik ini belum tersedia di basis data.
          </p>
        )}
      </div>

      <div className="mx-auto mt-14 max-w-[760px] space-y-10">
        {history ? (
          <ArticleSection
            id="sejarah"
            index={sectionIndex("sejarah")}
            title="Sejarah & asal-usul"
          >
            <BodyText>{history}</BodyText>
          </ArticleSection>
        ) : null}

        {material ? (
          <ArticleSection
            id="bahan"
            index={sectionIndex("bahan")}
            title="Bahan pembuatan"
          >
            <div className="rounded-xl border border-line bg-paper p-4">
              <BodyText>{material}</BodyText>
            </div>
          </ArticleSection>
        ) : null}

        {howToPlay ? (
          <ArticleSection
            id="cara-memainkan"
            index={sectionIndex("cara-memainkan")}
            title="Cara memainkan"
          >
            <BodyText>{howToPlay}</BodyText>
          </ArticleSection>
        ) : null}

        {func || meaning ? (
          <ArticleSection
            id="fungsi"
            index={sectionIndex("fungsi")}
            title="Fungsi & peran budaya"
          >
            <div className="space-y-5">
              {func ? (
                <div>
                  <p className="eyebrow">Fungsi</p>
                  <div className="mt-2">
                    <BodyText>{func}</BodyText>
                  </div>
                </div>
              ) : null}

              {meaning ? (
                <div>
                  <p className="eyebrow">Peran dalam kebudayaan</p>
                  <div className="mt-2">
                    <BodyText>{meaning}</BodyText>
                  </div>
                </div>
              ) : null}
            </div>
          </ArticleSection>
        ) : null}

        <ArticleSection
          id="galeri"
          index={sectionIndex("galeri")}
          title="Galeri foto"
        >
          <ContentGallery contentId={data.id} />
        </ArticleSection>
      </div>

      <div className="mx-auto max-w-[760px]">
        <ChatbotCta contentId={data.id} />
      </div>

      <div className="mx-auto max-w-[760px]">
        <RelatedCultures
          contentId={data.id}
          provinsi={provinsi}
          category="alat_musik"
          heading="Alat musik lain untuk dikenali"
        />
      </div>

      <div className="mx-auto max-w-[760px]">
        <BackToCategory href={backHref} label={backLabel} />
      </div>
    </div>
  );
}
