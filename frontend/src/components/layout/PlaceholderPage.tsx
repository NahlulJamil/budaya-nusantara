import { OutlineLink } from "@/components/ui/OutlineLink";

interface PlaceholderPageProps {
  eyebrow?: string;
  title: string;
  description: string;
  detail?: string | null;
}

export function PlaceholderPage({
  eyebrow = "Segera hadir",
  title,
  description,
  detail,
}: PlaceholderPageProps) {
  return (
    <main id="main" className="min-h-[58vh]">
      <div className="shell py-16 sm:py-20 lg:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-[720px] font-serif text-[clamp(34px,4.4vw,54px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <p className="mt-5 max-w-[520px] text-[13px] leading-[1.75] text-muted">
          {description}
        </p>
        {detail ? (
          <p className="mt-4 max-w-[520px] border-l-2 border-amber/70 pl-3 text-[12px] leading-[1.7] text-muted">
            {detail}
          </p>
        ) : null}
        <OutlineLink href="/" className="mt-8">
          Kembali ke Home
        </OutlineLink>
      </div>
    </main>
  );
}
