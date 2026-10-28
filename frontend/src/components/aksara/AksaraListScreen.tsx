"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppImage } from "@/components/ui/AppImage";
import {
  AlertIcon,
  ArrowUpRightIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { resolveMediaUrl } from "@/lib/api";
import {
  AksaraApiError,
  fetchAksaraList,
  type AksaraSummary,
} from "@/lib/aksaraApi";

function AksaraListSkeleton() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[10px] border border-line/80 bg-paper"
        >
          <div className="skeleton aspect-[16/10] w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-5 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AksaraListScreen() {
  const [items, setItems] = useState<AksaraSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetchAksaraList()
      .then((data) => {
        if (!active) {
          return;
        }
        setItems(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }
        setError(
          cause instanceof AksaraApiError
            ? cause.message
            : "Gagal memuat materi aksara. Coba lagi.",
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
  }, [reloadKey]);

  return (
    <main id="main" className="pb-20">
      <section className="shell pt-14 sm:pt-16 lg:pt-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[620px]">
            <p className="eyebrow">Belajar Aksara</p>
            <h1 className="mt-3 font-serif text-[clamp(34px,4.4vw,54px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
              Mengenal aksara daerah, aksara demi aksara.
            </h1>
            <p className="mt-4 max-w-[560px] text-[13px] leading-[1.8] text-muted">
              Pelajari bentuk, bacaan, dan kategori aksara dari berbagai daerah
              di Indonesia. Setelah membaca materinya, uji pemahamanmu lewat
              kuis singkat.
            </p>
          </div>

          <Link
            href="/kuis"
            className="focus-ring inline-flex h-10 w-fit items-center gap-2 rounded-md border border-line bg-paper px-4 text-[12px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
          >
            Ke halaman kuis
            <ArrowUpRightIcon className="h-3 w-3" />
          </Link>
        </div>

        {loading ? <AksaraListSkeleton /> : null}

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

        {!loading && !error && items.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-line bg-paper px-5 py-12 text-center text-[13px] leading-[1.8] text-muted">
            Belum ada materi aksara yang dipublikasikan. Materi akan tampil di
            sini setelah ditambahkan melalui panel admin.
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const image = resolveMediaUrl(item.main_image);
              const region =
                item.daerah?.provinsi ?? item.daerah?.nama ?? null;

              return (
                <article key={item.id} className="h-full">
                  <Link
                    href={`/aksara/${item.id}`}
                    className="focus-ring group flex h-full flex-col overflow-hidden rounded-[10px] border border-line/80 bg-paper transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(23,21,15,0.35)]"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-deep">
                      {image ? (
                        <AppImage
                          src={image}
                          alt={item.name}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#e8dfcd,transparent_65%)]"
                        />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
                      {region ? (
                        <p className="text-[10.5px] font-medium tracking-[0.13em] text-muted uppercase">
                          {region}
                        </p>
                      ) : null}

                      <h2 className="mt-1.5 font-serif text-[23px] leading-tight font-normal text-ink">
                        {item.name}
                      </h2>

                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] font-semibold text-ink">
                        Pelajari aksara
                        <ArrowUpRightIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
