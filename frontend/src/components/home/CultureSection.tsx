import { CultureCard } from "@/components/home/CultureCard";
import { CultureSkeleton } from "@/components/home/HomeSkeletons";
import { PreviewNote } from "@/components/home/PreviewNote";
import type { PreviewReason } from "@/hooks/useHomeData";
import type { HomeCultureCard } from "@/lib/types";

interface CultureSectionProps {
  cards: HomeCultureCard[];
  loading: boolean;
  preview: boolean;
  reason: PreviewReason;
  onRetry: () => void;
}

export function CultureSection({
  cards,
  loading,
  preview,
  reason,
  onRetry,
}: CultureSectionProps) {
  return (
    <section
      aria-labelledby="warisan-heading"
      className="pt-16 sm:pt-20 lg:pt-[86px]"
    >
      <div className="shell">
        <h2
          id="warisan-heading"
          className="font-serif text-[clamp(31px,3.5vw,44px)] leading-[1.1] font-normal tracking-[-0.015em] text-ink"
        >
          Warisan yang terus hidup
        </h2>

        {loading ? (
          <CultureSkeleton />
        ) : (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {cards.map((item) => (
              <CultureCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && preview ? (
          <PreviewNote reason={reason} onRetry={onRetry} />
        ) : null}
      </div>
    </section>
  );
}
