import type { UserSummary } from "@/lib/userApi";

function initialsFor(username: string): string {
  const words = username.trim().split(/\s+/).filter(Boolean);
  const parts = words.filter((word) => /[a-z]/i.test(word));

  if (parts.length === 0) {
    return words.length > 0
      ? words[0].slice(0, 2).toUpperCase()
      : "GB";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const SIZE_CLASS = {
  sm: "h-14 w-14 text-lg",
  md: "h-20 w-20 text-2xl",
  lg: "h-full w-full text-[clamp(52px,7vw,78px)]",
} as const;

/**
 * Avatar default berbasis inisial. Backend belum menyediakan unggahan foto
 * profil, jadi komponen ini selalu punya fallback yang konsisten.
 */
export function UserAvatar({
  user,
  size = "md",
  className = "",
}: {
  user: UserSummary | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const username = user?.username?.trim() || "Pengguna GaleriBudaya";

  return (
    <div
      role="img"
      aria-label={`Foto profil ${username}`}
      className={`relative flex items-center justify-center overflow-hidden rounded-[14px] bg-[linear-gradient(145deg,#efe5d3_0%,#dcc8a8_52%,#c3a67d_100%)] ${SIZE_CLASS[size]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.5),transparent_60%)]"
      />
      <span
        aria-hidden="true"
        className="relative font-serif leading-none tracking-[0.02em] text-[#4d3b23]/80 select-none"
      >
        {initialsFor(username)}
      </span>
    </div>
  );
}
