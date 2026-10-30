"use client";

import { useEffect, useState } from "react";

import { AppImage } from "@/components/ui/AppImage";
import {
  DownloadIcon,
  MinusIcon,
  PlusIcon,
  ResetIcon,
  ShareIcon,
} from "@/components/ui/icons";
import { resolveMediaUrl } from "@/lib/api";
import type { CultureVariant } from "@/lib/cultureApi";

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

function genderLabel(value: string): string {
  if (value === "pria") {
    return "Pria";
  }
  if (value === "wanita") {
    return "Wanita";
  }

  return value;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "pakaian-adat";
}

function fileExtension(type: string): string {
  const extension = type.split("/")[1];

  return extension && extension.length <= 5 ? extension : "jpg";
}

interface DressVisualProps {
  title: string;
  mainImage: string | null;
  variants: CultureVariant[];
}

export function DressVisual({ title, mainImage, variants }: DressVisualProps) {
  const usableVariants = variants.filter((variant) =>
    Boolean(resolveMediaUrl(variant.avatar_image)),
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    usableVariants[0]?.id ?? null,
  );
  const [scale, setScale] = useState(1);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selected =
    usableVariants.find((variant) => variant.id === selectedId) ?? null;
  const image =
    resolveMediaUrl(selected?.avatar_image) ?? resolveMediaUrl(mainImage);
  const showImage = Boolean(image) && failedSrc !== image;
  const hasVariantChoice = usableVariants.length > 1;

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = setTimeout(() => setStatus(null), 4000);

    return () => clearTimeout(timer);
  }, [status]);

  function selectVariant(variantId: number): void {
    setSelectedId(variantId);
    setScale(MIN_SCALE);
    setStatus(null);
  }

  function resetView(): void {
    setScale(MIN_SCALE);
    setSelectedId(usableVariants[0]?.id ?? null);
    setStatus(null);
  }

  async function handleDownload(): Promise<void> {
    if (!image) {
      return;
    }

    const base = `${slugify(title)}${selected ? `-${selected.gender}` : ""}`;

    try {
      const response = await fetch(image);

      if (!response.ok) {
        throw new Error("Gagal mengunduh gambar.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `${base}.${fileExtension(blob.type)}`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setStatus("Gambar diunduh.");
    } catch {
      // Gambar lintas origin bisa memblokir fetch; buka agar tetap bisa disimpan.
      window.open(image, "_blank", "noopener,noreferrer");
      setStatus("Gambar dibuka di tab baru. Simpan lewat menu browser.");
    }
  }

  async function handleShare(): Promise<void> {
    const pageUrl = window.location.href;
    const shareTitle = `${title} · Galeri Budaya`;

    setStatus(null);

    if (
      image &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    ) {
      try {
        const response = await fetch(image);

        if (response.ok) {
          const blob = await response.blob();
          const file = new File(
            [blob],
            `${slugify(title)}.${fileExtension(blob.type)}`,
            { type: blob.type || "image/jpeg" },
          );

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: shareTitle });

            return;
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, url: pageUrl });

        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(pageUrl);
      setStatus("Tautan halaman disalin.");
    } catch {
      setStatus("Tidak dapat membagikan gambar atau tautan.");
    }
  }

  return (
    <section aria-label="Tampilan pakaian adat" className="relative mt-8">
      <div className="mx-auto flex max-w-[760px] flex-col items-center">
        <div className="relative h-[360px] w-full overflow-hidden sm:h-[460px] lg:h-[540px]">
          {showImage && image ? (
            <div
              className="relative h-full w-full transition-transform duration-200 ease-out"
              style={{ transform: `scale(${scale})` }}
            >
              <AppImage
                src={image}
                alt={`${title}${selected ? ` — varian ${genderLabel(selected.gender)}` : ""}`}
                sizes="(min-width: 1024px) 760px, 100vw"
                className="object-contain"
                onError={() => setFailedSrc(image)}
              />
            </div>
          ) : (
            <div className="relative h-full w-full">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#e8dfcd,transparent_70%)]"
              />
              <p className="absolute inset-0 flex items-center justify-center text-[12px] text-muted">
                Gambar pakaian adat belum tersedia.
              </p>
            </div>
          )}
        </div>

        {showImage && image ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={resetView}
              aria-label="Kembalikan tampilan ke kondisi awal"
              title="Kembalikan tampilan"
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-cream-deep/60 text-ink transition-colors hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ResetIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() =>
                setScale((value) =>
                  Math.min(MAX_SCALE, Math.round((value + SCALE_STEP) * 100) / 100),
                )
              }
              disabled={scale >= MAX_SCALE}
              aria-label="Perbesar gambar"
              title="Perbesar"
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-cream-deep/60 text-ink transition-colors hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() =>
                setScale((value) =>
                  Math.max(MIN_SCALE, Math.round((value - SCALE_STEP) * 100) / 100),
                )
              }
              disabled={scale <= MIN_SCALE}
              aria-label="Perkecil gambar"
              title="Perkecil"
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-cream-deep/60 text-ink transition-colors hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MinusIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : null}

        <p
          role="status"
          aria-live="polite"
          className="mt-3 min-h-[1.1em] text-center text-[11.5px] text-muted"
        >
          {status ?? ""}
        </p>

        {selected ? (
          <p className="text-center text-[11.5px] text-muted">
            Varian {genderLabel(selected.gender)}
            {selected.description ? ` · ${selected.description}` : ""}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:absolute lg:top-4 lg:right-0 lg:mt-0 lg:flex-col lg:items-end">
        {hasVariantChoice ? (
          <div
            role="group"
            aria-label="Pilih varian pakaian"
            className="flex items-center gap-1.5 rounded-xl border border-line bg-paper p-1.5 shadow-[0_10px_30px_-20px_rgba(23,21,15,0.45)]"
          >
            {usableVariants.map((variant) => {
              const active = variant.id === selectedId;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  aria-pressed={active}
                  className={`focus-ring rounded-lg px-4 py-2 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-night text-[#f6f2e7]"
                      : "text-ink hover:bg-cream"
                  }`}
                >
                  {genderLabel(variant.gender)}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-paper p-1.5 shadow-[0_10px_30px_-20px_rgba(23,21,15,0.45)]">
          {image ? (
            <button
              type="button"
              onClick={() => {
                void handleDownload();
              }}
              aria-label="Unduh gambar pakaian adat"
              title="Unduh gambar"
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-cream"
            >
              <DownloadIcon className="h-[18px] w-[18px]" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            aria-label="Bagikan gambar pakaian adat"
            title="Bagikan"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-cream"
          >
            <ShareIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </section>
  );
}
