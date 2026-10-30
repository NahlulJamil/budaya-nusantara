import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AppImage } from "@/components/ui/AppImage";
import {
  AlertIcon,
  CheckCircleIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from "@/components/ui/icons";
import {
  AdminApiError,
  createAdminBudaya,
  fetchJenisTradisiOptions,
  updateAdminBudaya,
  uploadAdminMedia,
  type AdminBudayaContentDetail,
  type AdminBudayaCreatePayload,
  type AdminBudayaDetailPayload,
  type AdminBudayaUpdatePayload,
  type AdminBudayaVariantData,
  type AdminBudayaVariantGender,
  type AdminBudayaVariantPayload,
  type AdminContentStatus,
  type AdminMediaPurpose,
} from "@/lib/adminApi";
import { PROVINCE_GROUPS, PROVINCE_NAMES } from "@/data/indonesiaProvinces";
import { CATEGORY_LABELS, resolveMediaUrl } from "@/lib/api";
import type { CulturalCategory } from "@/lib/types";

const CATEGORY_ORDER: CulturalCategory[] = [
  "tradisi",
  "baju_adat",
  "makanan",
  "alat_musik",
];

const MAX_VARIANTS = 10;
const MAX_TEXT_FIELD = 255;

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const AUDIO_ACCEPT =
  "audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a";
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MEDIA_INPUT_CLASS =
  "focus-ring mt-2 block w-full cursor-pointer rounded-lg border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-muted file:mr-3 file:rounded-md file:border-0 file:bg-night file:px-3 file:py-1.5 file:text-[11.5px] file:font-medium file:text-[#f6f2e7]";

interface VariantField {
  key: string;
  gender: "" | AdminBudayaVariantGender;
  avatarImage: string;
  avatarFile: File | null;
  avatarObjectUrl: string | null;
  description: string;
}

interface DetailFields {
  jenisTradisiId: number | null;
  process: string;
  values: string;
  implementationTime: string;
  usage: string;
  variants: VariantField[];
  ingredients: string;
  recipe: string;
  servingMethod: string;
  material: string;
  howToPlay: string;
  func: string;
  audio: string;
}

function createInitialDetail(): DetailFields {
  return {
    jenisTradisiId: null,
    process: "",
    values: "",
    implementationTime: "",
    usage: "",
    variants: [],
    ingredients: "",
    recipe: "",
    servingMethod: "",
    material: "",
    howToPlay: "",
    func: "",
    audio: "",
  };
}

let variantKeyCounter = 0;

function createVariantKey(): string {
  variantKeyCounter += 1;
  return `variant-${variantKeyCounter}`;
}

function textValue(value: string | null | undefined): string {
  return value ?? "";
}

/** Error khusus agar submit berhenti tanpa menimpa pesan field media. */
class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

function fileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

function imageFileError(file: File): string | null {
  if (!IMAGE_EXTENSIONS.includes(fileExtension(file.name))) {
    return "Format gambar harus JPG, PNG, atau WebP.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Ukuran gambar maksimal 2 MB.";
  }

  return null;
}

function audioFileError(file: File): string | null {
  if (!AUDIO_EXTENSIONS.includes(fileExtension(file.name))) {
    return "Format audio harus MP3, WAV, OGG, atau M4A.";
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return "Ukuran audio maksimal 10 MB.";
  }

  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function revokeObjectUrls(urls: Set<string>): void {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }

  urls.clear();
}

function variantAvatarUrl(variant: VariantField): string | null {
  return (
    variant.avatarObjectUrl ??
    resolveMediaUrl(variant.avatarImage.trim() || null)
  );
}

/** Ubah `detail` pada respons API menjadi state form edit. */
function detailFromContent(content?: AdminBudayaContentDetail): DetailFields {
  const initial = createInitialDetail();
  const detail = content?.detail;

  if (!detail) {
    return initial;
  }

  return {
    jenisTradisiId:
      typeof detail.jenis_tradisi_id === "number"
        ? detail.jenis_tradisi_id
        : null,
    process: textValue(detail.process),
    values: textValue(detail.values),
    implementationTime: textValue(detail.implementation_time),
    usage: textValue(detail.usage),
    variants: (detail.variants ?? []).map(
      (variant: AdminBudayaVariantData) => ({
        key: createVariantKey(),
        gender: variant.gender,
        avatarImage: textValue(variant.avatar_image),
        avatarFile: null,
        avatarObjectUrl: null,
        description: textValue(variant.description),
      }),
    ),
    ingredients: textValue(detail.ingredients),
    recipe: textValue(detail.recipe),
    servingMethod: textValue(detail.serving_method),
    material: textValue(detail.material),
    howToPlay: textValue(detail.how_to_play),
    func: textValue(detail.function),
    audio: textValue(detail.audio),
  };
}

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

function buildDetailPayload(
  category: CulturalCategory,
  detail: DetailFields,
  mode: "create" | "edit",
): AdminBudayaDetailPayload {
  const full = mode === "edit";

  switch (category) {
    case "tradisi": {
      const payload: AdminBudayaDetailPayload = {};

      if (detail.jenisTradisiId !== null) {
        payload.jenis_tradisi_id = detail.jenisTradisiId;
      }

      if (full || detail.process.trim()) {
        payload.process = detail.process.trim();
      }

      if (full || detail.values.trim()) {
        payload.values = detail.values.trim();
      }

      if (full || detail.implementationTime.trim()) {
        payload.implementation_time = detail.implementationTime.trim();
      }

      return payload;
    }
    case "baju_adat": {
      const payload: AdminBudayaDetailPayload = {};

      if (full || detail.usage.trim()) {
        payload.usage = detail.usage.trim();
      }

      // Saat edit, array kosong tetap dikirim agar varian yang dihapus ikut terhapus.
      if (full || detail.variants.length > 0) {
        payload.variants = detail.variants.map<AdminBudayaVariantPayload>(
          (variant) => {
            const next: AdminBudayaVariantPayload = {
              gender: variant.gender as AdminBudayaVariantGender,
            };

            if (variant.avatarImage.trim()) {
              next.avatar_image = variant.avatarImage.trim();
            }

            if (variant.description.trim()) {
              next.description = variant.description.trim();
            }

            return next;
          },
        );
      }

      return payload;
    }
    case "makanan": {
      const payload: AdminBudayaDetailPayload = {};

      if (full || detail.ingredients.trim()) {
        payload.ingredients = detail.ingredients.trim();
      }

      if (full || detail.recipe.trim()) {
        payload.recipe = detail.recipe.trim();
      }

      if (full || detail.servingMethod.trim()) {
        payload.serving_method = detail.servingMethod.trim();
      }

      return payload;
    }
    case "alat_musik": {
      const payload: AdminBudayaDetailPayload = {};

      if (full || detail.material.trim()) {
        payload.material = detail.material.trim();
      }

      if (full || detail.howToPlay.trim()) {
        payload.how_to_play = detail.howToPlay.trim();
      }

      if (full || detail.func.trim()) {
        payload.function = detail.func.trim();
      }

      if (full) {
        payload.audio = detail.audio.trim() || null;
      } else if (detail.audio.trim()) {
        payload.audio = detail.audio.trim();
      }

      return payload;
    }
    default:
      return {};
  }
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

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-paper p-5 sm:p-6">
      <h2 className="font-serif text-[20px] leading-tight text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-[1.75] text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

interface AdminBudayaFormProps {
  mode?: "create" | "edit";
  content?: AdminBudayaContentDetail;
}

export function AdminBudayaForm({
  mode = "create",
  content,
}: AdminBudayaFormProps) {
  const router = useRouter();
  const { expireSession } = useAdminAuth();

  const [jenisTradisiOptions, setJenisTradisiOptions] = useState<{ id: number; nama: string }[]>([]);
  const [jenisTradisiLoading, setJenisTradisiLoading] = useState(true);
  const [jenisTradisiError, setJenisTradisiError] = useState<string | null>(null);
  const [jenisTradisiReloadKey, setJenisTradisiReloadKey] = useState(0);

  const [provinsi, setProvinsi] = useState(
    content?.daerah?.provinsi ?? "",
  );
  const [category, setCategory] = useState<"" | CulturalCategory>(
    content?.category ?? "",
  );
  const [title, setTitle] = useState(content?.title ?? "");
  const [description, setDescription] = useState(content?.description ?? "");
  const [history, setHistory] = useState(content?.history ?? "");
  const [meaning, setMeaning] = useState(content?.meaning ?? "");
  const [mainImage, setMainImage] = useState(content?.main_image ?? "");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImageObjectUrl, setMainImageObjectUrl] = useState<string | null>(
    null,
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<AdminContentStatus>(
    content?.status ?? "draft",
  );

  const [detail, setDetail] = useState<DetailFields>(() =>
    detailFromContent(content),
  );

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    id: number;
    status: AdminContentStatus;
  } | null>(null);
  const resetCreateOnHideRef = useRef(false);

  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  // Muat pilihan jenis tradisi dari API.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      await Promise.resolve();

      if (!active) {
        return;
      }

      setJenisTradisiLoading(true);

      try {
        const response = await fetchJenisTradisiOptions(50, controller.signal);

        if (!active) {
          return;
        }

        setJenisTradisiOptions(response.data);
        setJenisTradisiError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
          expireSession(error.status === 403 ? "forbidden" : undefined);
          return;
        }

        setJenisTradisiError(
          error instanceof AdminApiError
            ? error.message
            : "Gagal memuat daftar jenis tradisi.",
        );
      } finally {
        if (active) {
          setJenisTradisiLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [expireSession, jenisTradisiReloadKey]);

  // Setelah sukses, tampilkan notifikasi lalu arahkan ke daftar konten.
  useEffect(() => {
    if (!created) {
      return;
    }

    const handle = setTimeout(() => router.push("/admin/budaya"), 2200);
    return () => clearTimeout(handle);
  }, [created, router]);

  // Lepaskan seluruh object URL saat komponen benar-benar dilepas.
  useEffect(() => {
    const urls = objectUrlsRef.current;

    return () => {
      revokeObjectUrls(urls);
    };
  }, []);

  // `cacheComponents` membuat Next.js menyimpan state halaman yang di-hide
  // (React Activity). Setelah create sukses, bersihkan form saat halaman
  // ditinggalkan agar kunjungan berikutnya tidak mewarisi pesan sukses lama.
  useLayoutEffect(() => {
    const urls = objectUrlsRef.current;

    return () => {
      if (!resetCreateOnHideRef.current) {
        return;
      }

      resetCreateOnHideRef.current = false;
      revokeObjectUrls(urls);
      setProvinsi("");
      setCategory("");
      setTitle("");
      setDescription("");
      setHistory("");
      setMeaning("");
      setMainImage("");
      setMainImageFile(null);
      setMainImageObjectUrl(null);
      setAudioFile(null);
      setAudioObjectUrl(null);
      setStatus("draft");
      setDetail(createInitialDetail());
      setClientErrors({});
      setServerErrors({});
      setFormError(null);
      setSubmitting(false);
      setCreated(null);
      setImagePreviewFailed(false);
    };
  }, []);

  function releaseObjectUrl(url: string | null): void {
    if (!url) {
      return;
    }

    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }

  function createObjectUrl(file: File): string {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);

    return url;
  }

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

  function handleCategoryChange(value: string): void {
    for (const variant of detail.variants) {
      releaseObjectUrl(variant.avatarObjectUrl);
    }
    releaseObjectUrl(audioObjectUrl);

    setCategory(value === "" ? "" : (value as CulturalCategory));
    setAudioFile(null);
    setAudioObjectUrl(null);
    // Bersihkan state detail kategori sebelumnya agar payload tidak tercampur.
    setDetail(createInitialDetail());
    setClientErrors({});
    setServerErrors({});
    setFormError(null);
  }

  function addVariant(): void {
    const key = createVariantKey();
    setDetail((current) => {
      if (current.variants.length >= MAX_VARIANTS) {
        return current;
      }
      return {
        ...current,
        variants: [
          ...current.variants,
          {
            key,
            gender: "",
            avatarImage: "",
            avatarFile: null,
            avatarObjectUrl: null,
            description: "",
          },
        ],
      };
    });
  }

  function updateVariant(index: number, patch: Partial<VariantField>): void {
    setDetail((current) => ({
      ...current,
      variants: current.variants.map((variant, position) =>
        position === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  function removeVariant(index: number): void {
    releaseObjectUrl(detail.variants[index]?.avatarObjectUrl ?? null);
    setDetail((current) => ({
      ...current,
      variants: current.variants.filter((_, position) => position !== index),
    }));
    // Indeks varian bergeser, jadi error varian lama tidak lagi valid.
    setClientErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !key.startsWith("detail.variants"),
        ),
      ),
    );
    setServerErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => !key.startsWith("detail.variants"),
        ),
      ),
    );
  }

  function genderUsedElsewhere(
    index: number,
    gender: AdminBudayaVariantGender,
  ): boolean {
    return detail.variants.some(
      (variant, position) => position !== index && variant.gender === gender,
    );
  }

  function updateDetailField<K extends keyof DetailFields>(
    key: K,
    value: DetailFields[K],
  ): void {
    setDetail((current) => ({ ...current, [key]: value }));
  }

  function selectMainImage(file: File | null): void {
    releaseObjectUrl(mainImageObjectUrl);
    setMainImageFile(null);
    setMainImageObjectUrl(null);
    setImagePreviewFailed(false);

    if (!file) {
      return;
    }

    const error = imageFileError(file);

    if (error) {
      setClientErrors((current) => ({ ...current, main_image: error }));
      return;
    }

    setMainImageFile(file);
    setMainImageObjectUrl(createObjectUrl(file));
    clearFieldError("main_image");
  }

  function clearMainImage(): void {
    selectMainImage(null);
    setMainImage("");
    clearFieldError("main_image");
  }

  function selectVariantAvatar(index: number, file: File | null): void {
    const variant = detail.variants[index];

    if (!variant) {
      return;
    }

    releaseObjectUrl(variant.avatarObjectUrl);
    updateVariant(index, { avatarFile: null, avatarObjectUrl: null });

    if (!file) {
      return;
    }

    const error = imageFileError(file);

    if (error) {
      setClientErrors((current) => ({
        ...current,
        [`detail.variants.${index}.avatar_image`]: error,
      }));
      return;
    }

    updateVariant(index, {
      avatarFile: file,
      avatarObjectUrl: createObjectUrl(file),
    });
    clearFieldError(`detail.variants.${index}.avatar_image`);
  }

  function clearVariantAvatar(index: number): void {
    selectVariantAvatar(index, null);
    updateVariant(index, { avatarImage: "" });
    clearFieldError(`detail.variants.${index}.avatar_image`);
  }

  function selectAudio(file: File | null): void {
    releaseObjectUrl(audioObjectUrl);
    setAudioFile(null);
    setAudioObjectUrl(null);

    if (!file) {
      return;
    }

    const error = audioFileError(file);

    if (error) {
      setClientErrors((current) => ({ ...current, "detail.audio": error }));
      return;
    }

    setAudioFile(file);
    setAudioObjectUrl(createObjectUrl(file));
    clearFieldError("detail.audio");
  }

  function clearAudio(): void {
    selectAudio(null);
    updateDetailField("audio", "");
    clearFieldError("detail.audio");
  }

  async function uploadMedia(
    file: File,
    purpose: AdminMediaPurpose,
    errorKey: string,
  ): Promise<string> {
    try {
      const response = await uploadAdminMedia(file, purpose);
      return response.data.path;
    } catch (error) {
      if (error instanceof AdminApiError) {
        if (error.status === 401 || error.status === 403) {
          expireSession(error.status === 403 ? "forbidden" : undefined);
          throw new MediaUploadError(error.message);
        }

        const message = error.errors.file?.[0] ?? error.message;

        setClientErrors((current) => ({ ...current, [errorKey]: message }));
        throw new MediaUploadError(message);
      }

      const message = "Media gagal diunggah. Periksa koneksi lalu coba lagi.";

      setClientErrors((current) => ({ ...current, [errorKey]: message }));
      throw new MediaUploadError(message);
    }
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!provinsi.trim()) {
      errors.provinsi = "Pilih provinsi.";
    }

    if (category === "") {
      errors.category = "Pilih kategori.";
    }

    if (!title.trim()) {
      errors.title = "Judul wajib diisi.";
    } else if (title.trim().length > MAX_TEXT_FIELD) {
      errors.title = `Judul maksimal ${MAX_TEXT_FIELD} karakter.`;
    }

    if (!description.trim()) {
      errors.description = "Deskripsi wajib diisi.";
    }

    if (!history.trim()) {
      errors.history = "Sejarah wajib diisi.";
    }

    if (!meaning.trim()) {
      errors.meaning = "Makna wajib diisi.";
    }

    if (mainImage.trim().length > MAX_TEXT_FIELD) {
      errors.main_image = `Path/URL gambar maksimal ${MAX_TEXT_FIELD} karakter.`;
    }

    if (category === "baju_adat") {
      const used = new Set<string>();

      detail.variants.forEach((variant, index) => {
        if (!variant.gender) {
          errors[`detail.variants.${index}.gender`] = "Pilih gender varian.";
        } else if (used.has(variant.gender)) {
          errors[`detail.variants.${index}.gender`] =
            "Gender ini sudah dipakai varian lain.";
        } else {
          used.add(variant.gender);
        }

        if (variant.avatarImage.trim().length > MAX_TEXT_FIELD) {
          errors[`detail.variants.${index}.avatar_image`] =
            `Path/URL avatar maksimal ${MAX_TEXT_FIELD} karakter.`;
        }
      });
    }

    if (
      category === "alat_musik" &&
      detail.audio.trim().length > MAX_TEXT_FIELD
    ) {
      errors["detail.audio"] = `Path/URL audio maksimal ${MAX_TEXT_FIELD} karakter.`;
    }

    return errors;
  }

  function buildPayload(
    imageValue: string,
    audioValue: string,
    variantsValue: VariantField[],
  ): AdminBudayaCreatePayload | AdminBudayaUpdatePayload {
    const activeCategory = category as CulturalCategory;
    const base = {
      provinsi: provinsi.trim(),
      category: activeCategory,
      title: title.trim(),
      description: description.trim(),
      history: history.trim(),
      meaning: meaning.trim(),
      status,
    };
    const image = imageValue.trim();
    const effectiveDetail: DetailFields = {
      ...detail,
      audio: audioValue,
      variants: variantsValue,
    };

    if (mode === "edit") {
      return {
        ...base,
        main_image: image ? image : null,
        detail: buildDetailPayload(activeCategory, effectiveDetail, "edit"),
      };
    }

    const payload: AdminBudayaCreatePayload = { ...base };

    if (image) {
      payload.main_image = image;
    }

    const detailPayload = buildDetailPayload(
      activeCategory,
      effectiveDetail,
      "create",
    );
    if (Object.keys(detailPayload).length > 0) {
      payload.detail = detailPayload;
    }

    return payload;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || created) {
      return;
    }

    if (mode === "edit" && !content) {
      setFormError("Data konten tidak tersedia. Muat ulang halaman edit.");
      return;
    }

    if (category === "tradisi" && detail.jenisTradisiId === null) {
      setFormError(
        "Konten tradisi belum dapat disimpan tanpa ID jenis tradisi yang valid. Pilih jenis tradisi terlebih dahulu.",
      );
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
      const activeCategory = category as CulturalCategory;
      let resolvedImage = mainImage.trim();
      let resolvedAudio = detail.audio.trim();
      let resolvedVariants = detail.variants;

      if (mainImageFile) {
        resolvedImage = await uploadMedia(
          mainImageFile,
          "image",
          "main_image",
        );
      }

      if (activeCategory === "alat_musik" && audioFile) {
        resolvedAudio = await uploadMedia(
          audioFile,
          "audio",
          "detail.audio",
        );
      }

      if (
        activeCategory === "baju_adat" &&
        detail.variants.some((variant) => variant.avatarFile)
      ) {
        resolvedVariants = await Promise.all(
          detail.variants.map(async (variant, index) => {
            if (!variant.avatarFile) {
              return variant;
            }

            const path = await uploadMedia(
              variant.avatarFile,
              "image",
              `detail.variants.${index}.avatar_image`,
            );

            return {
              ...variant,
              avatarImage: path,
              avatarFile: null,
              avatarObjectUrl: null,
            };
          }),
        );
      }

      const payload = buildPayload(
        resolvedImage,
        resolvedAudio,
        resolvedVariants,
      );
      const response =
        mode === "create" || !content
          ? await createAdminBudaya(payload as AdminBudayaCreatePayload)
          : await updateAdminBudaya(
              content.id,
              payload as AdminBudayaUpdatePayload,
            );
      setCreated({ id: response.data.id, status: response.data.status });

      if (mode === "create") {
        resetCreateOnHideRef.current = true;
      }
    } catch (error) {
      if (error instanceof MediaUploadError) {
        setFormError(error.message);
        return;
      }

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

  const isTradisi = category === "tradisi";
  const keepsJenisTradisi = isTradisi && detail.jenisTradisiId !== null;
  const tradisiBlocked = isTradisi && !keepsJenisTradisi;
  const submitDisabled = submitting || created !== null || tradisiBlocked;
  const previewUrl =
    mainImageObjectUrl ?? resolveMediaUrl(mainImage.trim() || null);
  const audioPreviewUrl =
    audioObjectUrl ?? resolveMediaUrl(detail.audio.trim() || null);

  if (created) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 sm:p-8"
      >
        <CheckCircleIcon className="h-7 w-7 text-green-700" />
        <h2 className="mt-3 font-serif text-[22px] leading-tight text-ink">
          {mode === "edit"
            ? "Konten budaya berhasil diperbarui"
            : "Konten budaya berhasil dibuat"}
        </h2>
        <p className="mt-2 max-w-[560px] text-[13px] leading-[1.8] text-muted">
          Konten <span className="text-ink">#{created.id}</span> tersimpan dengan
          status{" "}
          <span className="text-ink">
            {created.status === "published" ? "Terbit" : "Draf"}
          </span>
          . Mengarahkan ke daftar konten...
        </p>
        <Link
          href="/admin/budaya"
          className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
        >
          Ke daftar konten sekarang
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

      <SectionCard
        title="Data utama"
        description="Informasi dasar konten budaya. Kolom bertanda bintang wajib diisi."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="budaya-provinsi"
            label="Provinsi"
            required
            error={fieldError("provinsi")}
          >
            <select
              id="budaya-provinsi"
              value={provinsi}
              onChange={(event) => {
                setProvinsi(event.target.value);
                clearFieldError("provinsi");
              }}
              aria-invalid={Boolean(fieldError("provinsi"))}
              aria-describedby={
                fieldError("provinsi") ? "budaya-provinsi-error" : undefined
              }
              className={inputClass(fieldError("provinsi"))}
            >
              <option value="">Pilih provinsi</option>
              {provinsi !== "" && !PROVINCE_NAMES.includes(provinsi) ? (
                <option value={provinsi}>{provinsi} (data lama)</option>
              ) : null}
              {PROVINCE_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.name}>
                  {group.provinces.map((province) => (
                    <option key={province.name} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field
            id="budaya-kategori"
            label="Kategori"
            required
            error={fieldError("category")}
          >
            <select
              id="budaya-kategori"
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              aria-invalid={Boolean(fieldError("category"))}
              aria-describedby={
                fieldError("category") ? "budaya-kategori-error" : undefined
              }
              className={inputClass(fieldError("category"))}
            >
              <option value="">Pilih kategori</option>
              {CATEGORY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="budaya-judul"
            label="Judul"
            required
            hint={`${title.trim().length}/${MAX_TEXT_FIELD}`}
            error={fieldError("title")}
            className="sm:col-span-2"
          >
            <input
              id="budaya-judul"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError("title");
              }}
              maxLength={MAX_TEXT_FIELD}
              placeholder="Contoh: Tari Saman"
              aria-invalid={Boolean(fieldError("title"))}
              aria-describedby={
                fieldError("title") ? "budaya-judul-error" : undefined
              }
              className={inputClass(fieldError("title"))}
            />
          </Field>

          <Field
            id="budaya-deskripsi"
            label="Deskripsi"
            required
            error={fieldError("description")}
            className="sm:col-span-2"
          >
            <textarea
              id="budaya-deskripsi"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
              placeholder="Ringkasan singkat tentang konten budaya ini."
              aria-invalid={Boolean(fieldError("description"))}
              aria-describedby={
                fieldError("description") ? "budaya-deskripsi-error" : undefined
              }
              className={textareaClass(fieldError("description"))}
            />
          </Field>

          <Field
            id="budaya-sejarah"
            label="Sejarah"
            required
            error={fieldError("history")}
            className="sm:col-span-2"
          >
            <textarea
              id="budaya-sejarah"
              value={history}
              onChange={(event) => {
                setHistory(event.target.value);
                clearFieldError("history");
              }}
              placeholder="Latar belakang dan sejarah konten budaya."
              aria-invalid={Boolean(fieldError("history"))}
              aria-describedby={
                fieldError("history") ? "budaya-sejarah-error" : undefined
              }
              className={textareaClass(fieldError("history"))}
            />
          </Field>

          <Field
            id="budaya-makna"
            label="Makna"
            required
            error={fieldError("meaning")}
            className="sm:col-span-2"
          >
            <textarea
              id="budaya-makna"
              value={meaning}
              onChange={(event) => {
                setMeaning(event.target.value);
                clearFieldError("meaning");
              }}
              placeholder="Nilai dan makna budaya yang terkandung."
              aria-invalid={Boolean(fieldError("meaning"))}
              aria-describedby={
                fieldError("meaning") ? "budaya-makna-error" : undefined
              }
              className={textareaClass(fieldError("meaning"))}
            />
          </Field>

          <Field
            id="budaya-gambar-file"
            label="Gambar utama"
            hint="Opsional"
            error={fieldError("main_image")}
            className="sm:col-span-2"
          >
            <div className="space-y-3">
              {previewUrl ? (
                <div className="relative aspect-[16/9] w-full max-w-[320px] overflow-hidden rounded-lg border border-line bg-cream">
                  {imagePreviewFailed ? (
                    <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-muted">
                      Gambar tidak dapat dimuat dari path/URL tersebut.
                    </div>
                  ) : (
                    <AppImage
                      src={previewUrl}
                      alt="Pratinjau gambar utama"
                      onError={() => setImagePreviewFailed(true)}
                      className="object-cover"
                    />
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-line bg-cream px-4 py-5 text-center text-[12px] text-muted">
                  Belum ada gambar utama.
                </p>
              )}

              <div>
                <input
                  id="budaya-gambar-file"
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={(event) => {
                    selectMainImage(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                  aria-invalid={Boolean(fieldError("main_image"))}
                  aria-describedby={
                    fieldError("main_image")
                      ? "budaya-gambar-file-error"
                      : undefined
                  }
                  className={MEDIA_INPUT_CLASS}
                />
                <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">
                  JPG, PNG, atau WebP. Maksimal 2 MB dan dimensi 4096 × 4096
                  piksel. File diunggah saat konten disimpan.
                </p>

                {mainImageFile ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-ink">
                    <span className="max-w-full truncate">
                      {mainImageFile.name} (
                      {formatFileSize(mainImageFile.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => selectMainImage(null)}
                      className="focus-ring inline-flex h-7 items-center rounded-md border border-line bg-paper px-2 text-[11px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                    >
                      Batalkan pilihan
                    </button>
                  </div>
                ) : null}

                {mainImage.trim() || mainImageFile ? (
                  <button
                    type="button"
                    onClick={clearMainImage}
                    className="focus-ring mt-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Hapus gambar
                  </button>
                ) : null}
              </div>

              <details className="rounded-lg border border-line bg-cream/60 px-3 py-2">
                <summary className="cursor-pointer text-[11.5px] font-medium text-ink">
                  Opsi lanjutan: path/URL manual
                </summary>
                <input
                  id="budaya-gambar-path"
                  type="text"
                  value={mainImage}
                  aria-label="Path atau URL gambar utama"
                  onChange={(event) => {
                    if (mainImageFile) {
                      selectMainImage(null);
                    }
                    setMainImage(event.target.value);
                    setImagePreviewFailed(false);
                    clearFieldError("main_image");
                  }}
                  maxLength={MAX_TEXT_FIELD}
                  placeholder="Contoh: budaya/tari-saman.jpg atau https://..."
                  aria-invalid={Boolean(fieldError("main_image"))}
                  aria-describedby={
                    fieldError("main_image")
                      ? "budaya-gambar-file-error"
                      : undefined
                  }
                  className={`${inputClass(fieldError("main_image"))} mt-3`}
                />
                <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">
                  Untuk mempertahankan data lama atau memakai URL eksternal.
                  File yang dipilih akan menggantikan nilai ini saat disimpan.
                </p>
              </details>
            </div>
          </Field>

          <Field
            id="budaya-status"
            label="Status"
            hint="Default: Draf"
            error={fieldError("status")}
          >
            <select
              id="budaya-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AdminContentStatus);
                clearFieldError("status");
              }}
              className={inputClass(fieldError("status"))}
            >
              <option value="draft">Draf</option>
              <option value="published">Terbit</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Detail kategori"
        description="Field detail menyesuaikan kategori yang dipilih. Berpindah kategori akan mengosongkan detail sebelumnya."
      >
        {category === "" ? (
          <p className="rounded-lg border border-dashed border-line bg-cream px-4 py-5 text-center text-[12.5px] text-muted">
            Pilih kategori terlebih dahulu untuk menampilkan field detailnya.
          </p>
        ) : null}

        {isTradisi ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              aria-label="Pilih jenis tradisi"
            >
              <label htmlFor="tradisi-jenis" className="text-[10px] font-medium text-muted uppercase">
                Jenis tradisi
              </label>
              <div className="relative">
                <select
                  id="tradisi-jenis"
                  value={detail.jenisTradisiId !== null ? String(detail.jenisTradisiId) : ""}
                  onChange={(event) => {
                    setDetail((current) => ({
                      ...current,
                      jenisTradisiId:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }));
                    clearFieldError("detail.jenis_tradisi_id");
                  }}
                  disabled={jenisTradisiLoading || jenisTradisiError !== null}
                  aria-invalid={jenisTradisiError !== null}
                  aria-describedby={
                    jenisTradisiError !== null ? "tradisi-jenis-error" : undefined
                  }
                  className={inputClass(fieldError("detail.jenis_tradisi_id"))}
                >
                  <option value="">Pilih jenis tradisi</option>
                  {jenisTradisiLoading ? (
                    <option disabled>
                      Memuat jenis tradisi...
                    </option>
                  ) : null}
                  {jenisTradisiOptions.length > 0 ? (
                    jenisTradisiOptions.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.nama}
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      Tidak ada opsi
                    </option>
                  )}
                  {jenisTradisiError ? (
                    <option disabled>
                      {jenisTradisiError}
                    </option>
                  ) : null}
                </select>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-muted rotate-180 absolute right-1 top-1/2 -mx-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 10l6 6 6-6" />
                </svg>
              </div>
              {jenisTradisiError ? (
                <div
                  id="tradisi-jenis-error"
                  className="flex flex-wrap items-center gap-2 text-[10px] text-red-700 sm:col-span-2"
                >
                  <span>{jenisTradisiError}</span>
                  <button
                    type="button"
                    onClick={() => setJenisTradisiReloadKey((key) => key + 1)}
                    className="focus-ring inline-flex items-center gap-1 rounded-md border border-red-200 bg-paper px-2 py-0.5 font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    <RefreshIcon className="h-3 w-3" />
                    Coba lagi
                  </button>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="tradisi-process"
                label="Proses"
                hint="Opsional"
                error={fieldError("detail.process")}
              >
                <textarea
                  id="tradisi-process"
                  value={detail.process}
                  onChange={(event) => {
                    updateDetailField("process", event.target.value);
                    clearFieldError("detail.process");
                  }}
                  placeholder="Proses pelaksanaan tradisi."
                  className={textareaClass(fieldError("detail.process"))}
                />
              </Field>
              <Field
                id="tradisi-values"
                label="Nilai"
                hint="Opsional"
                error={fieldError("detail.values")}
              >
                <textarea
                  id="tradisi-values"
                  value={detail.values}
                  onChange={(event) => {
                    updateDetailField("values", event.target.value);
                    clearFieldError("detail.values");
                  }}
                  placeholder="Nilai budaya yang terkandung."
                  className={textareaClass(fieldError("detail.values"))}
                />
              </Field>
              <Field
                id="tradisi-waktu"
                label="Waktu pelaksanaan"
                hint="Opsional"
                error={fieldError("detail.implementation_time")}
                className="sm:col-span-2"
              >
                <input
                  id="tradisi-waktu"
                  type="text"
                  value={detail.implementationTime}
                  onChange={(event) => {
                    updateDetailField("implementationTime", event.target.value);
                    clearFieldError("detail.implementation_time");
                  }}
                  maxLength={MAX_TEXT_FIELD}
                  placeholder="Contoh: Setiap bulan purnama."
                  className={inputClass(fieldError("detail.implementation_time"))}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {category === "baju_adat" ? (
          <div className="space-y-5">
            <Field
              id="baju-usage"
              label="Penggunaan"
              hint="Opsional"
              error={fieldError("detail.usage")}
            >
              <textarea
                id="baju-usage"
                value={detail.usage}
                onChange={(event) => {
                  updateDetailField("usage", event.target.value);
                  clearFieldError("detail.usage");
                }}
                placeholder="Kapan dan bagaimana pakaian adat ini digunakan."
                aria-invalid={Boolean(fieldError("detail.usage"))}
                aria-describedby={
                  fieldError("detail.usage") ? "baju-usage-error" : undefined
                }
                className={textareaClass(fieldError("detail.usage"))}
              />
            </Field>

            <div className="border-t border-line pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[13px] font-medium text-ink">
                    Varian pakaian
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
                    Maksimal {MAX_VARIANTS} varian. Gender tidak boleh duplikat.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted">
                    {detail.variants.length}/{MAX_VARIANTS}
                  </span>
                  <button
                    type="button"
                    onClick={addVariant}
                    disabled={detail.variants.length >= MAX_VARIANTS}
                    className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Tambah varian
                  </button>
                </div>
              </div>

              {detail.variants.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-line bg-cream px-4 py-4 text-center text-[12px] text-muted">
                  Belum ada varian. Varian bersifat opsional.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {detail.variants.map((variant, index) => (
                    <li
                      key={variant.key}
                      className="rounded-lg border border-line bg-cream/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11.5px] font-medium tracking-[0.04em] text-muted uppercase">
                          Varian {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                          id={`variant-${index}-gender`}
                          label="Gender"
                          required
                          error={fieldError(`detail.variants.${index}.gender`)}
                        >
                          <select
                            id={`variant-${index}-gender`}
                            value={variant.gender}
                            onChange={(event) => {
                              updateVariant(index, {
                                gender: event.target.value as
                                  | ""
                                  | AdminBudayaVariantGender,
                              });
                              clearFieldError(
                                `detail.variants.${index}.gender`,
                              );
                            }}
                            aria-invalid={Boolean(
                              fieldError(`detail.variants.${index}.gender`),
                            )}
                            aria-describedby={
                              fieldError(`detail.variants.${index}.gender`)
                                ? `variant-${index}-gender-error`
                                : undefined
                            }
                            className={inputClass(
                              fieldError(`detail.variants.${index}.gender`),
                            )}
                          >
                            <option value="">Pilih gender</option>
                            <option
                              value="pria"
                              disabled={genderUsedElsewhere(index, "pria")}
                            >
                              Pria
                            </option>
                            <option
                              value="wanita"
                              disabled={genderUsedElsewhere(index, "wanita")}
                            >
                              Wanita
                            </option>
                          </select>
                        </Field>

                        <Field
                          id={`variant-${index}-avatar`}
                          label="Avatar"
                          hint="Opsional"
                          error={fieldError(
                            `detail.variants.${index}.avatar_image`,
                          )}
                        >
                          <div className="space-y-2">
                            {variantAvatarUrl(variant) ? (
                              <div className="relative aspect-square w-20 overflow-hidden rounded-lg border border-line bg-cream">
                                <AppImage
                                  src={variantAvatarUrl(variant) ?? ""}
                                  alt={`Pratinjau avatar varian ${index + 1}`}
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </div>
                            ) : null}

                            <input
                              id={`variant-${index}-avatar`}
                              type="file"
                              accept={IMAGE_ACCEPT}
                              onChange={(event) => {
                                selectVariantAvatar(
                                  index,
                                  event.target.files?.[0] ?? null,
                                );
                                event.target.value = "";
                              }}
                              aria-invalid={Boolean(
                                fieldError(
                                  `detail.variants.${index}.avatar_image`,
                                ),
                              )}
                              aria-describedby={
                                fieldError(
                                  `detail.variants.${index}.avatar_image`,
                                )
                                  ? `variant-${index}-avatar-error`
                                  : undefined
                              }
                              className={MEDIA_INPUT_CLASS}
                            />
                            <p className="text-[11px] leading-[1.6] text-muted">
                              JPG, PNG, atau WebP, maksimal 2 MB.
                            </p>

                            {variant.avatarFile ? (
                              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink">
                                <span className="max-w-full truncate">
                                  {variant.avatarFile.name} (
                                  {formatFileSize(variant.avatarFile.size)})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => selectVariantAvatar(index, null)}
                                  className="focus-ring inline-flex h-7 items-center rounded-md border border-line bg-paper px-2 text-[11px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                                >
                                  Batalkan pilihan
                                </button>
                              </div>
                            ) : null}

                            {variant.avatarImage.trim() || variant.avatarFile ? (
                              <button
                                type="button"
                                onClick={() => clearVariantAvatar(index)}
                                className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-50"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Hapus avatar
                              </button>
                            ) : null}

                            <details className="rounded-lg border border-line bg-cream/60 px-3 py-2">
                              <summary className="cursor-pointer text-[11.5px] font-medium text-ink">
                                Opsi lanjutan: path/URL manual
                              </summary>
                              <input
                                id={`variant-${index}-avatar-path`}
                                type="text"
                                value={variant.avatarImage}
                                aria-label={`Path atau URL avatar varian ${index + 1}`}
                                onChange={(event) => {
                                  if (variant.avatarFile) {
                                    selectVariantAvatar(index, null);
                                  }
                                  updateVariant(index, {
                                    avatarImage: event.target.value,
                                  });
                                  clearFieldError(
                                    `detail.variants.${index}.avatar_image`,
                                  );
                                }}
                                maxLength={MAX_TEXT_FIELD}
                                placeholder="Path/URL avatar (opsional)"
                                aria-invalid={Boolean(
                                  fieldError(
                                    `detail.variants.${index}.avatar_image`,
                                  ),
                                )}
                                aria-describedby={
                                  fieldError(
                                    `detail.variants.${index}.avatar_image`,
                                  )
                                    ? `variant-${index}-avatar-error`
                                    : undefined
                                }
                                className={`${inputClass(
                                  fieldError(
                                    `detail.variants.${index}.avatar_image`,
                                  ),
                                )} mt-3`}
                              />
                            </details>
                          </div>
                        </Field>

                        <Field
                          id={`variant-${index}-description`}
                          label="Deskripsi varian"
                          hint="Opsional"
                          error={fieldError(
                            `detail.variants.${index}.description`,
                          )}
                          className="sm:col-span-2"
                        >
                          <textarea
                            id={`variant-${index}-description`}
                            value={variant.description}
                            onChange={(event) => {
                              updateVariant(index, {
                                description: event.target.value,
                              });
                              clearFieldError(
                                `detail.variants.${index}.description`,
                              );
                            }}
                            placeholder="Keterangan tambahan untuk varian ini."
                            aria-invalid={Boolean(
                              fieldError(
                                `detail.variants.${index}.description`,
                              ),
                            )}
                            aria-describedby={
                              fieldError(
                                `detail.variants.${index}.description`,
                              )
                                ? `variant-${index}-description-error`
                                : undefined
                            }
                            className={textareaClass(
                              fieldError(
                                `detail.variants.${index}.description`,
                              ),
                            )}
                          />
                        </Field>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {category === "makanan" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="makanan-ingredients"
              label="Bahan-bahan"
              hint="Opsional"
              error={fieldError("detail.ingredients")}
              className="sm:col-span-2"
            >
              <textarea
                id="makanan-ingredients"
                value={detail.ingredients}
                onChange={(event) => {
                  updateDetailField("ingredients", event.target.value);
                  clearFieldError("detail.ingredients");
                }}
                placeholder="Daftar bahan utama."
                className={textareaClass(fieldError("detail.ingredients"))}
              />
            </Field>
            <Field
              id="makanan-recipe"
              label="Resep"
              hint="Opsional"
              error={fieldError("detail.recipe")}
              className="sm:col-span-2"
            >
              <textarea
                id="makanan-recipe"
                value={detail.recipe}
                onChange={(event) => {
                  updateDetailField("recipe", event.target.value);
                  clearFieldError("detail.recipe");
                }}
                placeholder="Langkah penyajian atau resep."
                className={textareaClass(fieldError("detail.recipe"))}
              />
            </Field>
            <Field
              id="makanan-serving"
              label="Cara penyajian"
              hint="Opsional"
              error={fieldError("detail.serving_method")}
              className="sm:col-span-2"
            >
              <textarea
                id="makanan-serving"
                value={detail.servingMethod}
                onChange={(event) => {
                  updateDetailField("servingMethod", event.target.value);
                  clearFieldError("detail.serving_method");
                }}
                placeholder="Bagaimana makanan ini disajikan."
                className={textareaClass(fieldError("detail.serving_method"))}
              />
            </Field>
          </div>
        ) : null}

        {category === "alat_musik" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="alat-material"
              label="Bahan"
              hint="Opsional"
              error={fieldError("detail.material")}
            >
              <textarea
                id="alat-material"
                value={detail.material}
                onChange={(event) => {
                  updateDetailField("material", event.target.value);
                  clearFieldError("detail.material");
                }}
                placeholder="Bahan pembuatan alat musik."
                className={textareaClass(fieldError("detail.material"))}
              />
            </Field>
            <Field
              id="alat-cara"
              label="Cara memainkan"
              hint="Opsional"
              error={fieldError("detail.how_to_play")}
            >
              <textarea
                id="alat-cara"
                value={detail.howToPlay}
                onChange={(event) => {
                  updateDetailField("howToPlay", event.target.value);
                  clearFieldError("detail.how_to_play");
                }}
                placeholder="Teknik memainkan alat musik."
                className={textareaClass(fieldError("detail.how_to_play"))}
              />
            </Field>
            <Field
              id="alat-fungsi"
              label="Fungsi"
              hint="Opsional"
              error={fieldError("detail.function")}
              className="sm:col-span-2"
            >
              <textarea
                id="alat-fungsi"
                value={detail.func}
                onChange={(event) => {
                  updateDetailField("func", event.target.value);
                  clearFieldError("detail.function");
                }}
                placeholder="Fungsi sosial atau budaya alat musik."
                className={textareaClass(fieldError("detail.function"))}
              />
            </Field>
            <Field
              id="alat-audio"
              label="Audio"
              hint="Opsional"
              error={fieldError("detail.audio")}
              className="sm:col-span-2"
            >
              <div className="space-y-3">
                {audioPreviewUrl ? (
                  <audio
                    controls
                    preload="none"
                    src={audioPreviewUrl}
                    className="w-full max-w-[420px]"
                  >
                    Browser Anda tidak mendukung pemutar audio.
                  </audio>
                ) : (
                  <p className="rounded-lg border border-dashed border-line bg-cream px-4 py-5 text-center text-[12px] text-muted">
                    Belum ada audio.
                  </p>
                )}

                <div>
                  <input
                    id="alat-audio"
                    type="file"
                    accept={AUDIO_ACCEPT}
                    onChange={(event) => {
                      selectAudio(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                    aria-invalid={Boolean(fieldError("detail.audio"))}
                    aria-describedby={
                      fieldError("detail.audio")
                        ? "alat-audio-error"
                        : undefined
                    }
                    className={MEDIA_INPUT_CLASS}
                  />
                  <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">
                    MP3, WAV, OGG, atau M4A. Maksimal 10 MB. File diunggah saat
                    konten disimpan.
                  </p>

                  {audioFile ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-ink">
                      <span className="max-w-full truncate">
                        {audioFile.name} ({formatFileSize(audioFile.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => selectAudio(null)}
                        className="focus-ring inline-flex h-7 items-center rounded-md border border-line bg-paper px-2 text-[11px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                      >
                        Batalkan pilihan
                      </button>
                    </div>
                  ) : null}

                  {detail.audio.trim() || audioFile ? (
                    <button
                      type="button"
                      onClick={clearAudio}
                      className="focus-ring mt-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Hapus audio
                    </button>
                  ) : null}
                </div>

                <details className="rounded-lg border border-line bg-cream/60 px-3 py-2">
                  <summary className="cursor-pointer text-[11.5px] font-medium text-ink">
                    Opsi lanjutan: path/URL manual
                  </summary>
                  <input
                    id="alat-audio-path"
                    type="text"
                    value={detail.audio}
                    aria-label="Path atau URL audio"
                    onChange={(event) => {
                      if (audioFile) {
                        selectAudio(null);
                      }
                      updateDetailField("audio", event.target.value);
                      clearFieldError("detail.audio");
                    }}
                    maxLength={MAX_TEXT_FIELD}
                    placeholder="Path/URL audio (opsional)"
                    aria-invalid={Boolean(fieldError("detail.audio"))}
                    aria-describedby={
                      fieldError("detail.audio")
                        ? "alat-audio-error"
                        : undefined
                    }
                    className={`${inputClass(fieldError("detail.audio"))} mt-3`}
                  />
                  <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">
                    Untuk mempertahankan data lama atau memakai URL eksternal.
                    File yang dipilih akan menggantikan nilai ini saat disimpan.
                  </p>
                </details>
              </div>
            </Field>
          </div>
        ) : null}
      </SectionCard>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/budaya"
          className="focus-ring text-[12.5px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          ← Kembali ke daftar konten
        </Link>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {tradisiBlocked ? (
            <p className="text-[11.5px] text-red-700">
              Kategori tradisi belum dapat disubmit tanpa ID jenis tradisi yang
              valid.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitDisabled}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? "Menyimpan..."
              : mode === "edit"
                ? "Simpan perubahan"
                : "Simpan konten"}
          </button>
        </div>
      </div>
    </form>
  );
}

