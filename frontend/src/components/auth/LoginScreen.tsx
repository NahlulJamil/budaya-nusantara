"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import {
  AuthAlert,
  PasswordField,
  TextField,
} from "@/components/auth/AuthFields";
import {
  UserApiError,
  loginUser,
  writeUserToken,
} from "@/lib/userApi";

const MAX_EMAIL = 255;

const SUBMIT_CLASS =
  "focus-ring inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0d0d0b] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-65";

export function LoginScreen() {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Format email tidak valid.";
    } else if (cleanEmail.length > MAX_EMAIL) {
      errors.email = `Email maksimal ${MAX_EMAIL} karakter.`;
    }

    if (!password) {
      errors.password = "Password wajib diisi.";
    }

    return errors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current) {
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

    try {
      const response = await loginUser(email.trim(), password);
      writeUserToken(response.data.token, remember);
      router.replace("/galeri");
    } catch (error) {
      if (error instanceof UserApiError) {
        const nextErrors: Record<string, string> = {};

        const emailMessage = error.errors.email?.[0];
        const passwordMessage = error.errors.password?.[0];

        if (emailMessage) {
          nextErrors.email = emailMessage;
        }
        if (passwordMessage) {
          nextErrors.password = passwordMessage;
        }

        setFieldErrors(nextErrors);
        setFormError(
          Object.keys(nextErrors).length > 0
            ? null
            : error.message ||
                "Email atau password salah. Periksa kembali data kamu.",
        );
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard labelledBy="login-heading">
        <h1
          id="login-heading"
          className="font-serif text-[clamp(30px,4.4vw,36px)] leading-[1.1] font-normal tracking-[-0.015em] text-ink"
        >
          Welcome
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-[1.6] text-muted">
          Please enter your details
        </p>

        {formError ? (
          <div className="mt-6">
            <AuthAlert>{formError}</AuthAlert>
          </div>
        ) : null}

        <form
          noValidate
          onSubmit={handleSubmit}
          aria-busy={submitting}
          className="mt-6 space-y-4"
        >
          <TextField
            id="login-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@contoh.com"
            value={email}
            maxLength={MAX_EMAIL}
            disabled={submitting}
            error={fieldErrors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
          />

          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={password}
            disabled={submitting}
            error={fieldErrors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <label
              htmlFor="login-remember"
              className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-[#5f584b]"
            >
              <input
                id="login-remember"
                name="remember"
                type="checkbox"
                checked={remember}
                disabled={submitting}
                onChange={(event) => setRemember(event.target.checked)}
                className="focus-ring h-4 w-4 rounded border-[#b8a68f] accent-[#0b0b09] disabled:cursor-not-allowed"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`${SUBMIT_CLASS} mt-1`}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12.5px] leading-[1.6] text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/registrasi"
            className="focus-ring font-semibold text-ink underline-offset-4 transition-colors hover:text-[#8b6f4e] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
