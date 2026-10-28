"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminLoadingScreen } from "@/components/admin/AdminLoadingScreen";
import { AdminApiError } from "@/lib/adminApi";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function AdminLoginScreen() {
  const { login, status } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/budaya");
    }
  }, [status, router]);

  if (status === "loading") {
    return <AdminLoadingScreen label="Memeriksa sesi admin..." />;
  }

  if (status === "authenticated") {
    return <AdminLoadingScreen label="Mengalihkan ke panel admin..." />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await login(cleanEmail, password);
    } catch (error) {
      if (error instanceof AdminApiError) {
        const nextFieldErrors: FieldErrors = {};

        if (error.errors.email?.[0]) {
          nextFieldErrors.email = error.errors.email[0];
        }

        if (error.errors.password?.[0]) {
          nextFieldErrors.password = error.errors.password[0];
        }

        setFieldErrors(nextFieldErrors);
        setFormError(
          Object.keys(nextFieldErrors).length > 0 ? null : error.message,
        );
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const forbiddenNotice =
    status === "forbidden"
      ? "Sesi sebelumnya tidak memiliki akses admin. Silakan masuk dengan akun admin."
      : null;

  return (
    <main id="main" className="min-h-dvh bg-cream">
      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden bg-night px-10 py-12 text-[#efeade] lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(227,161,58,0.22),transparent_46%),radial-gradient(circle_at_82%_88%,rgba(227,161,58,0.12),transparent_42%)]"
          />

          <div className="relative">
            <p className="text-[19px] tracking-[0.02em] text-[#f6f2e7]">
              Galeri<span className="text-amber">Budaya</span>
            </p>
            <p className="mt-2 text-[9.5px] font-medium tracking-[0.18em] text-[#8d8779] uppercase">
              Panel Admin
            </p>
          </div>

          <div className="relative max-w-[440px]">
            <p className="text-[10px] font-medium tracking-[0.2em] text-amber uppercase">
              Ruang kurasi
            </p>
            <h1 className="mt-5 font-serif text-[clamp(34px,3.6vw,52px)] leading-[1.08] tracking-[-0.02em] text-[#f6f2e7]">
              Merawat budaya dengan kerja yang tertata.
            </h1>
            <p className="mt-5 max-w-[360px] text-[13px] leading-[1.85] text-[#a8a294]">
              Kelola konten budaya Indonesia dan jaga kualitasnya sebelum
              ditampilkan ke publik.
            </p>
          </div>

          <p className="relative max-w-[360px] text-[11px] leading-[1.7] text-[#8d8779]">
            Akses panel ini hanya untuk akun dengan peran admin.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
          <div className="w-full max-w-[420px]">
            <div className="lg:hidden">
              <p className="text-[19px] tracking-[0.02em] text-ink">
                Galeri<span className="text-amber">Budaya</span>
              </p>
              <p className="mt-2 text-[9.5px] font-medium tracking-[0.18em] text-muted uppercase">
                Panel Admin
              </p>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="eyebrow">Admin</p>
              <h2 className="mt-3 font-serif text-[clamp(30px,4vw,42px)] leading-[1.1] tracking-[-0.02em] text-ink">
                Masuk ke panel admin
              </h2>
              <p className="mt-3 text-[13px] leading-[1.75] text-muted">
                Gunakan email dan password akun admin GaleriBudaya.
              </p>
            </div>

            {forbiddenNotice ? (
              <p
                role="alert"
                className="mt-6 rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px] leading-[1.7] text-ink"
              >
                {forbiddenNotice}
              </p>
            ) : null}

            {formError ? (
              <p
                role="alert"
                className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-[1.7] text-red-800"
              >
                {formError}
              </p>
            ) : null}

            <form
              noValidate
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="admin-email"
                  className="text-[12px] font-medium text-ink"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                    setFormError(null);
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "admin-email-error" : undefined
                  }
                  placeholder="admin@contoh.com"
                  className="focus-ring mt-2 h-11 w-full rounded-lg border border-line bg-paper px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40"
                />
                {fieldErrors.email ? (
                  <p
                    id="admin-email-error"
                    className="mt-1.5 text-[11.5px] text-red-700"
                  >
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="text-[12px] font-medium text-ink"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                    setFormError(null);
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "admin-password-error" : undefined
                  }
                  placeholder="Password akun admin"
                  className="focus-ring mt-2 h-11 w-full rounded-lg border border-line bg-paper px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40"
                />
                {fieldErrors.password ? (
                  <p
                    id="admin-password-error"
                    className="mt-1.5 text-[11.5px] text-red-700"
                  >
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="focus-ring inline-flex h-11 w-full items-center justify-center rounded-lg bg-night px-4 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Memeriksa..." : "Masuk"}
              </button>
            </form>

            <p className="mt-5 text-[11.5px] leading-[1.7] text-muted">
              Token disimpan hanya untuk sesi tab ini. Jangan gunakan akun admin
              di perangkat publik.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
