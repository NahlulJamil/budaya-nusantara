import Link from "next/link";

import { UserAvatar } from "@/components/profile/UserAvatar";
import { formatJoined } from "@/components/profile/profileMeta";
import {
  ChevronLeftIcon,
  LogOutIcon,
  PencilIcon,
} from "@/components/ui/icons";
import type { UserSummary } from "@/lib/userApi";

const BUTTON_CLASS =
  "focus-ring inline-flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#cfc6b6] bg-white px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-[#fbf9f3] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function ProfileSidebar({
  user,
  displayName,
  mode,
  onLogout,
  loggingOut = false,
}: {
  user: UserSummary;
  displayName?: string;
  mode: "view" | "edit";
  onLogout: () => void;
  loggingOut?: boolean;
}) {
  const name = displayName?.trim() || user.username;
  const joined = formatJoined(user.created_at);

  return (
    <aside className="h-fit rounded-[16px] border border-line bg-paper p-5 sm:p-6 lg:sticky lg:top-24">
      <div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-[14px] border border-line/70">
        <UserAvatar user={{ ...user, username: name }} size="lg" />
      </div>

      <h2 className="mt-6 font-serif text-[clamp(26px,2.6vw,32px)] leading-[1.12] font-normal tracking-[-0.01em] text-ink">
        {name}
      </h2>

      <p className="mt-2 text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
        Kontributor · Akun
      </p>

      <div className="mt-5 space-y-2.5 text-[12.5px] leading-[1.75] text-muted">
        {joined ? <p>Bergabung {joined}</p> : null}
        <p>Email hanya terlihat olehmu.</p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {mode === "view" ? (
          <Link href="/profile/edit" className={BUTTON_CLASS}>
            <span>Edit Profil</span>
            <PencilIcon className="h-4 w-4" />
          </Link>
        ) : (
          <Link href="/profile" className={BUTTON_CLASS}>
            <span>Kembali ke Profil</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
        )}

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className={BUTTON_CLASS}
        >
          <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
          <LogOutIcon className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
