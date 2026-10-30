"use client";

import { DressVisual } from "@/components/budaya/DressVisual";
import { RelatedCultures } from "@/components/budaya/RelatedCultures";
import {
  ArticleSection,
  BackToCategory,
  BodyText,
  ChatbotCta,
  ContentGallery,
  CultureBreadcrumb,
  EmptyNote,
  type ArticleSectionLink,
} from "@/components/budaya/DetailParts";
import { getCategoryBySlug } from "@/data/budayaCategories";
import { getProvinceByName } from "@/data/provinceData";
import { plainText, resolveMediaUrl } from "@/lib/api";
import type { CultureDetailItem } from "@/lib/cultureApi";

const CATEGORY_LABEL = getCategoryBySlug("baju_adat")?.label ?? "Baju Adat";

export function DressDetail({ data }: { data: CultureDetailItem }) {
  const description = plainText(data.description);
  const history = plainText(data.history);
  const meaning = plainText(data.meaning);
  const usage = plainText(data.detail?.usage);
  const image = resolveMediaUrl(data.main_image);
  const variants = (data.detail?.variants ?? []).filter(
    (variant) =>
      Boolean(resolveMediaUrl(variant.avatar_image)) ||
      Boolean(plainText(variant.description)),
  );

  const provinsi = data.daerah?.provinsi ?? null;
  const province = getProvinceByName(provinsi);
  const region = [data.daerah?.nama, data.daerah?.provinsi]
    .filter(Boolean)
    .join(" · ");
  const backHref = province ? `/jelajah/${province.slug}/baju-adat` : "/jelajah";
  const backLabel = province
    ? `${CATEGORY_LABEL} ${province.name}`
    : "katalog Jelajah Indonesia";

  // Bagian artikel mengikuti field yang benar-benar tersedia pada respons API;
  // komponen pakaian dan motif tidak dibuat karena tidak ada datanya.
  const sections: ArticleSectionLink[] = [
    { id: "sejarah", label: "Sejarah & asal-usul" },
    { id: "makna", label: "Makna & filosofi" },
    ...(usage
      ? [{ id: "penggunaan", label: "Penggunaan" } satisfies ArticleSectionLink]
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
        categorySlug="baju-adat"
      />

      <header className="mt-8 max-w-[820px]">
        <p className="eyebrow">
          {[CATEGORY_LABEL, region].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(32px,4.6vw,52px)] leading-[1.06] font-normal tracking-[-0.02em] text-ink">
          Busana yang bercerita, warisan yang membanggakan.
        </h1>
        <p className="mt-4 max-w-[640px] whitespace-pre-line text-[13.5px] leading-[1.85] text-muted">
          Pakaian adat bukan sekadar busana. Setiap helai kain menandai siapa
          kita, dari mana kita berasal, dan bagaimana masyarakat merawat tradisi
          dari generasi ke generasi.
        </p>
      </header>

      <DressVisual
        title={data.title}
        mainImage={image}
        variants={variants}
      />

      <div className="mx-auto mt-10 max-w-[720px] text-center">
        <h2 className="font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.15] font-normal text-[#7b5b3c]">
          {data.title}
        </h2>
        <p className="mt-2 text-[11.5px] text-muted">
          {region || "Indonesia"}
        </p>
        {description ? (
          <p className="mt-5 whitespace-pre-line text-left text-[13.5px] leading-[1.9] text-ink/85 sm:text-center">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mx-auto mt-12 max-w-[760px] space-y-10">
        <ArticleSection
          id="sejarah"
          index={sectionIndex("sejarah")}
          title="Sejarah & asal-usul"
        >
          {history ? (
            <BodyText>{history}</BodyText>
          ) : (
            <EmptyNote>
              Catatan sejarah dan asal-usul pakaian adat ini belum tersedia di
              basis data.
            </EmptyNote>
          )}
        </ArticleSection>

        <ArticleSection
          id="makna"
          index={sectionIndex("makna")}
          title="Makna & filosofi"
        >
          {meaning ? (
            <BodyText>{meaning}</BodyText>
          ) : (
            <EmptyNote>
              Uraian makna dan filosofi pakaian adat ini belum tersedia di basis
              data.
            </EmptyNote>
          )}
        </ArticleSection>

        {usage ? (
          <ArticleSection
            id="penggunaan"
            index={sectionIndex("penggunaan")}
            title="Penggunaan"
          >
            <BodyText>{usage}</BodyText>
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
          category="baju_adat"
          heading="Baju adat lain untuk dikenali"
        />
      </div>

      <div className="mx-auto max-w-[760px]">
        <BackToCategory href={backHref} label={backLabel} />
      </div>
    </div>
  );
}
