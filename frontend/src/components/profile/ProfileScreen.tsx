"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import {
  formatFullDate,
  statusMeta,
  STATUS_ORDER,
  uploadMeta,
} from "@/components/profile/profileMeta";
import { AppImage } from "@/components/ui/AppImage";
import {
  AlertIcon,
  ArrowUpRightIcon,
  ImageIcon,
  InfoIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { resolveMediaUrl } from "@/lib/api";
import type { GaleriPostSummary } from "@/lib/types";
import {
  UserApiError,
  clearUserToken,
  fetchMyGaleri,
  fetchUserMe,
  logoutUser,
  readUserToken,
  type UserSummary,
} from "@/lib/userApi";

const PER_PAGE = 50;
const MAX_PAGES = 20;

async function fetchAllUploads(token: string): Promise<GaleriPostSummary[]> {
  const items: GaleriPostSummary[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await fetchMyGaleri(token, {
      per_page: PER_PAGE,
      page,
    });

    items.push(...response.data);
    lastPage = response.meta.last_page;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return items;
}

function ProfileBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="text-[11.5px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="focus-ring transition-colors hover:text-ink"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-ink">
          Profil
        </li>
      </ol>
    </nav>
  );
}

function UploadCard({ post }: { post: GaleriPostSummary }) {
  const cover = resolveMediaUrl(
    post.media?.[0]?.url ?? post.media?.[0]?.file_path,
  );
  const meta = statusMeta(post.status);
  const regionAndCategory = uploadMeta(post);
  const submitted = formatFullDate(post.created_at ?? post.activity_date);

  return (
    <article className="rounded-[14px] border border-line bg-paper p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-line/60 bg-cream-deep sm:h-[136px] sm:w-[184px]">
          {cover ? (
            <AppImage
              src={cover}
              alt={post.title}
              sizes="(min-width: 640px) 184px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,#e8dfcd,transparent_70%)] text-muted">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10.5px]">Tanpa foto</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium tracking-[0.01em] ${meta.badge}`}
          >
            {meta.label}
          </span>

          <h3 className="mt-2 font-serif text-[clamp(22px,2.4vw,26px)] leading-[1.15] font-normal tracking-[-0.01em] text-ink">
            {post.title}
          </h3>

          {regionAndCategory ? (
            <p className="mt-1 text-[12px] leading-[1.6] text-muted">
              {regionAndCategory}
            </p>
          ) : null}

          {submitted ? (
            <p className="mt-0.5 text-[11.5px] leading-[1.6] text-muted">
              Dikirim {submitted}
            </p>
          ) : null}

          {post.caption ? (
            <p className="mt-3 whitespace-pre-line text-[12.5px] leading-[1.75] text-muted">
              {post.caption}
            </p>
          ) : null}

          {post.status === "approved" ? (
            <Link
              href="/galeri"
              className="focus-ring mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-[#fbf9f3]"
            >
              Lihat di Galeri
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProfileScreen() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [posts, setPosts] = useState<GaleriPostSummary[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    const stored = readUserToken();

    if (!stored) {
      router.replace("/login?next=/profile");
      return;
    }

    Promise.all([fetchUserMe(stored), fetchAllUploads(stored)])
      .then(([me, uploads]) => {
        if (!active) {
          return;
        }
        setToken(stored);
        setUser(me.data.user);
        setPosts(uploads);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (
          cause instanceof UserApiError &&
          (cause.status === 401 || cause.status === 403)
        ) {
          clearUserToken();
          router.replace("/login?next=/profile");
          return;
        }

        setError(
          cause instanceof UserApiError
            ? cause.message
            : "Gagal memuat profil. Coba lagi.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router, reloadKey]);

  const statuses = useMemo(() => {
    const counts = new Map<string, number>();

    for (const post of posts ?? []) {
      counts.set(post.status, (counts.get(post.status) ?? 0) + 1);
    }

    const ordered = STATUS_ORDER.filter((status) => counts.has(status));
    const extras = [...counts.keys()].filter(
      (status) => !STATUS_ORDER.includes(status),
    );

    return [...ordered, ...extras].map((status) => ({
      key: status,
      count: counts.get(status) ?? 0,
      ...statusMeta(status),
    }));
  }, [posts]);

  const activeFilter =
    statusFilter === "all" ||
    statuses.some((status) => status.key === statusFilter)
      ? statusFilter
      : "all";

  const visiblePosts = useMemo(() => {
    const list = posts ?? [];

    return activeFilter === "all"
      ? list
      : list.filter((post) => post.status === activeFilter);
  }, [activeFilter, posts]);

  function handleLogout(): void {
    const current = token;

    setLoggingOut(true);
    clearUserToken();

    if (current) {
      void logoutUser(current).catch(() => {
        // Token lokal sudah dihapus; kegagalan server tidak menghalangi keluar.
      });
    }

    router.replace("/login");
  }

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-10 sm:pt-12 lg:pt-14">
        <ProfileBreadcrumb />

        <header className="mt-8 max-w-[820px] sm:mt-10">
          <p className="eyebrow">Ruang pribadi / Akun login</p>
          <h1 className="mt-3 font-serif text-[clamp(38px,5vw,56px)] leading-[1.06] font-normal tracking-[-0.02em] text-ink">
            Cerita yang kamu rawat.
          </h1>
          <p className="mt-4 max-w-[640px] text-[13.5px] leading-[1.85] text-muted">
            Kelola informasi akun, pantau peninjauan, dan lanjutkan
            kontribusimu dari satu tempat.
          </p>
        </header>

        {loading ? <ProfileSkeleton /> : null}

        {!loading && error ? (
          <div className="mt-10 max-w-[760px]">
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
            >
              <AlertIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
                className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <RefreshIcon className="h-3 w-3" />
                Coba lagi
              </button>
            </div>
          </div>
        ) : null}

        {!loading && !error && user ? (
          <div className="mt-12 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
            <ProfileSidebar
              user={user}
              mode="view"
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />

            <section aria-labelledby="riwayat-unggahan">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2
                    id="riwayat-unggahan"
                    className="font-serif text-[clamp(28px,3.2vw,36px)] leading-tight font-normal tracking-[-0.01em] text-ink"
                  >
                    Riwayat unggahan
                  </h2>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {posts?.length ?? 0} unggahan
                  </p>
                </div>

                <Link
                  href="/galeri#masuk"
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                >
                  Upload Konten
                  <PlusIcon className="h-4 w-4" />
                </Link>
              </div>

              {statuses.length > 0 ? (
                <div
                  role="group"
                  aria-label="Filter status unggahan"
                  className="mt-5 flex flex-wrap gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    aria-pressed={activeFilter === "all"}
                    className={`focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors ${
                      activeFilter === "all"
                        ? "border-night bg-night text-[#f6f2e7]"
                        : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                    }`}
                  >
                    Semua
                    <span
                      className={
                        activeFilter === "all" ? "text-[#c8c1b0]" : "text-muted"
                      }
                    >
                      {posts?.length ?? 0}
                    </span>
                  </button>

                  {statuses.map((status) => {
                    const active = activeFilter === status.key;

                    return (
                      <button
                        key={status.key}
                        type="button"
                        onClick={() => setStatusFilter(status.key)}
                        aria-pressed={active}
                        className={`focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors ${
                          active
                            ? "border-night bg-night text-[#f6f2e7]"
                            : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                        }`}
                      >
                        {status.label}
                        <span
                          className={
                            active ? "text-[#c8c1b0]" : "text-muted"
                          }
                        >
                          {status.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {posts && posts.length === 0 ? (
                <div className="mt-6 rounded-[14px] border border-dashed border-line bg-paper px-6 py-12 text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-muted" />
                  <p className="mt-3 font-serif text-[24px] leading-tight text-ink">
                    Belum ada unggahan.
                  </p>
                  <p className="mx-auto mt-2 max-w-[420px] text-[12.5px] leading-[1.8] text-muted">
                    Mulai bagikan dokumentasi budaya pertamamu. Kiriman yang
                    lolos validasi langsung tayang di Galeri Budaya.
                  </p>
                  <Link
                    href="/galeri#masuk"
                    className="focus-ring mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                  >
                    Upload Konten
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}

              {posts && posts.length > 0 && visiblePosts.length === 0 ? (
                <div className="mt-6 rounded-[14px] border border-dashed border-line bg-paper px-6 py-10 text-center">
                  <p className="text-[12.5px] leading-[1.8] text-muted">
                    Tidak ada unggahan dengan status ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="focus-ring mt-4 inline-flex h-9 items-center rounded-md border border-line bg-white px-3.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40"
                  >
                    Lihat semua unggahan
                  </button>
                </div>
              ) : null}

              {visiblePosts.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {visiblePosts.map((post) => (
                    <UploadCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#dfe4d5] bg-[#eef2e8] px-4 py-4">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#4f6244]" />
                <div>
                  <p className="text-[12px] font-semibold text-ink">
                    Profil bersifat pribadi
                  </p>
                  <p className="mt-1 text-[11.5px] leading-[1.7] text-muted">
                    Hanya kamu yang dapat melihat dan mengelola profil serta
                    unggahan ini. Tamu diarahkan ke Masuk, lalu kembali ke
                    Profil.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
