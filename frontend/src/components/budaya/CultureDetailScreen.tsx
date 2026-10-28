"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AppImage } from "@/components/ui/AppImage";
import {
  AlertIcon,
  ArrowUpRightIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { CATEGORY_LABELS, resolveMediaUrl } from "@/lib/api";
import {
  CultureApiError,
  fetchCultureDetail,
  type CultureDetailItem,
} from "@/lib/cultureApi";

function clean(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}

function genderLabel(value: string): string {
  if (value === "pria") {
    return "Pria";
  }
  if (value === "wanita") {
    return "Wanita";
  }

  return value;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-[10.5px] font-medium tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-[13px] leading-[1.8] text-ink">
        {value}
      </dd>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 rounded-xl border border-line bg-paper p-5 sm:p-6">
      <h2 className="font-serif text-[22px] leading-tight text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailSheet({ data }: { data: CultureDetailItem }) {
  const detail = data.detail;

  if (!detail) {
    return null;
  }

  const process = clean(detail.process);
  const values = clean(detail.values);
  const implementationTime = clean(detail.implementation_time);
  const jenisTradisi = clean(detail.jenis_tradisi?.nama);
  const usage = clean(detail.usage);
  const ingredients = clean(detail.ingredients);
  const recipe = clean(detail.recipe);
  const servingMethod = clean(detail.serving_method);
  const material = clean(detail.material);
  const howToPlay = clean(detail.how_to_play);
  const func = clean(detail.function);
  const audio = clean(detail.audio);
  const audioUrl = resolveMediaUrl(audio);
  const variants = (detail.variants ?? []).filter(
    (variant) => variant.gender || variant.description || variant.avatar_image,
  );

  if (data.category === "tradisi") {
    if (!process && !values && !implementationTime && !jenisTradisi) {
      return null;
    }

    return (
      <SectionCard title="Detail tradisi">
        <dl>
          {jenisTradisi ? (
            <InfoRow label="Jenis tradisi" value={jenisTradisi} />
          ) : null}
          {process ? <InfoRow label="Proses" value={process} /> : null}
          {values ? <InfoRow label="Nilai yang terkandung" value={values} /> : null}
          {implementationTime ? (
            <InfoRow label="Waktu pelaksanaan" value={implementationTime} />
          ) : null}
        </dl>
      </SectionCard>
    );
  }

  if (data.category === "baju_adat") {
    if (!usage && variants.length === 0) {
      return null;
    }

    return (
      <SectionCard title="Detail pakaian adat">
        {usage ? (
          <dl>
            <InfoRow label="Penggunaan" value={usage} />
          </dl>
        ) : null}

        {variants.length > 0 ? (
          <div className={usage ? "mt-6" : ""}>
            <h3 className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
              Varian
            </h3>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {variants.map((variant) => {
                const avatar = resolveMediaUrl(variant.avatar_image);
                const description = clean(variant.description);

                return (
                  <li
                    key={variant.id}
                    className="overflow-hidden rounded-lg border border-line bg-cream/50"
                  >
                    {avatar ? (
                      <div className="relative aspect-[4/3] w-full bg-cream-deep">
                        <AppImage
                          src={avatar}
                          alt={`Varian ${genderLabel(variant.gender)}`}
                          sizes="(min-width: 640px) 40vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <p className="text-[12.5px] font-medium text-ink">
                        {genderLabel(variant.gender)}
                      </p>
                      {description ? (
                        <p className="mt-1.5 whitespace-pre-line text-[12px] leading-[1.75] text-muted">
                          {description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </SectionCard>
    );
  }

  if (data.category === "makanan") {
    if (!ingredients && !recipe && !servingMethod) {
      return null;
    }

    return (
      <SectionCard title="Detail makanan">
        <dl>
          {ingredients ? (
            <InfoRow label="Bahan-bahan" value={ingredients} />
          ) : null}
          {recipe ? <InfoRow label="Resep / pengolahan" value={recipe} /> : null}
          {servingMethod ? (
            <InfoRow label="Cara penyajian" value={servingMethod} />
          ) : null}
        </dl>
      </SectionCard>
    );
  }

  if (data.category === "alat_musik") {
    if (!material && !howToPlay && !func && !audioUrl) {
      return null;
    }

    return (
      <SectionCard title="Detail alat musik">
        <dl>
          {material ? <InfoRow label="Bahan" value={material} /> : null}
          {howToPlay ? (
            <InfoRow label="Cara memainkan" value={howToPlay} />
          ) : null}
          {func ? <InfoRow label="Fungsi" value={func} /> : null}
        </dl>

        {audioUrl ? (
          <div className="mt-4">
            <p className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
              Audio
            </p>
            <audio
              controls
              preload="none"
              src={audioUrl ?? undefined}
              className="mt-2 w-full"
            >
              Browser tidak mendukung pemutar audio.
            </audio>
          </div>
        ) : null}
      </SectionCard>
    );
  }

  return null;
}

export function CultureDetailScreen({ cultureId }: { cultureId: number }) {
  const [state, setState] = useState<{
    key: string;
    data?: CultureDetailItem;
    error?: string;
    status?: number;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const key = `${cultureId}|${reloadKey}`;

  useEffect(() => {
    let active = true;

    fetchCultureDetail(cultureId)
      .then((data) => {
        if (active) {
          setState({ key, data });
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setState({
          key,
          error:
            cause instanceof CultureApiError
              ? cause.message
              : "Gagal memuat detail budaya. Coba lagi.",
          status: cause instanceof CultureApiError ? cause.status : 0,
        });
      });

    return () => {
      active = false;
    };
  }, [cultureId, key]);

  const loading = state === null || state.key !== key;
  const data = loading ? undefined : state?.data;
  const error = loading ? null : state?.error;
  const notFound = !loading && state?.status === 404;

  const description = clean(data?.description);
  const history = clean(data?.history);
  const meaning = clean(data?.meaning);
  const image = resolveMediaUrl(data?.main_image);
  const sources = (data?.sources ?? []).filter(
    (source) => clean(source.title) || clean(source.source_url),
  );
  const region = data?.daerah
    ? [data.daerah.nama, data.daerah.provinsi].filter(Boolean).join(" · ")
    : null;

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-10 sm:pt-12 lg:pt-16">
        <Link
          href="/jelajah"
          className="focus-ring inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          ← Kembali ke katalog
        </Link>

        {loading ? (
          <div className="mt-6 space-y-4" aria-hidden="true">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-12 w-2/3 rounded" />
            <div className="skeleton aspect-[16/9] w-full max-w-[720px] rounded-xl" />
            <div className="skeleton h-24 w-full rounded-lg" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-8">
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
            >
              <AlertIcon className="h-4 w-4 shrink-0" />
              <span>
                {notFound
                  ? "Konten budaya ini tidak ditemukan atau belum dipublikasikan."
                  : error}
              </span>
              {!notFound ? (
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <RefreshIcon className="h-3 w-3" />
                  Coba lagi
                </button>
              ) : null}
            </div>

            <Link
              href="/jelajah"
              className="focus-ring mt-4 inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
            >
              Lihat konten lain
            </Link>
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <header className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div>
                <p className="eyebrow">
                  {[CATEGORY_LABELS[data.category], region]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h1 className="mt-3 font-serif text-[clamp(34px,4.6vw,54px)] leading-[1.06] font-normal tracking-[-0.02em] text-ink">
                  {data.title}
                </h1>
                {description ? (
                  <p className="mt-4 max-w-[640px] whitespace-pre-line text-[13.5px] leading-[1.85] text-muted">
                    {description}
                  </p>
                ) : null}
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-cream-deep">
                {image ? (
                  <AppImage
                    src={image}
                    alt={data.title}
                    sizes="(min-width: 1024px) 360px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#e8dfcd,transparent_65%)]"
                  />
                )}
              </div>
            </header>

            <section
              aria-labelledby="tanya-budaya-heading"
              className="mt-9 flex flex-col gap-4 rounded-xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div>
                <p className="eyebrow">Kanca Budaya</p>
                <h2
                  id="tanya-budaya-heading"
                  className="mt-1 font-serif text-[22px] leading-tight text-ink"
                >
                  Tanyakan tentang budaya ini
                </h2>
                <p className="mt-2 max-w-[540px] text-[12.5px] leading-[1.75] text-muted">
                  Lanjutkan dengan asisten budaya dan jadikan detail konten ini
                  sebagai konteks percakapan.
                </p>
              </div>
              <Link
                href={`/chatbot?content_id=${data.id}`}
                className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Tanya Kanca Budaya
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </section>

            {history ? (
              <SectionCard title="Sejarah">
                <p className="whitespace-pre-line text-[13px] leading-[1.85] text-muted">
                  {history}
                </p>
              </SectionCard>
            ) : null}

            {meaning ? (
              <SectionCard title="Makna">
                <p className="whitespace-pre-line text-[13px] leading-[1.85] text-muted">
                  {meaning}
                </p>
              </SectionCard>
            ) : null}

            <DetailSheet data={data} />

            {sources.length > 0 ? (
              <SectionCard title="Sumber">
                <ul className="space-y-4">
                  {sources.map((source) => {
                    const title = clean(source.title);
                    const author = clean(source.author);
                    const note = clean(source.description);

                    return (
                      <li key={source.id}>
                        {source.source_url ? (
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="focus-ring inline-flex items-center gap-1.5 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
                          >
                            {title ?? source.source_url}
                            <ArrowUpRightIcon className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-[13px] font-medium text-ink">
                            {title ?? "Sumber"}
                          </p>
                        )}
                        {author ? (
                          <p className="mt-1 text-[11.5px] text-muted">
                            {author}
                          </p>
                        ) : null}
                        {note ? (
                          <p className="mt-1 max-w-[680px] text-[12px] leading-[1.75] text-muted">
                            {note}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            ) : null}

            <div className="mt-10">
              <Link
                href="/jelajah"
                className="focus-ring inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                ← Kembali ke katalog
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
