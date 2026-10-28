import type { AdminContentStatus } from "@/lib/adminApi";

export function AdminStatusBadge({ status }: { status: AdminContentStatus }) {
  const published = status === "published";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium whitespace-nowrap ${
        published
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-amber/40 bg-amber/10 text-ink"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-green-600" : "bg-amber"
        }`}
        aria-hidden="true"
      />
      {published ? "Terbit" : "Draf"}
    </span>
  );
}
