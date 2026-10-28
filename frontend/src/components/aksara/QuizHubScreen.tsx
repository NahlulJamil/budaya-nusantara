"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AlertIcon, ArrowUpRightIcon, RefreshIcon } from "@/components/ui/icons";
import {
  AksaraApiError,
  fetchAksaraList,
  type AksaraSummary,
} from "@/lib/aksaraApi";

export function QuizHubScreen() {
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
            : "Gagal memuat daftar aksara. Coba lagi.",
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
        <div className="max-w-[660px]">
          <p className="eyebrow">Kuis Aksara</p>
          <h1 className="mt-3 font-serif text-[clamp(34px,4.4vw,54px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
            Seberapa kenal kamu dengan aksara daerah?
          </h1>
          <p className="mt-4 text-[13px] leading-[1.8] text-muted">
            Pilih aksara untuk memulai kuis. Setiap jawaban diperiksa langsung
            oleh server, lengkap dengan jawaban benar dan penjelasannya.
            Riwayat pengerjaan tidak ditampilkan di halaman ini.
          </p>
          <p className="mt-3 text-[11.5px] leading-[1.7] text-muted">
            Untuk menjawab, kamu perlu masuk ke akun.{" "}
            <Link
              href="/galeri#masuk"
              className="focus-ring font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Masuk di halaman Galeri
            </Link>{" "}
            atau{" "}
            <Link
              href="/registrasi"
              className="focus-ring font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              buat akun baru
            </Link>
            .
          </p>
        </div>

        {loading ? (
          <div className="mt-8 space-y-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="skeleton h-20 w-full rounded-xl"
              />
            ))}
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

        {!loading && !error && items.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-line bg-paper px-5 py-12 text-center text-[13px] leading-[1.8] text-muted">
            Belum ada aksara yang bisa dikerjakan. Materi aksara dan soal kuis
            akan tampil di sini setelah ditambahkan melalui panel admin.
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {items.map((item) => {
              const region = item.daerah?.provinsi ?? item.daerah?.nama ?? null;

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div>
                    <p className="text-[10.5px] font-medium tracking-[0.13em] text-muted uppercase">
                      {region ?? "Aksara daerah"}
                    </p>
                    <h2 className="mt-1 font-serif text-[21px] leading-tight text-ink">
                      {item.name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/aksara/${item.id}`}
                      className="focus-ring inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                    >
                      Baca materi
                    </Link>
                    <Link
                      href={`/aksara/${item.id}/kuis`}
                      className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                    >
                      Mulai kuis
                      <ArrowUpRightIcon className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
