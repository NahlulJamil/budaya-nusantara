import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
