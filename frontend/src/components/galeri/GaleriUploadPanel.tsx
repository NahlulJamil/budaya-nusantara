"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AppImage } from "@/components/ui/AppImage";
import {
  AlertIcon,
  CheckCircleIcon,
  CloseIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { CATEGORY_LABELS } from "@/lib/api";
import type { CulturalContentSummary, GaleriPostSummary } from "@/lib/types";
import {
  UserApiError,
  fetchPublishedContents,
  loginUser,
  uploadGaleri,
  type UserSummary,
} from "@/lib/userApi";

const MAX_MEDIA = 5;
const MAX_MEDIA_SIZE = 2 * 1024 * 1024;
const MAX_TITLE = 255;
const MAX_LOCATION = 255;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_ATTR = "image/jpeg,image/png,image/webp";

interface SelectedMedia {
  key: string;
  file: File;
  url: string;
}

let mediaKeyCounter = 0;

const CONTROL_BASE =
  "focus-ring w-full rounded-lg border bg-paper px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40 disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted";

function controlClass(error: string | undefined, extra = ""): string {
  return `${CONTROL_BASE} ${error ? "border-red-300" : "border-line"} ${extra}`;
}

function inputClass(error: string | undefined): string {
  return controlClass(error, "h-11");
}

function textareaClass(error: string | undefined): string {
  return controlClass(error, "min-h-[88px] resize-y py-3 leading-[1.7]");
}

function validateFiles(files: File[]): string | null {
  if (files.some((file) => !ACCEPTED_TYPES.includes(file.type))) {
    return "Format foto harus JPG, PNG, atau WebP.";
  }

  if (files.some((file) => file.size > MAX_MEDIA_SIZE)) {
    return "Ukuran setiap foto maksimal 2 MB.";
  }

  return null;
}

function firstMessage(errors: Record<string, string[]>, key: string): string | undefined {
  return errors[key]?.[0];
}

interface LoginFormProps {
  onAuthenticated: (token: string, user: UserSummary) => void;
}

function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: Record<string, string> = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Format email tidak valid.";
    }

    if (!password) {
      errors.password = "Password wajib diisi.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const response = await loginUser(cleanEmail, password);
      onAuthenticated(response.data.token, response.data.user);
    } catch (error) {
      if (error instanceof UserApiError) {
        const nextErrors: Record<string, string> = {};
        const emailError = firstMessage(error.errors, "email");
        const passwordError = firstMessage(error.errors, "password");

        if (emailError) {
          nextErrors.email = emailError;
        }
        if (passwordError) {
          nextErrors.password = passwordError;
        }

        setFieldErrors(nextErrors);
        setFormError(
          Object.keys(nextErrors).length > 0 ? null : error.message,
        );
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
      {formError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </p>
      ) : null}

      <div>
        <label htmlFor="galeri-email" className="text-[12px] font-medium text-ink">
          Email
        </label>
        <input
          id="galeri-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.email;
              return next;
            });
            setFormError(null);
          }}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "galeri-email-error" : undefined}
          placeholder="nama@contoh.com"
          className={`mt-2 ${inputClass(fieldErrors.email)}`}
        />
        {fieldErrors.email ? (
          <p id="galeri-email-error" className="mt-1.5 text-[11.5px] text-red-700">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="galeri-password"
          className="text-[12px] font-medium text-ink"
        >
          Password
        </label>
        <input
          id="galeri-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.password;
              return next;
            });
            setFormError(null);
          }}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "galeri-password-error" : undefined
          }
          placeholder="Password akun"
          className={`mt-2 ${inputClass(fieldErrors.password)}`}
        />
        {fieldErrors.password ? (
          <p
            id="galeri-password-error"
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
        {submitting ? "Memeriksa..." : "Masuk untuk mengunggah"}
      </button>

      <p className="text-[11px] leading-[1.7] text-muted">
        Sesi hanya tersimpan di tab ini. Setelah masuk, kiriman yang valid
        langsung tampil di galeri publik tanpa persetujuan admin.
      </p>

      <p className="text-[11.5px] leading-[1.7] text-muted">
        Belum punya akun?{" "}
        <Link
          href="/registrasi"
          className="focus-ring font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
        >
          Buat akun baru
        </Link>
        .
      </p>
    </form>
  );
}

interface UploadFormProps {
  token: string;
  user: UserSummary;
  onLogout: () => void;
  onUploaded: (post: GaleriPostSummary) => void;
}

function UploadForm({ token, user, onLogout, onUploaded }: UploadFormProps) {
  const [contents, setContents] = useState<CulturalContentSummary[]>([]);
  const [contentsLoading, setContentsLoading] = useState(true);
  const [contentsError, setContentsError] = useState<string | null>(null);
  const [contentsReloadKey, setContentsReloadKey] = useState(0);

  const [title, setTitle] = useState("");
  const [contentId, setContentId] = useState("" as "" | number);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [media, setMedia] = useState<SelectedMedia[]>([]);

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrls.current;

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchPublishedContents()
      .then((data) => {
        if (active) {
          setContents(data);
          setContentsError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setContentsError(
            error instanceof UserApiError
              ? error.message
              : "Gagal memuat daftar konten budaya.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setContentsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [contentsReloadKey]);

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

  function resetMedia(): void {
    for (const item of media) {
      URL.revokeObjectURL(item.url);
    }
    objectUrls.current = [];
    setMedia([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFiles(files: FileList | null): void {
    if (!files || files.length === 0) {
      return;
    }

    const incoming = Array.from(files);
    const room = MAX_MEDIA - media.length;

    if (room <= 0) {
      setFormError(`Maksimal ${MAX_MEDIA} foto per kiriman.`);
      return;
    }

    const accepted = incoming.slice(0, room);
    const invalidFormat = accepted.find(
      (file) => !ACCEPTED_TYPES.includes(file.type),
    );

    if (invalidFormat) {
      setFormError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }

    const tooLarge = accepted.find((file) => file.size > MAX_MEDIA_SIZE);

    if (tooLarge) {
      setFormError("Ukuran setiap foto maksimal 2 MB.");
      return;
    }

    const next = accepted.map<SelectedMedia>((file) => {
      mediaKeyCounter += 1;
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      return { key: `media-${mediaKeyCounter}`, file, url };
    });

    setMedia((current) => [...current, ...next]);
    clearFieldError("media");
    setFormError(
      incoming.length > room
        ? `Hanya ${room} foto yang ditambahkan karena batas maksimal ${MAX_MEDIA} foto.`
        : null,
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeMedia(key: string): void {
    setMedia((current) => {
      const target = current.find((item) => item.key === key);
      if (target) {
        URL.revokeObjectURL(target.url);
        objectUrls.current = objectUrls.current.filter(
          (url) => url !== target.url,
        );
      }
      return current.filter((item) => item.key !== key);
    });
    clearFieldError("media");
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Judul wajib diisi.";
    } else if (title.trim().length > MAX_TITLE) {
      errors.title = `Judul maksimal ${MAX_TITLE} karakter.`;
    }

    if (contentId === "") {
      errors.content_id = "Pilih konten budaya terkait.";
    }

    if (location.trim().length > MAX_LOCATION) {
      errors.location = `Lokasi maksimal ${MAX_LOCATION} karakter.`;
    }

    if (media.length === 0) {
      errors.media = "Pilih minimal satu foto (JPG, PNG, atau WebP).";
    } else {
      const fileError = validateFiles(media.map((item) => item.file));
      if (fileError) {
        errors.media = fileError;
      }
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
    setSuccess(null);

    try {
      const response = await uploadGaleri(token, {
        title: title.trim(),
        content_id: Number(contentId),
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
        activity_date: activityDate || undefined,
        media: media.map((item) => item.file),
      });

      setSuccess(response.message);
      setTitle("");
      setContentId("");
      setCaption("");
      setLocation("");
      setActivityDate("");
      resetMedia();
      onUploaded(response.data);
    } catch (error) {
      if (error instanceof UserApiError) {
        if (error.status === 401) {
          onLogout();
          return;
        }

        if (error.status === 422) {
          const nextErrors: Record<string, string> = {};

          for (const key of ["title", "content_id", "caption", "location", "activity_date"]) {
            const message = firstMessage(error.errors, key);
            if (message) {
              nextErrors[key] = message;
            }
          }

          const mediaError =
            firstMessage(error.errors, "media") ??
            Object.entries(error.errors).find(([key]) =>
              key.startsWith("media."),
            )?.[1]?.[0];

          if (mediaError) {
            nextErrors.media = mediaError;
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="text-[12px] leading-[1.6] text-muted">
          Masuk sebagai{" "}
          <span className="font-medium text-ink">{user.username}</span>
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="focus-ring inline-flex h-8 items-center rounded-md border border-line bg-paper px-2.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          Keluar
        </button>
      </div>

      {success ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[12.5px] leading-[1.7] text-green-900"
        >
          <p className="flex items-center gap-2 font-medium">
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
            {success}
          </p>
          <p className="mt-1 text-green-800">
            Kirimanmu sudah tampil di galeri publik di bawah ini.
          </p>
        </div>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </p>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="galeri-judul" className="text-[12px] font-medium text-ink">
                Judul kiriman<span className="ml-1 text-red-600">*</span>
              </label>
              <span className="text-[10.5px] text-muted">
                {title.trim().length}/{MAX_TITLE}
              </span>
            </div>
            <input
              id="galeri-judul"
              type="text"
              value={title}
              maxLength={MAX_TITLE}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError("title");
              }}
              placeholder="Contoh: Menenun kain di Sumba"
              aria-invalid={Boolean(fieldError("title"))}
              aria-describedby={fieldError("title") ? "galeri-judul-error" : undefined}
              className={`mt-2 ${inputClass(fieldError("title"))}`}
            />
            {fieldError("title") ? (
              <p id="galeri-judul-error" className="mt-1.5 text-[11.5px] text-red-700">
                {fieldError("title")}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="galeri-konten"
              className="text-[12px] font-medium text-ink"
            >
              Konten budaya terkait<span className="ml-1 text-red-600">*</span>
            </label>
            <select
              id="galeri-konten"
              value={contentId === "" ? "" : String(contentId)}
              onChange={(event) => {
                setContentId(
                  event.target.value === "" ? "" : Number(event.target.value),
                );
                clearFieldError("content_id");
              }}
              disabled={contentsLoading || Boolean(contentsError)}
              aria-invalid={Boolean(fieldError("content_id"))}
              aria-describedby={
                fieldError("content_id") ? "galeri-konten-error" : undefined
              }
              className={`mt-2 ${inputClass(fieldError("content_id"))}`}
            >
              <option value="">
                {contentsLoading ? "Memuat konten..." : "Pilih konten"}
              </option>
              {contents.map((content) => (
                <option key={content.id} value={content.id}>
                  {content.title} — {CATEGORY_LABELS[content.category]}
                </option>
              ))}
            </select>
            {contentsError ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-red-700">
                <span>{contentsError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setContentsLoading(true);
                    setContentsError(null);
                    setContentsReloadKey((key) => key + 1);
                  }}
                  className="focus-ring inline-flex items-center gap-1 rounded-md border border-red-200 bg-paper px-2 py-0.5 font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  <RefreshIcon className="h-3 w-3" />
                  Coba lagi
                </button>
              </div>
            ) : null}
            {fieldError("content_id") ? (
              <p id="galeri-konten-error" className="mt-1.5 text-[11.5px] text-red-700">
                {fieldError("content_id")}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="galeri-tanggal" className="text-[12px] font-medium text-ink">
              Tanggal dokumentasi
            </label>
            <input
              id="galeri-tanggal"
              type="date"
              value={activityDate}
              onChange={(event) => {
                setActivityDate(event.target.value);
                clearFieldError("activity_date");
              }}
              aria-invalid={Boolean(fieldError("activity_date"))}
              className={`mt-2 ${inputClass(fieldError("activity_date"))}`}
            />
            {fieldError("activity_date") ? (
              <p className="mt-1.5 text-[11.5px] text-red-700">
                {fieldError("activity_date")}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="galeri-lokasi" className="text-[12px] font-medium text-ink">
              Lokasi
            </label>
            <input
              id="galeri-lokasi"
              type="text"
              value={location}
              maxLength={MAX_LOCATION}
              onChange={(event) => {
                setLocation(event.target.value);
                clearFieldError("location");
              }}
              placeholder="Contoh: Sumba, Nusa Tenggara Timur"
              aria-invalid={Boolean(fieldError("location"))}
              className={`mt-2 ${inputClass(fieldError("location"))}`}
            />
            {fieldError("location") ? (
              <p className="mt-1.5 text-[11.5px] text-red-700">
                {fieldError("location")}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="galeri-caption" className="text-[12px] font-medium text-ink">
              Cerita singkat
            </label>
            <textarea
              id="galeri-caption"
              value={caption}
              onChange={(event) => {
                setCaption(event.target.value);
                clearFieldError("caption");
              }}
              placeholder="Ceritakan momen dalam foto ini."
              aria-invalid={Boolean(fieldError("caption"))}
              className={`mt-2 ${textareaClass(fieldError("caption"))}`}
            />
            {fieldError("caption") ? (
              <p className="mt-1.5 text-[11.5px] text-red-700">
                {fieldError("caption")}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="galeri-foto" className="text-[12px] font-medium text-ink">
              Foto<span className="ml-1 text-red-600">*</span>
            </label>
            <span className="text-[10.5px] text-muted">
              {media.length}/{MAX_MEDIA} · JPG/PNG/WebP · maks 2 MB
            </span>
          </div>

          <input
            ref={fileInputRef}
            id="galeri-foto"
            type="file"
            accept={ACCEPTED_ATTR}
            multiple
            onChange={(event) => handleFiles(event.target.files)}
            aria-invalid={Boolean(fieldError("media"))}
            aria-describedby={fieldError("media") ? "galeri-foto-error" : undefined}
            className="focus-ring mt-2 block w-full cursor-pointer rounded-lg border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-muted file:mr-3 file:rounded-md file:border-0 file:bg-night file:px-3 file:py-1.5 file:text-[11.5px] file:font-medium file:text-[#f6f2e7]"
          />

          {fieldError("media") ? (
            <p id="galeri-foto-error" className="mt-1.5 text-[11.5px] text-red-700">
              {fieldError("media")}
            </p>
          ) : null}

          {media.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((item) => (
                <li
                  key={item.key}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-cream"
                >
                  <AppImage
                    src={item.url}
                    alt={item.file.name}
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(item.key)}
                    aria-label={`Hapus ${item.file.name}`}
                    className="focus-ring absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-night/80 text-[#f6f2e7] transition-colors hover:bg-night"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[380px] text-[11px] leading-[1.65] text-muted">
            Kiriman yang valid langsung tampil di galeri publik. Kamu tetap bisa
            melaporkan kiriman yang tidak pantas.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Mengunggah..." : "Unggah ke galeri"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface GaleriUploadPanelProps {
  token: string | null;
  user: UserSummary | null;
  sessionLoading: boolean;
  onAuthenticated: (token: string, user: UserSummary) => void;
  onLogout: () => void;
  onUploaded: (post: GaleriPostSummary) => void;
}

export function GaleriUploadPanel({
  token,
  user,
  sessionLoading,
  onAuthenticated,
  onLogout,
  onUploaded,
}: GaleriUploadPanelProps) {
  return (
    <section
      id="masuk"
      aria-labelledby="galeri-unggah-heading"
      className="scroll-mt-24 rounded-xl border border-line bg-paper p-5 sm:p-6"
    >
      <p className="eyebrow">Kontribusi</p>
      <h2
        id="galeri-unggah-heading"
        className="mt-2 font-serif text-[clamp(24px,2.6vw,30px)] leading-tight text-ink"
      >
        Bagikan dokumentasimu
      </h2>
      <p className="mt-2 max-w-[560px] text-[12.5px] leading-[1.75] text-muted">
        Unggah foto tradisi, kuliner, atau pertunjukan yang kamu temui. Kiriman
        yang valid langsung tampil di galeri publik — tanpa menunggu persetujuan
        admin.
      </p>

      {sessionLoading ? (
        <div
          aria-busy="true"
          aria-label="Memeriksa sesi"
          className="mt-5 h-36 rounded-lg skeleton"
        />
      ) : token && user ? (
        <UploadForm
          token={token}
          user={user}
          onLogout={onLogout}
          onUploaded={onUploaded}
        />
      ) : (
        <LoginForm onAuthenticated={onAuthenticated} />
      )}
    </section>
  );
}
