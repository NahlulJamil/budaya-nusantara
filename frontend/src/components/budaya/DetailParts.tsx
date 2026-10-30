"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AppImage } from "@/components/ui/AppImage";
import { ArrowUpRightIcon, ShareIcon } from "@/components/ui/icons";
import { getProvinceByName } from "@/data/provinceData";
import { fetchGaleriByContent, plainText, resolveMediaUrl } from "@/lib/api";
import type { GaleriPostSummary } from "@/lib/types";

export interface ArticleSectionLink {
  id: string;
  label: string;
}

/** Sorot bagian artikel yang sedang terlihat di viewport. */
export function useActiveSection(
  sections: readonly ArticleSectionLink[],
): string {
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id ?? "",
  );
  const ids = sections.map((section) => section.id).join("|");

  useEffect(() => {
    const elements = ids
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 1] },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [ids]);

  return activeSection;
}

export function CultureBreadcrumb({
  title,
  provinsi,
  categoryLabel,
  categorySlug,
}: {
  title: string | null;
  provinsi: string | null;
  categoryLabel: string;
  categorySlug: string;
}) {
  const province = getProvinceByName(provinsi);

  return (
    <nav aria-label="Breadcrumb" className="text-[11.5px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="focus-ring transition-colors hover:text-ink">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href="/jelajah"
            className="focus-ring transition-colors hover:text-ink"
          >
            Jelajah Indonesia
          </Link>
        </li>
        <li aria-hidden="true">/</li>

        {province ? (
          <>
            <li>
              <Link
                href={`/jelajah/${province.slug}`}
                className="focus-ring transition-colors hover:text-ink"
              >
                {province.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/jelajah/${province.slug}/${categorySlug}`}
                className="focus-ring transition-colors hover:text-ink"
              >
                {categoryLabel}
              </Link>
            </li>
          </>
        ) : (
          <>
            {provinsi ? (
              <>
                <li>{provinsi}</li>
                <li aria-hidden="true">/</li>
              </>
            ) : null}
            <li>{categoryLabel}</li>
          </>
        )}

        {title ? (
          <>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {title}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

export function ArticleToc({
  sections,
  activeSection,
}: {
  sections: readonly ArticleSectionLink[];
  activeSection: string;
}) {
  return (
    <>
      <p className="eyebrow">Daftar isi</p>

      <nav aria-label="Daftar isi artikel" className="mt-4">
        <ul className="border-l border-line">
          {sections.map((section) => {
            const active = activeSection === section.id;

            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active ? "true" : undefined}
                  className={`focus-ring -ml-px block border-l-2 py-2 pl-4 text-[12.5px] leading-[1.5] transition-colors ${
                    active
                      ? "border-amber font-medium text-ink"
                      : "border-transparent text-muted hover:border-line hover:text-ink"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function ArticleSection({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-28 border-t border-line pt-8 first:border-t-0 first:pt-0"
    >
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-[13px] leading-none text-amber">
          {index}
        </span>
        <h2
          id={`${id}-heading`}
          className="font-serif text-[24px] leading-tight font-normal text-ink sm:text-[28px]"
        >
          {title}
        </h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line bg-paper px-4 py-4 text-[12.5px] leading-[1.85] text-muted">
      {children}
    </p>
  );
}

export function BodyText({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line text-[13.5px] leading-[1.9] text-ink/85">
      {children}
    </p>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") {
      return;
    }

    const timer = setTimeout(() => setState("idle"), 3200);

    return () => clearTimeout(timer);
  }, [state]);

  async function handleShare(): Promise<void> {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });

        return;
      } catch {
        // Pengguna membatalkan dialog berbagi; lanjut ke salin tautan.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span role="status" aria-live="polite" className="text-[11px] text-muted">
        {state === "copied"
          ? "Tautan disalin."
          : state === "error"
            ? "Tidak dapat menyalin tautan."
            : ""}
      </span>
      <button
        type="button"
        onClick={() => {
          void handleShare();
        }}
        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
      >
        <ShareIcon className="h-3.5 w-3.5" />
        Bagikan
      </button>
    </div>
  );
}

export function DetailHero({
  eyebrow,
  title,
  description,
  image,
  region,
}: {
  eyebrow: string;
  title: string;
  description: string | null;
  image: string | null;
  region: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <header className="mt-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 max-w-[900px] font-serif text-[clamp(36px,5vw,58px)] leading-[1.03] font-normal tracking-[-0.02em] text-ink">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-[720px] whitespace-pre-line text-[14px] leading-[1.85] text-muted">
          {description}
        </p>
      ) : null}

      <div className="relative mt-7 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-cream-deep sm:aspect-[16/9]">
        {image && !imageFailed ? (
          <AppImage
            src={image}
            alt={title}
            sizes="(min-width: 1024px) 1160px, 100vw"
            className="object-cover"
            priority
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#e8dfcd,transparent_65%)]"
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-6">
        <p className="text-[11.5px] text-muted">
          {region || "Indonesia"}
        </p>

        <ShareButton title={title} />
      </div>
    </header>
  );
}

interface GalleryPhoto {
  id: string;
  src: string;
  title: string;
  caption: string | null;
}

function toPhotos(posts: GaleriPostSummary[]): GalleryPhoto[] {
  return posts.flatMap((post) =>
    (post.media ?? []).flatMap((media): GalleryPhoto[] => {
      if (media.media_type && media.media_type !== "image") {
        return [];
      }

      const src = resolveMediaUrl(media.url || media.file_path);

      if (!src) {
        return [];
      }

      return [
        {
          id: `${post.id}-${media.id}`,
          src,
          title: post.title,
          caption: plainText(post.caption),
        },
      ];
    }),
  );
}

function GallerySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="skeleton aspect-[4/3] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ContentGallery({ contentId }: { contentId: number }) {
  const [state, setState] = useState<{
    key: string;
    photos: GalleryPhoto[];
    failed: boolean;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const key = `${contentId}|${reloadKey}`;

  useEffect(() => {
    let active = true;

    fetchGaleriByContent(contentId)
      .then((posts) => {
        if (active) {
          setState({ key, photos: toPhotos(posts), failed: false });
        }
      })
      .catch(() => {
        if (active) {
          setState({ key, photos: [], failed: true });
        }
      });

    return () => {
      active = false;
    };
  }, [contentId, key]);

  const current = state?.key === key ? state : null;
  const photos = current?.photos ?? null;
  const failed = current?.failed ?? false;

  return (
    <>
      {photos === null ? <GallerySkeleton /> : null}

      {photos !== null && failed ? (
        <div className="rounded-lg border border-dashed border-line bg-paper px-4 py-4">
          <p className="text-[12.5px] leading-[1.85] text-muted">
            Galeri foto konten ini gagal dimuat.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="focus-ring mt-2 inline-flex h-8 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {photos !== null && !failed && photos.length === 0 ? (
        <EmptyNote>
          Belum ada foto galeri yang dipublikasikan untuk konten ini.
        </EmptyNote>
      ) : null}

      {photos !== null && !failed && photos.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id}>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line/80 bg-cream-deep">
                  <AppImage
                    src={photo.src}
                    alt={photo.caption ?? photo.title}
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-[11px] leading-[1.6] text-muted">
                  {photo.caption ?? photo.title}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function ChatbotCta({ contentId }: { contentId: number }) {
  return (
    <section
      aria-labelledby="tanya-budaya-heading"
      className="mt-14 flex flex-col gap-4 rounded-xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
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
          Lanjutkan dengan asisten budaya dan jadikan detail konten ini sebagai
          konteks percakapan.
        </p>
      </div>
      <Link
        href={`/chatbot?content_id=${contentId}`}
        className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
      >
        Tanya Kanca Budaya
        <ArrowUpRightIcon className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

export function BackToCategory({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="mt-8">
      <Link
        href={href}
        className="focus-ring inline-flex h-10 items-center rounded-full border border-line bg-paper px-4 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
      >
        ← Kembali ke {label}
      </Link>
    </div>
  );
}
