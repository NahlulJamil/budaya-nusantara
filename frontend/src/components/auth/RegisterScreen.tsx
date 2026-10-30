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
  registerUser,
  writeUserToken,
} from "@/lib/userApi";

const MAX_USERNAME = 255;
const MAX_EMAIL = 255;
const MIN_PASSWORD = 8;

const SUBMIT_CLASS =
  "focus-ring inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0d0d0b] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-65";

interface NameParts {
  firstName: string;
  lastName: string;
}

/** Backend hanya menyimpan `username`, jadi nama depan dan belakang digabung. */
function composeUsername({ firstName, lastName }: NameParts): string {
  return `${firstName.trim()} ${lastName.trim()}`
    .replace(/\s+/g, " ")
    .trim();
}

export function RegisterScreen() {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

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
    const username = composeUsername({ firstName, lastName });
    const cleanEmail = email.trim();

    if (!firstName.trim()) {
      errors.username = "Nama depan wajib diisi.";
    } else if (username.length > MAX_USERNAME) {
      errors.username = `Nama maksimal ${MAX_USERNAME} karakter.`;
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
      const response = await registerUser(
        composeUsername({ firstName, lastName }),
        email.trim(),
        password,
        passwordConfirmation,
      );

      // Backend mengembalikan token pada registrasi, jadi sesi bisa langsung dipakai.
      writeUserToken(response.data.token);
      router.replace("/galeri");
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

          setFieldErrors(nextErrors);
          setFormError(
            Object.keys(nextErrors).length > 0 ? null : error.message,
          );
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

  return (
    <AuthShell>
      <AuthCard labelledBy="registrasi-heading">
        <h1
          id="registrasi-heading"
          className="font-serif text-[clamp(29px,4.4vw,35px)] leading-[1.12] font-normal tracking-[-0.015em] text-ink"
        >
          Create an Account
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
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                id="registrasi-first-name"
                name="first_name"
                label="First Name"
                type="text"
                autoComplete="given-name"
                placeholder="Nama depan"
                value={firstName}
                maxLength={MAX_USERNAME}
                disabled={submitting}
                error={fieldErrors.username}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearFieldError("username");
                }}
              />

              <TextField
                id="registrasi-last-name"
                name="last_name"
                label="Last Name"
                type="text"
                autoComplete="family-name"
                placeholder="Nama belakang"
                value={lastName}
                maxLength={MAX_USERNAME}
                disabled={submitting}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearFieldError("username");
                }}
              />
            </div>
          </div>

          <TextField
            id="registrasi-email"
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
            id="registrasi-password"
            name="password"
            label="Password"
            hint={`min. ${MIN_PASSWORD} karakter`}
            autoComplete="new-password"
            placeholder="Buat password"
            value={password}
            disabled={submitting}
            error={fieldErrors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
              clearFieldError("password_confirmation");
            }}
          />

          <PasswordField
            id="registrasi-password-confirmation"
            name="password_confirmation"
            label="Confirm Password"
            autoComplete="new-password"
            placeholder="Ulangi password"
            value={passwordConfirmation}
            disabled={submitting}
            error={fieldErrors.password_confirmation}
            onChange={(event) => {
              setPasswordConfirmation(event.target.value);
              clearFieldError("password_confirmation");
            }}
          />

          <button
            type="submit"
            disabled={submitting}
            className={`${SUBMIT_CLASS} mt-1`}
          >
            {submitting ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12.5px] leading-[1.6] text-muted">
          Have an account?{" "}
          <Link
            href="/login"
            className="focus-ring font-semibold text-ink underline-offset-4 transition-colors hover:text-[#8b6f4e] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
