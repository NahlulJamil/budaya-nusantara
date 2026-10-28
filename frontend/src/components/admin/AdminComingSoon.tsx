export function AdminComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mt-8 rounded-xl border border-dashed border-line bg-paper p-6 sm:p-8">
      <p className="eyebrow">Tahap berikutnya</p>
      <h2 className="mt-2 font-serif text-[22px] leading-tight text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-[560px] text-[13px] leading-[1.8] text-muted">
        {description}
      </p>
    </section>
  );
}
