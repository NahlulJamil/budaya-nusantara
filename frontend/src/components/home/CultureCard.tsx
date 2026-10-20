import Link from "next/link";

import { AppImage } from "@/components/ui/AppImage";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { CATEGORY_LABELS } from "@/lib/api";
import type { HomeCultureCard } from "@/lib/types";

interface CultureCardProps {
  item: HomeCultureCard;
}

export function CultureCard({ item }: CultureCardProps) {
  const meta = [item.region, CATEGORY_LABELS[item.category]]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="h-full">
      <Link
        href={item.href}
        className="focus-ring group flex h-full flex-col overflow-hidden rounded-[10px] border border-line/80 bg-paper transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(23,21,15,0.35)]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-deep">
          {item.image ? (
            <AppImage
              src={item.image}
              alt={item.title}
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
          <p className="text-[10.5px] font-medium tracking-[0.13em] text-muted uppercase">
            {meta}
          </p>

          <h3 className="mt-1.5 font-serif text-[24px] leading-tight font-normal text-ink">
            {item.title}
          </h3>

          <p className="mt-2 line-clamp-3 min-h-[62px] text-[13px] leading-[1.55] text-muted">
            {item.description ?? ""}
          </p>

          <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[12px] font-semibold tracking-[0.01em] text-ink">
            Baca selengkapnya
            <ArrowUpRightIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}
