"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { TextField } from "@/components/auth/AuthFields";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import {
  UserApiError,
  clearUserToken,
  fetchUserMe,
  logoutUser,
  readUserToken,
  updateUserProfile,
  type UserSummary,
} from "@/lib/userApi";

const MAX_USERNAME = 255;

const SUBMIT_CLASS =
  "focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-night px-5 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-65";
const CANCEL_CLASS =
  "focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-[#cfc6b6] bg-white px-5 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-[#fbf9f3] disabled:cursor-not-allowed disabled:opacity-60";

function EditBreadcrumb() {
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
        <li>
          <Link
            href="/profile"
            className="focus-ring transition-colors hover:text-ink"
          >
            Profil
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-ink">
          Edit Profil
        </li>
      </ol>
    </nav>
  );
}

export function EditProfileScreen() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    const stored = readUserToken();

    if (!stored) {
      router.replace("/login?next=/profile/edit");
      return;
    }

    fetchUserMe(stored)
      .then((response) => {
        if (!active) {
          return;
        }

        setToken(stored);
        setUser(response.data.user);
        setUsername(response.data.user.username);
        setLoadError(null);
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
          router.replace("/login?next=/profile/edit");
          return;
        }

        setLoadError(
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

  function clearFieldError(key: string): void {
    setFieldErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setFormError(null);
    setSuccessMessage(null);
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const clean = username.trim();

    if (!clean) {
      errors.username = "Username wajib diisi.";
    } else if (clean.length > MAX_USERNAME) {
      errors.username = `Username maksimal ${MAX_USERNAME} karakter.`;
    }

    return errors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current || !token) {
      return;
    }

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Periksa kembali kolom yang ditandai.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    try {
      const response = await updateUserProfile(token, username.trim());

      setUser(response.data.user);
      setUsername(response.data.user.username);
      setSuccessMessage("Profil berhasil diperbarui.");
      redirectTimer.current = setTimeout(() => {
        router.replace("/profile");
      }, 900);
    } catch (error) {
      if (error instanceof UserApiError) {
        if (error.status === 401 || error.status === 403) {
          clearUserToken();
          router.replace("/login?next=/profile/edit");
          return;
        }

        const message = error.errors.username?.[0];

        if (message) {
          setFieldErrors({ username: message });
          setFormError(null);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleCancel(): void {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
    }
    router.push("/profile");
  }

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

  const dirty = Boolean(user && username.trim() !== user.username);

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-10 sm:pt-12 lg:pt-14">
        <EditBreadcrumb />

        <header className="mt-8 max-w-[820px] sm:mt-10">
          <p className="eyebrow">Ruang pribadi / Akun login</p>
          <h1 className="mt-3 font-serif text-[clamp(38px,5vw,56px)] leading-[1.06] font-normal tracking-[-0.02em] text-ink">
            Tetap jadi dirimu.
          </h1>
          <p className="mt-4 max-w-[640px] text-[13.5px] leading-[1.85] text-muted">
            Perbarui informasi yang ingin kamu bagikan kepada komunitas.
          </p>
        </header>

        {loading ? <ProfileSkeleton /> : null}

        {!loading && loadError ? (
          <div className="mt-10 max-w-[760px]">
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
            >
              <AlertIcon className="h-4 w-4 shrink-0" />
              <span>{loadError}</span>
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

        {!loading && !loadError && user ? (
          <div className="mt-12 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
            <ProfileSidebar
              user={user}
              displayName={username}
              mode="edit"
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />

            <section
              aria-labelledby="informasi-profil-heading"
              className="rounded-[16px] border border-line bg-paper p-5 sm:p-7 lg:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  id="informasi-profil-heading"
                  className="font-serif text-[clamp(24px,3vw,30px)] leading-tight font-normal tracking-[-0.01em] text-ink"
                >
                  Informasi profil
                </h2>
                <p className="text-[11px] text-muted">
                  <span aria-hidden="true">*</span> Kolom bertanda wajib
                </p>
              </div>

              {formError ? (
                <p
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </p>
              ) : null}

              {successMessage ? (
                <p
                  role="status"
                  className="mt-5 flex items-start gap-2 rounded-lg border border-[#cfe0c8] bg-[#eef4e9] px-4 py-3 text-[12.5px] leading-[1.7] text-[#3f5b32]"
                >
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </p>
              ) : null}

              <form
                noValidate
                onSubmit={handleSubmit}
                aria-busy={submitting}
                className="mt-6 space-y-5"
              >
                <TextField
                  id="profile-username"
                  name="username"
                  label="Username *"
                  autoComplete="username"
                  placeholder="Username akun"
                  hint="Nama yang tampil di profil"
                  value={username}
                  maxLength={MAX_USERNAME}
                  disabled={submitting}
                  error={fieldErrors.username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    clearFieldError("username");
                  }}
                />

                <div>
                  <TextField
                    id="profile-email"
                    name="email"
                    label="Email akun"
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                    hint="Hanya kamu yang melihat"
                  />
                  <p className="mt-2 flex items-start gap-2 text-[11px] leading-[1.7] text-muted">
                    <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Email dipakai untuk masuk dan tidak dapat diubah dari
                      halaman ini.
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-[#dfe4d5] bg-[#eef2e8] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#4f6244]" />
                    <div>
                      <p className="text-[12px] font-semibold text-ink">
                        Email tetap privat
                      </p>
                      <p className="mt-1 text-[11.5px] leading-[1.7] text-muted">
                        Email hanya terlihat olehmu dan tidak ditampilkan di
                        profil publik. Username tampil sebagai nama kontributor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2.5 border-t border-line/70 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className={CANCEL_CLASS}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !dirty}
                    className={SUBMIT_CLASS}
                  >
                    {submitting ? "Menyimpan..." : "Simpan perubahan"}
                  </button>
                </div>

                {!dirty && !submitting ? (
                  <p className="text-right text-[11px] text-muted">
                    Ubah username untuk mengaktifkan tombol simpan.
                  </p>
                ) : null}
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
