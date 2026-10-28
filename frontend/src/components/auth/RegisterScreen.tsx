"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import {
  AlertIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import {
  UserApiError,
  registerUser,
  writeUserToken,
  type UserSummary,
} from "@/lib/userApi";

const MAX_USERNAME = 255;
const MAX_EMAIL = 255;
const MIN_PASSWORD = 8;

const CONTROL_BASE =
  "focus-ring w-full rounded-lg border bg-paper px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40 disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted";

function inputClass(error: string | undefined): string {
  return `${CONTROL_BASE} h-11 ${error ? "border-red-300" : "border-line"}`;
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-medium text-ink">
          {label}
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        </label>
        {hint ? <span className="text-[10.5px] text-muted">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[11.5px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface CreatedAccount {
  message: string;
  user: UserSummary;
}

export function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  function fieldError(key: string): string | undefined {
    return serverErrors[key] ?? clientErrors[key];
  }

  function clearFieldError(key: string): void {
    setClientErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setServerErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setFormError(null);
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      errors.username = "Username wajib diisi.";
    } else if (cleanUsername.length > MAX_USERNAME) {
      errors.username = `Username maksimal ${MAX_USERNAME} karakter.`;
    }

    if (!cleanEmail) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Format email tidak valid.";
    } else if (cleanEmail.length > MAX_EMAIL) {
      errors.email = `Email maksimal ${MAX_EMAIL} karakter.`;
    }

    if (!password) {
      errors.password = "Password wajib diisi.";
    } else if (password.length < MIN_PASSWORD) {
      errors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
    }

    if (!passwordConfirmation) {
      errors.password_confirmation = "Konfirmasi password wajib diisi.";
    } else if (passwordConfirmation !== password) {
      errors.password_confirmation = "Konfirmasi password tidak sama.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      setServerErrors({});
      setFormError("Periksa kembali kolom yang ditandai.");
      return;
    }

    setSubmitting(true);
    setClientErrors({});
    setServerErrors({});
    setFormError(null);

    try {
      const response = await registerUser(
        username.trim(),
        email.trim(),
        password,
        passwordConfirmation,
      );

      // Backend mengembalikan token pada registrasi, jadi sesi bisa langsung dipakai.
      writeUserToken(response.data.token);
      setCreated({ message: response.message, user: response.data.user });
    } catch (error) {
      if (error instanceof UserApiError) {
        if (error.status === 422) {
          const nextErrors: Record<string, string> = {};

          for (const key of [
            "username",
            "email",
            "password",
            "password_confirmation",
          ]) {
            const message = error.errors[key]?.[0];
            if (message) {
              nextErrors[key] = message;
            }
          }

          setServerErrors(nextErrors);
          setFormError(
            Object.keys(nextErrors).length > 0
              ? "Beberapa kolom belum sesuai. Periksa kembali."
              : error.message,
          );
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-14 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-start lg:gap-16">
          <div className="max-w-[520px]">
            <p className="eyebrow">Registrasi</p>
            <h1 className="mt-3 font-serif text-[clamp(32px,4.2vw,48px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
              Mulai dari rasa ingin tahu.
            </h1>
            <p className="mt-4 text-[13px] leading-[1.8] text-muted">
              Buat akun untuk membagikan dokumentasi budaya, menyimpan riwayat
              kuis aksara, dan mengobrol dengan asisten budaya. Cukup satu akun
              untuk semua fitur itu.
            </p>

            <ul className="mt-6 space-y-2.5 text-[12.5px] leading-[1.7] text-muted">
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" />
                Unggah foto ke Galeri Budaya — langsung tampil setelah validasi.
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" />
                Simpan riwayat jawaban kuis aksara.
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" />
                Akses chatbot budaya dengan konteks konten yang kamu baca.
              </li>
            </ul>

            <p className="mt-7 text-[12px] leading-[1.75] text-muted">
              Sudah punya akun?{" "}
              <Link
                href="/galeri#masuk"
                className="focus-ring font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
              >
                Masuk lewat halaman Galeri
              </Link>
              .
            </p>
          </div>

          <section
            aria-labelledby="registrasi-heading"
            className="rounded-xl border border-line bg-paper p-5 sm:p-7"
          >
            {created ? (
              <div role="status" aria-live="polite">
                <CheckCircleIcon className="h-8 w-8 text-green-700" />
                <h2
                  id="registrasi-heading"
                  className="mt-3 font-serif text-[24px] leading-tight text-ink"
                >
                  Akun berhasil dibuat
                </h2>
                <p className="mt-2 text-[13px] leading-[1.8] text-muted">
                  {created.message} Kamu sudah masuk sebagai{" "}
                  <span className="font-medium text-ink">
                    {created.user.username}
                  </span>
                  .
                </p>
                <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[12px] leading-[1.7] text-green-900">
                  Sesi tersimpan di tab ini. Kamu bisa langsung mengunggah foto
                  atau keluar kapan saja dari panel Galeri.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/galeri"
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                  >
                    Ke Galeri Budaya
                  </Link>
                  <Link
                    href="/"
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-line bg-paper px-5 text-[13px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                  >
                    Ke Home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2
                  id="registrasi-heading"
                  className="font-serif text-[24px] leading-tight text-ink"
                >
                  Buat akun baru
                </h2>
                <p className="mt-2 text-[12.5px] leading-[1.75] text-muted">
                  Semua kolom wajib diisi. Peran akun selalu{" "}
                  <span className="font-medium text-ink">user</span>; akses admin
                  tidak diberikan lewat form ini.
                </p>

                {formError ? (
                  <p
                    role="alert"
                    className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </p>
                ) : null}

                <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-5">
                  <Field
                    id="registrasi-username"
                    label="Username"
                    hint={`${username.trim().length}/${MAX_USERNAME}`}
                    error={fieldError("username")}
                  >
                    <input
                      id="registrasi-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      maxLength={MAX_USERNAME}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        clearFieldError("username");
                      }}
                      aria-invalid={Boolean(fieldError("username"))}
                      aria-describedby={
                        fieldError("username")
                          ? "registrasi-username-error"
                          : undefined
                      }
                      placeholder="Contoh: penjelajah_budaya"
                      className={inputClass(fieldError("username"))}
                    />
                  </Field>

                  <Field
                    id="registrasi-email"
                    label="Email"
                    error={fieldError("email")}
                  >
                    <input
                      id="registrasi-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      maxLength={MAX_EMAIL}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError("email");
                      }}
                      aria-invalid={Boolean(fieldError("email"))}
                      aria-describedby={
                        fieldError("email") ? "registrasi-email-error" : undefined
                      }
                      placeholder="nama@contoh.com"
                      className={inputClass(fieldError("email"))}
                    />
                  </Field>

                  <Field
                    id="registrasi-password"
                    label="Password"
                    hint={`min. ${MIN_PASSWORD} karakter`}
                    error={fieldError("password")}
                  >
                    <input
                      id="registrasi-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFieldError("password");
                      }}
                      aria-invalid={Boolean(fieldError("password"))}
                      aria-describedby={
                        fieldError("password")
                          ? "registrasi-password-error"
                          : undefined
                      }
                      placeholder="Password akun"
                      className={inputClass(fieldError("password"))}
                    />
                  </Field>

                  <Field
                    id="registrasi-password-confirmation"
                    label="Konfirmasi password"
                    error={fieldError("password_confirmation")}
                  >
                    <input
                      id="registrasi-password-confirmation"
                      name="password_confirmation"
                      type="password"
                      autoComplete="new-password"
                      value={passwordConfirmation}
                      onChange={(event) => {
                        setPasswordConfirmation(event.target.value);
                        clearFieldError("password_confirmation");
                        clearFieldError("password");
                      }}
                      aria-invalid={Boolean(fieldError("password_confirmation"))}
                      aria-describedby={
                        fieldError("password_confirmation")
                          ? "registrasi-password-confirmation-error"
                          : undefined
                      }
                      placeholder="Ulangi password"
                      className={inputClass(fieldError("password_confirmation"))}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="focus-ring inline-flex h-11 w-full items-center justify-center rounded-lg bg-night px-4 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? "Membuat akun..." : "Buat akun"}
                  </button>

                  <p className="text-[11px] leading-[1.7] text-muted">
                    Dengan mendaftar, kamu menyetujui ketentuan penggunaan dan
                    kebijakan privasi yang berlaku di GaleriBudaya.
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
