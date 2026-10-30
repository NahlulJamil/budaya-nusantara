"use client";

import { useState } from "react";
import Link from "next/link";

import { AppImage } from "@/components/ui/AppImage";
import { ArrowUpRightIcon } from "@/components/ui/icons";

export interface CategoryContentItem {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  region: string;
  meta: string;
  href: string;
}

export function CategoryContentCard({ item }: { item: CategoryContentItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.image) && !imageFailed;
  const label = [item.region, item.meta].filter(Boolean).join(" · ");

  return (
    <article className="h-full">
      <Link
        href={item.href}
        className="focus-ring group flex h-full flex-col overflow-hidden rounded-xl border border-line/70 bg-paper transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(23,21,15,0.35)]"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-deep">
          {showImage && item.image ? (
            <AppImage
              src={item.image}
              alt={item.title}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#e8dfcd,transparent_65%)]"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
            {label}
          </p>

          <h2 className="mt-2 font-serif text-[22px] leading-tight font-normal text-ink">
            {item.title}
          </h2>

          {item.description ? (
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.7] text-muted">
              {item.description}
            </p>
          ) : null}

          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] font-semibold text-ink">
            Baca selengkapnya
            <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}
