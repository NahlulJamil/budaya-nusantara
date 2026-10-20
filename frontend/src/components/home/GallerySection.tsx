import Link from "next/link";

import { GallerySkeleton } from "@/components/home/HomeSkeletons";
import { PreviewNote } from "@/components/home/PreviewNote";
import { AppImage } from "@/components/ui/AppImage";
import { OutlineLink } from "@/components/ui/OutlineLink";
import type { PreviewReason } from "@/hooks/useHomeData";
import type { HomeGalleryItem } from "@/lib/types";

interface GallerySectionProps {
  items: HomeGalleryItem[];
  loading: boolean;
  preview: boolean;
  reason: PreviewReason;
  onRetry: () => void;
}

export function GallerySection({
  items,
  loading,
  preview,
  reason,
  onRetry,
}: GallerySectionProps) {
  return (
    <section
      aria-labelledby="galeri-heading"
      className="pt-16 pb-20 sm:pt-20 lg:pt-24 lg:pb-28"
    >
      <div className="shell">
        <p className="eyebrow">Galeri Budaya Indonesia</p>
        <h2
          id="galeri-heading"
          className="mt-2.5 font-serif text-[clamp(31px,3.5vw,44px)] leading-[1.1] font-normal tracking-[-0.015em] text-ink"
        >
          Indonesia, dari sudut pandangmu.
        </h2>

        {loading ? (
          <GallerySkeleton />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-label={`Lihat galeri: ${item.title}`}
                className="focus-ring group relative aspect-[1.45] overflow-hidden rounded-lg bg-cream-deep"
              >
                <AppImage
                  src={item.image}
                  alt={item.title}
                  loading="eager"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-[12px] font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[420px] text-[11px] leading-[1.65] text-muted">
            Intip pilihan galeri publik. Masuk untuk melihat galeri lengkap dan
            membagikan dokumentasimu.
          </p>
          <OutlineLink href="/galeri">Lihat preview Galeri</OutlineLink>
        </div>

        {!loading && preview ? (
          <PreviewNote reason={reason} onRetry={onRetry} />
        ) : null}
      </div>
    </section>
  );
}
