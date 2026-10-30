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
import { InfoIcon } from "@/components/ui/icons";
import { getCategoryBySlug } from "@/data/budayaCategories";
import { getProvinceByName } from "@/data/provinceData";
import { plainText, resolveMediaUrl } from "@/lib/api";
import type { CultureDetailItem } from "@/lib/cultureApi";

const SECTIONS: ArticleSectionLink[] = [
  { id: "mengenal", label: "Mengenal tradisi" },
  { id: "sejarah", label: "Sejarah & perjalanan" },
  { id: "makna", label: "Makna dalam kebersamaan" },
  { id: "galeri", label: "Galeri foto" },
];

const CATEGORY_LABEL = getCategoryBySlug("tradisi")?.label ?? "Tradisi Daerah";

export function TraditionDetail({ data }: { data: CultureDetailItem }) {
  const activeSection = useActiveSection(SECTIONS);

  const description = plainText(data.description);
  const history = plainText(data.history);
  const meaning = plainText(data.meaning);
  const process = plainText(data.detail?.process);
  const values = plainText(data.detail?.values);
  const implementationTime = plainText(data.detail?.implementation_time);
  const jenisTradisi = plainText(data.detail?.jenis_tradisi?.nama);
  const image = resolveMediaUrl(data.main_image);

  const provinsi = data.daerah?.provinsi ?? null;
  const province = getProvinceByName(provinsi);
  const region = [data.daerah?.nama, data.daerah?.provinsi]
    .filter(Boolean)
    .join(" · ");
  const backHref = province ? `/jelajah/${province.slug}/tradisi` : "/jelajah";
  const backLabel = province
    ? `${CATEGORY_LABEL} ${province.name}`
    : "katalog Jelajah Indonesia";
  const hasCultureNote = Boolean(implementationTime || jenisTradisi);

  return (
    <div className="shell pt-8 sm:pt-10 lg:pt-14">
      <CultureBreadcrumb
        title={data.title}
        provinsi={provinsi}
        categoryLabel={CATEGORY_LABEL}
        categorySlug="tradisi"
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
          <ArticleToc sections={SECTIONS} activeSection={activeSection} />

          {hasCultureNote ? (
            <div className="mt-8 rounded-xl border border-line bg-cream-deep/50 p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
                <InfoIcon className="h-3.5 w-3.5" />
                Catatan budaya
              </p>

              <dl className="mt-3 space-y-3">
                {jenisTradisi ? (
                  <div>
                    <dt className="text-[10.5px] tracking-[0.08em] text-muted uppercase">
                      Jenis tradisi
                    </dt>
                    <dd className="mt-0.5 text-[12.5px] leading-[1.7] text-ink">
                      {jenisTradisi}
                    </dd>
                  </div>
                ) : null}
                {implementationTime ? (
                  <div>
                    <dt className="text-[10.5px] tracking-[0.08em] text-muted uppercase">
                      Waktu pelaksanaan
                    </dt>
                    <dd className="mt-0.5 text-[12.5px] leading-[1.7] text-ink">
                      {implementationTime}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </aside>

        <article className="min-w-0 space-y-10">
          <ArticleSection id="mengenal" index="01" title="Mengenal tradisi">
            {process ? (
              <>
                <p className="eyebrow">Rangkaian &amp; pelaksanaan</p>
                <div className="mt-2">
                  <BodyText>{process}</BodyText>
                </div>
              </>
            ) : (
              <EmptyNote>
                Uraian rangkaian tradisi ini belum tersedia di basis data.
                Informasi yang tercatat saat ini hanya ringkasan di bagian atas
                artikel.
              </EmptyNote>
            )}
          </ArticleSection>

          <ArticleSection id="sejarah" index="02" title="Sejarah & perjalanan">
            {history ? (
              <BodyText>{history}</BodyText>
            ) : (
              <EmptyNote>
                Catatan sejarah tradisi ini belum tersedia di basis data.
              </EmptyNote>
            )}
          </ArticleSection>

          <ArticleSection
            id="makna"
            index="03"
            title="Makna dalam kebersamaan"
          >
            {meaning || values ? (
              <div className="space-y-5">
                {meaning ? <BodyText>{meaning}</BodyText> : null}

                {values ? (
                  <div className="rounded-xl border border-line bg-paper p-4">
                    <p className="eyebrow">Nilai yang dijaga</p>
                    <p className="mt-2 whitespace-pre-line text-[13px] leading-[1.85] text-ink/85">
                      {values}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyNote>
                Uraian makna dan nilai tradisi ini belum tersedia di basis data.
              </EmptyNote>
            )}
          </ArticleSection>

          <ArticleSection id="galeri" index="04" title="Galeri foto">
            <ContentGallery contentId={data.id} />
          </ArticleSection>
        </article>
      </div>

      <ChatbotCta contentId={data.id} />

      <RelatedCultures
        contentId={data.id}
        provinsi={provinsi}
        category="tradisi"
        heading="Tradisi lain untuk dikenali"
      />

      <BackToCategory href={backHref} label={backLabel} />
    </div>
  );
}
