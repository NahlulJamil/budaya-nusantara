"use client";

import {
  Noto_Sans_Balinese,
  Noto_Sans_Javanese,
  Noto_Sans_Sundanese,
} from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  BackToCategory,
  CultureBreadcrumb,
} from "@/components/budaya/DetailParts";
import { AppImage } from "@/components/ui/AppImage";
import { AlertIcon, ArrowUpRightIcon, RefreshIcon } from "@/components/ui/icons";
import { getProvinceByName } from "@/data/provinceData";
import { resolveMediaUrl } from "@/lib/api";
import {
  AksaraApiError,
  fetchAksaraDetail,
  type AksaraCategoryItem,
  type AksaraCharacterItem,
  type AksaraDetail,
} from "@/lib/aksaraApi";

const javanese = Noto_Sans_Javanese({
  subsets: ["javanese"],
  weight: "variable",
  display: "swap",
  variable: "--font-javanese",
});

const balinese = Noto_Sans_Balinese({
  subsets: ["balinese"],
  weight: "variable",
  display: "swap",
  variable: "--font-balinese",
});

const sundanese = Noto_Sans_Sundanese({
  subsets: ["sundanese"],
  weight: "variable",
  display: "swap",
  variable: "--font-sundanese",
});

/** Font stack yang mendukung beberapa aksara daerah umum; sisanya memakai fallback serif. */
const GLYPH_FONT_STACK =
  "var(--font-javanese), var(--font-balinese), var(--font-sundanese), var(--font-serif)";

function CharacterCard({
  item,
  selected,
  onSelect,
}: {
  item: AksaraCharacterItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const glyph = item.character?.trim() ?? "";
  const image = resolveMediaUrl(item.image);
  const latin = item.latin?.trim() || "—";
  const hasDescription = Boolean(item.description?.trim());

  const content = (
    <>
      {glyph ? (
        <span
          aria-hidden="true"
          style={{ fontFamily: GLYPH_FONT_STACK }}
          className="text-[clamp(38px,6vw,54px)] leading-none text-ink"
        >
          {glyph}
        </span>
      ) : image && !imageFailed ? (
        <span className="relative block h-16 w-16">
          <AppImage
            src={image}
            alt={`Karakter ${latin}`}
            sizes="64px"
            className="object-contain"
            onError={() => setImageFailed(true)}
          />
        </span>
      ) : (
        <span aria-hidden="true" className="text-[28px] leading-none text-muted">
          —
        </span>
      )}

      <span className="text-[15px] leading-tight text-[#7b5b3c]">{latin}</span>
    </>
  );

  if (!hasDescription) {
    return (
      <li className="aspect-[4/3] rounded-[10px] border border-line/80 bg-[#fbf9f3]">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 py-4">
          {content}
        </div>
      </li>
    );
  }

  return (
    <li className="aspect-[4/3]">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Lihat penjelasan karakter ${latin}`}
        className={`focus-ring flex h-full w-full flex-col items-center justify-center gap-2 rounded-[10px] border px-3 py-4 transition-colors ${
          selected
            ? "border-[#7b5b3c]/70 bg-[#f3ecdd]"
            : "border-line/80 bg-[#fbf9f3] hover:border-[#7b5b3c]/40 hover:bg-white"
        }`}
      >
        {content}
      </button>
    </li>
  );
}

export function AksaraDetailScreen({ aksaraId }: { aksaraId: number }) {
  const [detail, setDetail] = useState<AksaraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    fetchAksaraDetail(aksaraId)
      .then((data) => {
        if (!active) {
          return;
        }
        setDetail(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }
        setError(
          cause instanceof AksaraApiError
            ? cause.message
            : "Gagal memuat detail aksara. Coba lagi.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [aksaraId, reloadKey]);

  const categories = detail?.categories ?? [];
  const activeCategory: AksaraCategoryItem | null =
    categories.find((category) => category.id === selectedCategoryId) ??
    categories[0] ??
    null;
  const characters = activeCategory?.characters ?? [];
  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ?? null;
  const image = resolveMediaUrl(detail?.main_image);
  const provinsi = detail?.daerah?.provinsi ?? null;
  const province = getProvinceByName(provinsi);
  const regionName = provinsi ?? detail?.daerah?.nama ?? null;
  const backHref = province ? `/jelajah/${province.slug}/aksara` : "/jelajah";
  const backLabel = province
    ? `Aksara ${province.name}`
    : "katalog Jelajah Indonesia";

  function selectCategory(categoryId: number): void {
    setSelectedCategoryId(categoryId);
    setSelectedCharacterId(null);
  }

  return (
    <main
      id="main"
      className={`${javanese.variable} ${balinese.variable} ${sundanese.variable} bg-[#F8F6EF] pb-20`}
    >
      <div className="shell pt-8 sm:pt-10 lg:pt-14">
        <CultureBreadcrumb
          title={null}
          provinsi={provinsi}
          categoryLabel="Aksara Daerah"
          categorySlug="aksara"
        />

        {loading ? (
          <div className="mt-8 space-y-4" aria-hidden="true">
            <div className="skeleton h-12 w-40 rounded" />
            <div className="skeleton h-4 w-full max-w-[760px] rounded" />
            <div className="skeleton h-4 w-2/3 max-w-[560px] rounded" />
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-3">
                <div className="skeleton h-9 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
              </div>
              <div className="skeleton aspect-[4/3] w-full rounded-xl" />
            </div>
            <div className="mt-14">
              <div className="skeleton mx-auto h-5 w-32 rounded" />
              <div className="skeleton mx-auto mt-2 h-8 w-56 rounded" />
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="skeleton aspect-[4/3] rounded-[10px]"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-8 max-w-[760px]">
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
            >
              <AlertIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
                className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <RefreshIcon className="h-3 w-3" />
                Coba lagi
              </button>
            </div>

            <Link
              href="/aksara"
              className="focus-ring mt-4 inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
            >
              Lihat semua materi aksara
            </Link>
          </div>
        ) : null}

        {!loading && !error && detail ? (
          <>
            <header className="mt-8 max-w-[820px]">
              <h1 className="font-serif text-[clamp(38px,5vw,56px)] leading-[1.05] font-normal tracking-[-0.02em] text-ink">
                Aksara
              </h1>
              <p className="mt-4 max-w-[760px] text-[13.5px] leading-[1.85] text-muted">
                Lebih dari sekadar goresan pena, aksara di{" "}
                {regionName ?? "berbagai daerah Indonesia"} menyimpan filosofi
                luhur tentang kehidupan manusia, alam, dan Sang Pencipta. Mari
                kenali kembali guratan warisan leluhur yang menjadi identitas
                kebangsaan Nusantara.
              </p>
            </header>

            <section
              aria-labelledby="pengenalan-aksara"
              className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12"
            >
              <div>
                <h2
                  id="pengenalan-aksara"
                  className="font-serif text-[clamp(28px,3.4vw,38px)] leading-[1.15] font-normal tracking-[-0.01em] text-ink"
                >
                  {detail.name}: Jejak Rupa, Warisan Jiwa.
                </h2>

                <div className="mt-5 space-y-4">
                  {detail.description ? (
                    <p className="whitespace-pre-line text-[14.5px] leading-[1.9] text-ink/75">
                      {detail.description}
                    </p>
                  ) : null}

                  {detail.history ? (
                    <p className="whitespace-pre-line text-[14.5px] leading-[1.9] text-ink/75">
                      {detail.history}
                    </p>
                  ) : null}

                  {!detail.description && !detail.history ? (
                    <p className="rounded-lg border border-dashed border-line bg-paper px-4 py-4 text-[12.5px] leading-[1.8] text-muted">
                      Deskripsi dan sejarah aksara ini belum tersedia di basis
                      data.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-cream-deep">
                {image ? (
                  <AppImage
                    src={image}
                    alt={`Manuskrip ${detail.name}`}
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,#e8dfcd,transparent_70%)]"
                    />
                    <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[12px] leading-[1.7] text-muted">
                      Gambar manuskrip belum tersedia.
                    </p>
                  </>
                )}
              </div>
            </section>

            <section
              aria-labelledby="pustaka-heading"
              className="mt-16 sm:mt-20"
            >
              <div className="text-center">
                <p className="eyebrow">Pustaka</p>
                <h2
                  id="pustaka-heading"
                  className="mt-2 font-serif text-[clamp(26px,3.2vw,34px)] leading-tight font-normal text-ink"
                >
                  {detail.name}
                </h2>
              </div>

              {categories.length > 1 ? (
                <div
                  role="group"
                  aria-label="Pilih kategori aksara"
                  className="mt-5 flex flex-wrap justify-center gap-2"
                >
                  {categories.map((category) => {
                    const active = activeCategory?.id === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => selectCategory(category.id)}
                        aria-pressed={active}
                        className={`focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                          active
                            ? "border-night bg-night text-[#f6f2e7]"
                            : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                        }`}
                      >
                        {category.name}
                        <span
                          className={active ? "text-[#c8c1b0]" : "text-muted"}
                        >
                          {category.characters.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {activeCategory?.description ? (
                <p className="mx-auto mt-4 max-w-[680px] text-center text-[12.5px] leading-[1.8] text-muted">
                  {activeCategory.description}
                </p>
              ) : null}

              {categories.length === 0 ? (
                <p className="mx-auto mt-6 max-w-[680px] rounded-lg border border-dashed border-line bg-paper px-5 py-8 text-center text-[12.5px] leading-[1.8] text-muted">
                  Kategori dan karakter untuk aksara ini belum tersedia di
                  basis data.
                </p>
              ) : null}

              {activeCategory && characters.length === 0 ? (
                <p className="mx-auto mt-6 max-w-[680px] rounded-lg border border-dashed border-line bg-paper px-5 py-8 text-center text-[12.5px] leading-[1.8] text-muted">
                  Belum ada karakter pada kategori ini.
                </p>
              ) : null}

              {characters.length > 0 ? (
                <ul className="mx-auto mt-6 grid max-w-[1080px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                  {characters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      item={character}
                      selected={character.id === selectedCharacterId}
                      onSelect={() =>
                        setSelectedCharacterId((current) =>
                          current === character.id ? null : character.id,
                        )
                      }
                    />
                  ))}
                </ul>
              ) : null}

              {selectedCharacter?.description ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mx-auto mt-6 flex max-w-[720px] items-start gap-4 rounded-xl border border-line bg-paper p-5"
                >
                  <span
                    aria-hidden="true"
                    style={{ fontFamily: GLYPH_FONT_STACK }}
                    className="text-[40px] leading-none text-ink"
                  >
                    {selectedCharacter.character?.trim() || "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-[20px] leading-tight text-ink">
                      {selectedCharacter.latin?.trim() || "Karakter aksara"}
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-[1.8] text-muted">
                      {selectedCharacter.description}
                    </p>
                  </div>
                </div>
              ) : null}

              {characters.length > 0 ? (
                <p className="mt-12 text-center font-serif text-[clamp(20px,2.6vw,26px)] leading-snug text-[#7b5b3c]">
                  “Merawat Huruf, Menjaga Leluhur.”
                </p>
              ) : null}
            </section>

            <section
              aria-labelledby="aksara-kuis"
              className="mt-14 flex flex-col gap-4 rounded-xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div>
                <p className="eyebrow">Uji pemahaman</p>
                <h2
                  id="aksara-kuis"
                  className="mt-1 font-serif text-[22px] leading-tight text-ink"
                >
                  Kenali {detail.name} lewat kuis
                </h2>
                <p className="mt-2 max-w-[540px] text-[12.5px] leading-[1.75] text-muted">
                  Jawaban diperiksa langsung oleh server, lengkap dengan
                  penjelasan. Kuis memerlukan akun untuk menyimpan sesi
                  jawaban.
                </p>
              </div>
              <Link
                href={`/aksara/${detail.id}/kuis`}
                className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Mulai kuis
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </section>

            <BackToCategory href={backHref} label={backLabel} />
          </>
        ) : null}
      </div>
    </main>
  );
}
