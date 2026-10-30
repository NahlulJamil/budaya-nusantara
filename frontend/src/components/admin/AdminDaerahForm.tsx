"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@/components/ui/icons";
import {
  PROVINCE_GROUPS,
  PROVINCE_NAMES,
} from "@/data/indonesiaProvinces";
import {
  AdminApiError,
  createAdminDaerah,
  updateAdminDaerah,
  type AdminDaerahCreatePayload,
  type AdminDaerahDetail,
  type AdminDaerahUpdatePayload,
} from "@/lib/adminApi";

const CUSTOM_PROVINCE = "__custom__";
const MAX_TEXT_FIELD = 255;

const CONTROL_BASE =
  "focus-ring w-full rounded-lg border bg-paper px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40 disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted";

function controlClass(error: string | undefined, extra = ""): string {
  return `${CONTROL_BASE} ${error ? "border-red-300" : "border-line"} ${extra}`;
}

function inputClass(error: string | undefined): string {
  return controlClass(error, "h-11");
}

function textareaClass(error: string | undefined): string {
  return controlClass(error, "min-h-[104px] resize-y py-3 leading-[1.7]");
}

function firstErrors(errors: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, messages] of Object.entries(errors)) {
    if (messages.length > 0) {
      result[key] = messages[0];
    }
  }

  return result;
}

function Field({
  id,
  label,
  required = false,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-medium text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-red-600" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <span className="text-[10.5px] tracking-[0.02em] text-muted">
            {hint}
          </span>
        ) : null}
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

interface AdminDaerahFormProps {
  mode?: "create" | "edit";
  daerah?: AdminDaerahDetail;
  initialProvinsi?: string;
  initialNama?: string;
}

export function AdminDaerahForm({
  mode = "create",
  daerah,
  initialProvinsi = "",
  initialNama,
}: AdminDaerahFormProps) {
  const router = useRouter();
  const { expireSession } = useAdminAuth();

  const startingProvinsi = (daerah?.provinsi ?? initialProvinsi).trim();
  const startWithCustom =
    startingProvinsi !== "" && !PROVINCE_NAMES.includes(startingProvinsi);

  const [nama, setNama] = useState(
    daerah?.nama ??
      (initialNama !== undefined
        ? initialNama
        : initialProvinsi.trim()
          ? initialProvinsi.trim()
          : ""),
  );
  const [provinsiChoice, setProvinsiChoice] = useState(
    startingProvinsi === ""
      ? ""
      : startWithCustom
        ? CUSTOM_PROVINCE
        : startingProvinsi,
  );
  const [customProvinsi, setCustomProvinsi] = useState(
    startWithCustom ? startingProvinsi : "",
  );
  const [deskripsi, setDeskripsi] = useState(daerah?.deskripsi ?? "");

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<{ id: number; nama: string } | null>(null);

  const provinsi =
    provinsiChoice === CUSTOM_PROVINCE ? customProvinsi : provinsiChoice;

  useEffect(() => {
    if (!saved) {
      return;
    }

    const handle = setTimeout(() => router.push("/admin/daerah"), 1800);
    return () => clearTimeout(handle);
  }, [saved, router]);

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

    if (!nama.trim()) {
      errors.nama = "Nama daerah wajib diisi.";
    } else if (nama.trim().length > MAX_TEXT_FIELD) {
      errors.nama = `Nama daerah maksimal ${MAX_TEXT_FIELD} karakter.`;
    }

    if (!provinsi.trim()) {
      errors.provinsi = "Pilih provinsi.";
    } else if (provinsi.trim().length > MAX_TEXT_FIELD) {
      errors.provinsi = `Provinsi maksimal ${MAX_TEXT_FIELD} karakter.`;
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || saved) {
      return;
    }

    if (mode === "edit" && !daerah) {
      setFormError("Data daerah tidak tersedia. Muat ulang halaman edit.");
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
      const base = {
        nama: nama.trim(),
        provinsi: provinsi.trim(),
      };

      if (mode === "edit" && daerah) {
        const payload: AdminDaerahUpdatePayload = {
          ...base,
          deskripsi: deskripsi.trim() || null,
        };
        const response = await updateAdminDaerah(daerah.id, payload);

        setSaved({ id: response.data.id, nama: response.data.nama });
      } else {
        const payload: AdminDaerahCreatePayload = {
          ...base,
          ...(deskripsi.trim() ? { deskripsi: deskripsi.trim() } : {}),
        };
        const response = await createAdminDaerah(payload);

        setSaved({ id: response.data.id, nama: response.data.nama });
      }
    } catch (error) {
      if (error instanceof AdminApiError) {
        if (error.status === 401 || error.status === 403) {
          expireSession(error.status === 403 ? "forbidden" : undefined);
          return;
        }

        if (error.status === 422 && Object.keys(error.errors).length > 0) {
          setServerErrors(firstErrors(error.errors));
          setFormError("Beberapa kolom belum sesuai. Periksa kembali.");
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

  if (saved) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 sm:p-8"
      >
        <CheckCircleIcon className="h-7 w-7 text-green-700" />
        <h2 className="mt-3 font-serif text-[22px] leading-tight text-ink">
          {mode === "edit"
            ? "Daerah berhasil diperbarui"
            : "Daerah berhasil ditambahkan"}
        </h2>
        <p className="mt-2 max-w-[560px] text-[13px] leading-[1.8] text-muted">
          Daerah <span className="text-ink">{saved.nama}</span> tersimpan dengan
          provinsi <span className="text-ink">{provinsi.trim()}</span>.
          Mengarahkan ke daftar daerah...
        </p>
        <Link
          href="/admin/daerah"
          className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
        >
          Ke daftar daerah sekarang
        </Link>
      </section>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-6">
      {formError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </p>
      ) : null}

      <section className="rounded-xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="font-serif text-[20px] leading-tight text-ink">
          Informasi daerah
        </h2>
        <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-[1.75] text-muted">
          Daerah menghubungkan konten budaya dan aksara dengan provinsi asalnya.
          Kolom bertanda bintang wajib diisi.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="daerah-nama"
            label="Nama daerah"
            required
            hint={`${nama.trim().length}/${MAX_TEXT_FIELD}`}
            error={fieldError("nama")}
          >
            <input
              id="daerah-nama"
              type="text"
              value={nama}
              onChange={(event) => {
                setNama(event.target.value);
                clearFieldError("nama");
              }}
              maxLength={MAX_TEXT_FIELD}
              placeholder="Contoh: Surakarta"
              aria-invalid={Boolean(fieldError("nama"))}
              aria-describedby={
                fieldError("nama") ? "daerah-nama-error" : undefined
              }
              className={inputClass(fieldError("nama"))}
            />
          </Field>

          <Field
            id="daerah-provinsi"
            label="Provinsi"
            required
            hint="38 provinsi Indonesia"
            error={fieldError("provinsi")}
          >
            <select
              id="daerah-provinsi"
              value={provinsiChoice}
              onChange={(event) => {
                setProvinsiChoice(event.target.value);
                clearFieldError("provinsi");
              }}
              aria-invalid={Boolean(fieldError("provinsi"))}
              aria-describedby={
                fieldError("provinsi") ? "daerah-provinsi-error" : undefined
              }
              className={inputClass(fieldError("provinsi"))}
            >
              <option value="">Pilih provinsi</option>
              {PROVINCE_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.name}>
                  {group.provinces.map((province) => (
                    <option key={province.name} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={CUSTOM_PROVINCE}>Provinsi lain (isi manual)</option>
            </select>
          </Field>

          {provinsiChoice === CUSTOM_PROVINCE ? (
            <Field
              id="daerah-provinsi-manual"
              label="Nama provinsi manual"
              required
              error={fieldError("provinsi")}
              className="sm:col-span-2"
            >
              <input
                id="daerah-provinsi-manual"
                type="text"
                value={customProvinsi}
                onChange={(event) => {
                  setCustomProvinsi(event.target.value);
                  clearFieldError("provinsi");
                }}
                maxLength={MAX_TEXT_FIELD}
                placeholder="Contoh: Sumatra Barat"
                aria-invalid={Boolean(fieldError("provinsi"))}
                aria-describedby={
                  fieldError("provinsi")
                    ? "daerah-provinsi-manual-error"
                    : undefined
                }
                className={inputClass(fieldError("provinsi"))}
              />
            </Field>
          ) : null}

          <Field
            id="daerah-deskripsi"
            label="Deskripsi"
            hint="Opsional"
            error={fieldError("deskripsi")}
            className="sm:col-span-2"
          >
            <textarea
              id="daerah-deskripsi"
              value={deskripsi}
              onChange={(event) => {
                setDeskripsi(event.target.value);
                clearFieldError("deskripsi");
              }}
              placeholder="Ringkasan singkat tentang daerah ini."
              aria-invalid={Boolean(fieldError("deskripsi"))}
              aria-describedby={
                fieldError("deskripsi") ? "daerah-deskripsi-error" : undefined
              }
              className={textareaClass(fieldError("deskripsi"))}
            />
          </Field>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-cream px-4 py-3 text-[11.5px] leading-[1.7] text-muted">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          <p>
            Pilihan provinsi mengikuti 38 provinsi yang ada di Indonesia. Gunakan
            opsi manual hanya untuk ejaan lama atau wilayah di luar daftar.
          </p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/daerah"
          className="focus-ring inline-flex h-10 items-center justify-center rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring inline-flex h-10 items-center justify-center rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting
            ? "Menyimpan..."
            : mode === "edit"
              ? "Simpan perubahan"
              : "Tambah daerah"}
        </button>
      </div>
    </form>
  );
}
