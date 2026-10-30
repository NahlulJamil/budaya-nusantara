import { CATEGORY_LABELS } from "@/lib/api";
import type { GaleriPostSummary } from "@/lib/types";

export const STATUS_META: Record<
  string,
  { label: string; badge: string; description: string }
> = {
  approved: {
    label: "Dipublikasikan",
    badge: "border-[#cfe0c8] bg-[#eef4e9] text-[#3f5b32]",
    description:
      "Kiriman ini sudah tayang di Galeri Budaya dan dapat dilihat pengguna lain.",
  },
  pending: {
    label: "Menunggu peninjauan",
    badge: "border-[#eadcbd] bg-[#fbf3df] text-[#7a5b1a]",
    description:
      "Kiriman sudah diterima dan sedang menunggu peninjauan dari pengelola.",
  },
  rejected: {
    label: "Perlu revisi",
    badge: "border-[#efd0cd] bg-[#fbebe9] text-[#8a3a32]",
    description:
      "Kiriman ini belum dapat dipublikasikan. Fitur perbaikan belum tersedia.",
  },
};

export const STATUS_ORDER = ["pending", "approved", "rejected"];

export function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status,
      badge: "border-line bg-cream text-muted",
      description: "",
    }
  );
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatJoined(value: string | null | undefined): string | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatFullDate(
  value: string | null | undefined,
): string | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function uploadMeta(post: GaleriPostSummary): string | null {
  const parts = [
    post.location,
    post.content ? CATEGORY_LABELS[post.content.category] : null,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : null;
}
