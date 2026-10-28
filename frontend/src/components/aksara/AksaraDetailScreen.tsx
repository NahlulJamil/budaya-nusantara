"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppImage } from "@/components/ui/AppImage";
import { AlertIcon, ArrowUpRightIcon, RefreshIcon } from "@/components/ui/icons";
import { resolveMediaUrl } from "@/lib/api";
import {
  AksaraApiError,
  fetchAksaraDetail,
  type AksaraDetail,
  type AksaraCategoryItem,
} from "@/lib/aksaraApi";

function CharacterCard({
  item,
}: {
  item: AksaraCategoryItem["characters"][number];
}) {
  const image = resolveMediaUrl(item.image);

  return (
    <li className="flex h-full flex-col overflow-hidden rounded-[10px] border border-line/80 bg-paper">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-cream-deep">
        {image ? (
          <div className="relative h-full w-full">
            <AppImage
              src={image}
              alt={`Aksara ${item.latin ?? item.character}`}
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-3"
            />
          </div>
        ) : (
          <span
            aria-hidden="true"
            className="font-serif text-[clamp(38px,7vw,54px)] leading-none text-ink"
          >
            {item.character}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-[14px] font-medium text-ink">
          {item.latin ?? "—"}
        </p>
        {item.description ? (
          <p className="text-[11.5px] leading-[1.65] text-muted">
            {item.description}
          </p>
        ) : null}
      </div>
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
  const activeCategory =
    categories.find((category) => category.id === selectedCategoryId) ??
    categories[0] ??
    null;
  const image = resolveMediaUrl(detail?.main_image);
  const region = detail?.daerah?.provinsi ?? detail?.daerah?.nama ?? null;

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-10 sm:pt-12 lg:pt-16">
        <Link
          href="/aksara"
          className="focus-ring inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          ← Semua materi aksara
        </Link>

        {loading ? (
          <div className="mt-6 space-y-4" aria-hidden="true">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-12 w-2/3 rounded" />
            <div className="skeleton h-24 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton aspect-square rounded-[10px]" />
              ))}
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div
            role="alert"
            className="mt-8 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
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
        ) : null}

        {!loading && !error && detail ? (
          <>
            <header className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div>
                {region ? <p className="eyebrow">{region}</p> : null}
                <h1 className="mt-2 font-serif text-[clamp(34px,4.4vw,52px)] leading-[1.06] font-normal tracking-[-0.02em] text-ink">
                  {detail.name}
                </h1>
                {detail.description ? (
                  <p className="mt-4 max-w-[620px] text-[13.5px] leading-[1.85] text-muted">
                    {detail.description}
                  </p>
                ) : null}
              </div>

              {image ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-cream-deep">
                  <AppImage
                    src={image}
                    alt={detail.name}
                    sizes="(min-width: 1024px) 320px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </header>

            {detail.history ? (
              <section aria-labelledby="aksara-sejarah" className="mt-10">
                <h2
                  id="aksara-sejarah"
                  className="font-serif text-[22px] leading-tight text-ink"
                >
                  Sejarah singkat
                </h2>
                <p className="mt-3 max-w-[760px] text-[13px] leading-[1.85] text-muted">
                  {detail.history}
                </p>
              </section>
            ) : null}

            <section aria-labelledby="aksara-materi" className="mt-12">
              <h2
                id="aksara-materi"
                className="font-serif text-[clamp(24px,2.6vw,30px)] leading-tight text-ink"
              >
                Materi aksara
              </h2>

              {categories.length === 0 ? (
                <p className="mt-5 rounded-lg border border-dashed border-line bg-paper px-5 py-10 text-center text-[12.5px] leading-[1.8] text-muted">
                  Kategori dan karakter untuk aksara ini belum tersedia.
                </p>
              ) : (
                <>
                  <div
                    role="group"
                    aria-label="Pilih kategori aksara"
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {categories.map((category) => {
                      const active = activeCategory?.id === category.id;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(category.id)}
                          aria-pressed={active}
                          className={`focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                            active
                              ? "border-night bg-night text-[#f6f2e7]"
                              : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                          }`}
                        >
                          {category.name}
                          <span
                            className={
                              active ? "text-[#c8c1b0]" : "text-muted"
                            }
                          >
                            {category.characters.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeCategory ? (
                    <div className="mt-5">
                      {activeCategory.description ? (
                        <p className="max-w-[680px] text-[12.5px] leading-[1.8] text-muted">
                          {activeCategory.description}
                        </p>
                      ) : null}

                      {activeCategory.characters.length === 0 ? (
                        <p className="mt-4 rounded-lg border border-dashed border-line bg-paper px-5 py-8 text-center text-[12.5px] text-muted">
                          Belum ada karakter pada kategori ini.
                        </p>
                      ) : (
                        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                          {activeCategory.characters.map((character) => (
                            <CharacterCard key={character.id} item={character} />
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <section
              aria-labelledby="aksara-kuis"
              className="mt-12 flex flex-col gap-4 rounded-xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div>
                <h2
                  id="aksara-kuis"
                  className="font-serif text-[22px] leading-tight text-ink"
                >
                  Uji pemahamanmu
                </h2>
                <p className="mt-2 max-w-[520px] text-[12.5px] leading-[1.75] text-muted">
                  Kerjakan kuis singkat untuk aksara {detail.name}. Jawaban
                  diperiksa langsung oleh server, lengkap dengan penjelasan.
                  Kuis memerlukan akun untuk menyimpan sesi jawaban.
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
          </>
        ) : null}
      </div>
    </main>
  );
}
