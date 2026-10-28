import { AppImage } from "@/components/ui/AppImage";
import { resolveMediaUrl } from "@/lib/api";
import type { GaleriPostSummary } from "@/lib/types";

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function GaleriCard({ post }: { post: GaleriPostSummary }) {
  const media = post.media ?? [];
  const cover = resolveMediaUrl(media[0]?.url ?? media[0]?.file_path);
  const extraMedia = media.length - 1;
  const meta = [post.location, formatDate(post.activity_date)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[10px] border border-line/80 bg-paper">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-deep">
        {cover ? (
          <AppImage
            src={cover}
            alt={post.title}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#e8dfcd,transparent_65%)]"
          />
        )}

        {extraMedia > 0 ? (
          <span className="absolute right-3 bottom-3 rounded-full bg-night/80 px-2.5 py-1 text-[10.5px] font-medium tracking-[0.04em] text-[#f6f2e7]">
            +{extraMedia} foto
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
        {meta ? (
          <p className="text-[10.5px] font-medium tracking-[0.13em] text-muted uppercase">
            {meta}
          </p>
        ) : null}

        <h2 className="mt-1.5 font-serif text-[21px] leading-tight font-normal text-ink">
          {post.title}
        </h2>

        {post.caption ? (
          <p className="mt-2 line-clamp-3 text-[13px] leading-[1.6] text-muted">
            {post.caption}
          </p>
        ) : null}

        <p className="mt-auto pt-4 text-[11.5px] leading-[1.6] text-muted">
          {post.author ? (
            <>
              Diunggah oleh{" "}
              <span className="font-medium text-ink">
                {post.author.username}
              </span>
            </>
          ) : (
            "Kontribusi komunitas"
          )}
          {post.content ? (
            <>
              {" · "}
              <span>{post.content.title}</span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
