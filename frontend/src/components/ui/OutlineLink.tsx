import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "@/components/ui/icons";

interface OutlineLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function OutlineLink({ href, children, className = "" }: OutlineLinkProps) {
  return (
    <Link
      href={href}
      className={`focus-ring group inline-flex h-9 w-fit items-center gap-2 rounded-md border border-line bg-paper px-3.5 text-[11px] font-medium tracking-[0.01em] text-ink transition-colors hover:border-ink/40 hover:bg-white ${className}`}
    >
      {children}
      <ArrowUpRightIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}
