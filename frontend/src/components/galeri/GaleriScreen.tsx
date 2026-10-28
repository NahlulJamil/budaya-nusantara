"use client";

import { useEffect, useState } from "react";

import { GaleriCard } from "@/components/galeri/GaleriCard";
import { GaleriUploadPanel } from "@/components/galeri/GaleriUploadPanel";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";
import type { GaleriPostSummary, PaginationMeta } from "@/lib/types";
import {
  UserApiError,
  clearUserToken,
  fetchGaleriList,
  fetchUserMe,
  logoutUser,
  readUserToken,
  writeUserToken,
  type UserSummary,
} from "@/lib/userApi";

const PER_PAGE = 9;

function GaleriListSkeleton() {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[10px] border border-line/80 bg-paper"
        >
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GaleriScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [posts, setPosts] = useState<GaleriPostSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Pulihkan sesi dari token yang tersimpan di tab ini.
  useEffect(() => {
    let active = true;

    async function restoreSession(): Promise<void> {
      const stored = readUserToken();

      if (!stored) {
        return;
      }

      try {
        const response = await fetchUserMe(stored);

        if (active) {
          setToken(stored);
          setUser(response.data.user);
        }
      } catch {
        if (active) {
          clearUserToken();
        }
      }
    }

    void restoreSession().finally(() => {
      if (active) {
        setSessionLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Halaman pertama selalu dimuat ulang setelah unggah agar kiriman baru tampil.
  useEffect(() => {
    let active = true;

    fetchGaleriList({ per_page: PER_PAGE })
      .then((response) => {
        if (!active) {
          return;
        }

        setPosts(response.data);
        setMeta(response.meta);
        setListError(null);
        setMoreError(null);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setListError(
          error instanceof UserApiError
            ? error.message
            : "Gagal memuat galeri. Coba lagi.",
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
  }, [reloadKey]);

  function handleAuthenticated(nextToken: string, nextUser: UserSummary): void {
    writeUserToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function handleLogout(): void {
    const current = token;

    clearUserToken();
    setToken(null);
    setUser(null);

    if (current) {
      void logoutUser(current).catch(() => {
        // Token lokal sudah dihapus; kegagalan server tidak menghalangi keluar.
      });
    }
  }

  function handleUploaded(): void {
    setReloadKey((key) => key + 1);
  }

  async function loadMore(): Promise<void> {
    if (!meta || loadingMore || meta.current_page >= meta.last_page) {
      return;
    }

    setLoadingMore(true);
    setMoreError(null);

    try {
      const response = await fetchGaleriList({
        per_page: PER_PAGE,
        page: meta.current_page + 1,
      });

      setPosts((current) => {
        const existing = new Set(current.map((post) => post.id));

        return [
          ...current,
          ...response.data.filter((post) => !existing.has(post.id)),
        ];
      });
      setMeta(response.meta);
    } catch (error) {
      setMoreError(
        error instanceof UserApiError
          ? error.message
          : "Gagal memuat kiriman berikutnya.",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  const hasMore = Boolean(meta && meta.current_page < meta.last_page);

  return (
    <main id="main" className="pb-20">
      <section className="shell pt-14 sm:pt-16 lg:pt-20">
        <p className="eyebrow">Galeri Budaya Indonesia</p>
        <h1 className="mt-3 max-w-[760px] font-serif text-[clamp(34px,4.4vw,54px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
          Indonesia, dari sudut pandangmu.
        </h1>
        <p className="mt-4 max-w-[560px] text-[13px] leading-[1.8] text-muted">
          Dokumentasi tradisi, kuliner, dan pertunjukan dari berbagai daerah.
          Semua kiriman yang lolos validasi langsung tayang di halaman ini.
        </p>

        <div className="mt-10">
          <GaleriUploadPanel
            token={token}
            user={user}
            sessionLoading={sessionLoading}
            onAuthenticated={handleAuthenticated}
            onLogout={handleLogout}
            onUploaded={handleUploaded}
          />
        </div>
      </section>

      <section aria-labelledby="galeri-daftar-heading" className="shell mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="galeri-daftar-heading"
            className="font-serif text-[clamp(24px,2.6vw,30px)] leading-tight text-ink"
          >
            Kiriman terbaru
          </h2>
          {meta && !loading ? (
            <p className="text-[11.5px] text-muted">
              {meta.total} kiriman dipublikasikan
            </p>
          ) : null}
        </div>

        {loading ? <GaleriListSkeleton /> : null}

        {!loading && listError ? (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
          >
            <AlertIcon className="h-4 w-4 shrink-0" />
            <span>{listError}</span>
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
        ) : null}

        {!loading && !listError && posts.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-line bg-paper px-5 py-10 text-center text-[13px] text-muted">
            Belum ada kiriman galeri. Jadilah yang pertama membagikan
            dokumentasimu.
          </p>
        ) : null}

        {!loading && posts.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <GaleriCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            {moreError ? (
              <p role="alert" className="text-[12px] text-red-700">
                {moreError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-4 text-[12px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? (
                "Memuat..."
              ) : (
                <>
                  <RefreshIcon className="h-3.5 w-3.5" />
                  Muat kiriman berikutnya
                </>
              )}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
