"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_NAV_ITEMS = [
  {
    href: "/admin/budaya",
    label: "Kelola Budaya",
    description: "Tradisi, pakaian adat, makanan, alat musik",
  },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminSidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1 px-3">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`focus-ring flex flex-col gap-1 rounded-lg px-3 py-3 transition-colors ${
                active
                  ? "bg-white/10 text-[#f6f2e7]"
                  : "text-[#d8d2c4] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-[13px] font-medium">{item.label}</span>
              <span className="text-[11px] leading-[1.5] text-[#8d8779]">
                {item.description}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebarNavFallback() {
  return (
    <ul className="space-y-1 px-3" aria-hidden="true">
      <li className="h-[64px] rounded-lg bg-white/5" />
    </ul>
  );
}
