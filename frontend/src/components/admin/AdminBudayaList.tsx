"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  AlertIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import {
  AdminApiError,
  deleteAdminBudaya,
  fetchAdminBudayaList,
  updateAdminBudayaStatus,
  type AdminBudayaListItem,
  type AdminContentStatus,
} from "@/lib/adminApi";
import { PROVINCE_GROUPS } from "@/data/indonesiaProvinces";
import { CATEGORY_LABELS } from "@/lib/api";
import type { PaginationMeta } from "@/lib/types";

interface BudayaQuery {
  q: string;
  status: "" | AdminContentStatus;
  provinsi: string;
  perPage: number;
  page: number;
}

interface Notice {
  tone: "success" | "error";
  message: string;
}

const PER_PAGE_OPTIONS = [10, 20, 50];
const INITIAL_QUERY: BudayaQuery = {
  q: "",
  status: "",
  provinsi: "",
  perPage: 10,
  page: 1,
};

const STATUS_LABELS: Record<AdminContentStatus, string> = {
  draft: "Draf",
  published: "Terbit",
};

const CONTROL_CLASS =
  "focus-ring mt-2 h-11 w-full rounded-lg border border-line bg-cream px-3 text-[13px] text-ink outline-none transition-colors focus:border-ink/40 disabled:cursor-not-allowed disabled:opacity-60";

function RowActions({
  item,
  busy,
  onToggleStatus,
  onDelete,
}: {
  item: AdminBudayaListItem;
  busy: boolean;
  onToggleStatus: (item: AdminBudayaListItem) => void;
  onDelete: (item: AdminBudayaListItem) => void;
}) {
  const isPublished = item.status === "published";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/admin/budaya/${item.id}/edit`}
        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
      >
        <PencilIcon className="h-3.5 w-3.5" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onToggleStatus(item)}
        disabled={busy}
        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPublished ? (
          <>
            <EyeOffIcon className="h-3.5 w-3.5" />
            Jadikan draf
          </>
        ) : (
          <>
            <EyeIcon className="h-3.5 w-3.5" />
            Terbitkan
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        disabled={busy}
        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Hapus
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-line bg-paper"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Memuat daftar konten budaya...</span>
      <div className="hidden md:block">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-line/70 px-4 py-4 last:border-0"
          >
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-2/5 rounded-full" />
              <div className="skeleton h-2.5 w-1/5 rounded-full" />
            </div>
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton h-3 w-16 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-lg border border-line p-4">
            <div className="skeleton h-3 w-3/5 rounded-full" />
            <div className="skeleton mt-3 h-2.5 w-2/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminBudayaList() {
  const { expireSession } = useAdminAuth();

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState<BudayaQuery>(INITIAL_QUERY);

  const [items, setItems] = useState<AdminBudayaListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminBudayaListItem | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [pendingRow, setPendingRow] = useState<{
    id: number;
    type: "status" | "delete";
  } | null>(null);

  // Debounce kata kunci agar tidak memicu request tiap karakter.
  useEffect(() => {
    const trimmed = searchInput.trim();
    const handle = setTimeout(() => {
      setQuery((current) =>
        current.q === trimmed ? current : { ...current, q: trimmed, page: 1 },
      );
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  // Muat daftar konten mengikuti filter/pagination.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      await Promise.resolve();

      if (!active) {
        return;
      }

      setIsFetching(true);

      try {
        const response = await fetchAdminBudayaList(
          {
            q: query.q,
            status: query.status,
            provinsi: query.provinsi,
            per_page: query.perPage,
            page: query.page,
          },
          controller.signal,
        );

        if (!active) {
          return;
        }

        // Halaman bisa menjadi kosong setelah perubahan filter atau penghapusan.
        if (query.page > response.meta.last_page) {
          setQuery((current) => ({
            ...current,
            page: Math.max(1, response.meta.last_page),
          }));
          return;
        }

        setItems(response.data);
        setMeta(response.meta);
        setListError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        if (
          error instanceof AdminApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          expireSession(error.status === 403 ? "forbidden" : undefined);
          return;
        }

        setItems([]);
        setMeta(null);
        setListError(
          error instanceof AdminApiError
            ? error.message
            : "Tidak dapat memuat daftar konten budaya.",
        );
      } finally {
        if (active) {
          setIsFetching(false);
          setHasLoaded(true);
        }
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [query, reloadKey, expireSession]);

  // Notifikasi sukses menutup sendiri.
  useEffect(() => {
    if (!notice || notice.tone !== "success") {
      return;
    }

    const handle = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(handle);
  }, [notice]);

  const handleStatusFilter = useCallback((value: string) => {
    const status: "" | AdminContentStatus =
      value === "draft" || value === "published" ? value : "";
    setQuery((current) => ({ ...current, status, page: 1 }));
  }, []);

  const handleProvinceFilter = useCallback((value: string) => {
    setQuery((current) => ({ ...current, provinsi: value, page: 1 }));
  }, []);

  const handlePerPage = useCallback((value: string) => {
    const perPage = Number(value);

    if (!PER_PAGE_OPTIONS.includes(perPage)) {
      return;
    }

    setQuery((current) => ({ ...current, perPage, page: 1 }));
  }, []);

  const handlePage = useCallback((page: number) => {
    setQuery((current) => (page === current.page ? current : { ...current, page }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchInput("");
    setIsFetching(true);
    setListError(null);
    setQuery(INITIAL_QUERY);
    setReloadKey((key) => key + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setIsFetching(true);
    setListError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const handleActionError = useCallback(
    (error: unknown) => {
      if (
        error instanceof AdminApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        expireSession(error.status === 403 ? "forbidden" : undefined);
        return;
      }

      setNotice({
        tone: "error",
        message:
          error instanceof AdminApiError
            ? error.message
            : "Terjadi kesalahan yang tidak terduga. Coba lagi.",
      });
    },
    [expireSession],
  );

  const handleToggleStatus = useCallback(
    async (item: AdminBudayaListItem) => {
      const nextStatus: AdminContentStatus =
        item.status === "published" ? "draft" : "published";

      setPendingRow({ id: item.id, type: "status" });
      setNotice(null);

      try {
        await updateAdminBudayaStatus(item.id, nextStatus);
        setNotice({
          tone: "success",
          message:
            nextStatus === "published"
              ? `“${item.title}” berhasil diterbitkan.`
              : `“${item.title}” berhasil dikembalikan ke draf.`,
        });
        setReloadKey((key) => key + 1);
      } catch (error) {
        handleActionError(error);
      } finally {
        setPendingRow(null);
      }
    },
    [handleActionError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDialogBusy(true);
    setPendingRow({ id: target.id, type: "delete" });
    setNotice(null);

    try {
      await deleteAdminBudaya(target.id);
      setDeleteTarget(null);
      setNotice({
        tone: "success",
        message: `“${target.title}” berhasil dihapus.`,
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      handleActionError(error);
    } finally {
      setDialogBusy(false);
      setPendingRow(null);
    }
  }, [deleteTarget, handleActionError]);

  const handleCancelDelete = useCallback(() => {
    if (dialogBusy) {
      return;
    }

    setDeleteTarget(null);
  }, [dialogBusy]);

  const totalItems = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.last_page ?? 1);
  const currentPage = meta?.current_page ?? query.page;
  const activeFilters =
    query.q !== "" || query.status !== "" || query.provinsi !== "";
  const firstItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) * (meta?.per_page ?? query.perPage) + 1;
  const lastItem =
    totalItems === 0
      ? 0
      : Math.min(
          currentPage * (meta?.per_page ?? query.perPage),
          totalItems,
        );
  return (
    <section className="mt-8">
      <div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <label htmlFor="budaya-search" className="eyebrow">
              Cari judul
            </label>
            <div className="relative mt-2">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="budaya-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari judul konten..."
                className="focus-ring h-11 w-full rounded-lg border border-line bg-cream pr-3 pl-9 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <div>
              <label htmlFor="budaya-status" className="eyebrow">
                Status
              </label>
              <select
                id="budaya-status"
                value={query.status}
                onChange={(event) => handleStatusFilter(event.target.value)}
                className={CONTROL_CLASS}
              >
                <option value="">Semua status</option>
                <option value="draft">Draf</option>
                <option value="published">Terbit</option>
              </select>
            </div>
            <div>
              <label htmlFor="budaya-provinsi" className="eyebrow">
                Provinsi
              </label>
              <select
                id="budaya-provinsi"
                value={query.provinsi}
                onChange={(event) => handleProvinceFilter(event.target.value)}
                className={CONTROL_CLASS}
              >
                <option value="">Semua provinsi</option>
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
            </div>
            <div>
              <label htmlFor="budaya-per-page" className="eyebrow">
                Baris
              </label>
              <select
                id="budaya-per-page"
                value={query.perPage}
                onChange={(event) => handlePerPage(event.target.value)}
                className={CONTROL_CLASS}
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} / halaman
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {activeFilters ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-[11.5px] text-muted">Filter aktif:</span>
            {query.q ? (
              <span className="inline-flex items-center rounded-full border border-line bg-cream px-2.5 py-1 text-[11px] text-ink">
                Judul: “{query.q}”
              </span>
            ) : null}
            {query.status ? (
              <span className="inline-flex items-center rounded-full border border-line bg-cream px-2.5 py-1 text-[11px] text-ink">
                Status: {STATUS_LABELS[query.status]}
              </span>
            ) : null}
            {query.provinsi ? (
              <span className="inline-flex items-center rounded-full border border-line bg-cream px-2.5 py-1 text-[11px] text-ink">
                Provinsi: {query.provinsi}
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleResetFilters}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Reset filter
            </button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-[12.5px] leading-[1.7] ${
            notice.tone === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {notice.tone === "error" ? (
            <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p className="flex-1">{notice.message}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Tutup notifikasi"
            className="focus-ring rounded p-0.5"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        {listError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertIcon className="mx-auto h-6 w-6 text-red-700" />
            <h2 className="mt-3 font-serif text-[20px] text-ink">
              Gagal memuat daftar konten
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-muted">
              {listError}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          </div>
        ) : !hasLoaded && isFetching ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center">
            <p className="eyebrow">Kosong</p>
            <h2 className="mt-2 font-serif text-[20px] text-ink">
              {activeFilters
                ? "Tidak ada konten yang cocok"
                : "Belum ada konten budaya"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-muted">
              {activeFilters
                ? "Coba ubah kata kunci atau filter yang kamu pakai, lalu muat ulang daftar."
                : "Daftar konten budaya masih kosong. Mulai dengan menambahkan konten pertama."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {activeFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                  Reset filter
                </button>
              ) : null}
              <Link
                href="/admin/budaya/create"
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                <PlusIcon className="h-4 w-4" />
                Tambah Budaya
              </Link>
            </div>
          </div>
        ) : (
          <div
            aria-busy={isFetching}
            className={
              isFetching ? "opacity-60 transition-opacity" : "transition-opacity"
            }
          >
            <div className="hidden overflow-hidden rounded-xl border border-line bg-paper md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Daftar konten budaya
                </caption>
                <thead>
                  <tr className="border-b border-line bg-cream/60 text-[10.5px] tracking-[0.14em] text-muted uppercase">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Judul
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Kategori
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Provinsi
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const busy = pendingRow?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-line/70 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <p className="text-[13.5px] font-medium text-ink">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            ID #{item.id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[12.5px] text-muted">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </td>
                        <td className="px-4 py-3 text-[12.5px] text-muted">
                          {item.daerah?.provinsi ?? item.daerah?.nama ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <AdminStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3">
                          <RowActions
                            item={item}
                            busy={busy}
                            onToggleStatus={handleToggleStatus}
                            onDelete={setDeleteTarget}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {items.map((item) => {
                const busy = pendingRow?.id === item.id;

                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-line bg-paper p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-ink">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11.5px] text-muted">
                          ID #{item.id} ·{" "}
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </p>
                      </div>
                      <AdminStatusBadge status={item.status} />
                    </div>
                    <p className="mt-3 text-[12px] text-muted">
                      Provinsi:{" "}
                      <span className="text-ink">
                        {item.daerah?.provinsi ?? item.daerah?.nama ?? "—"}
                      </span>
                    </p>
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions
                        item={item}
                        busy={busy}
                        onToggleStatus={handleToggleStatus}
                        onDelete={setDeleteTarget}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {meta && meta.total > 0 ? (
        <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[11.5px] text-muted">
            Menampilkan {firstItem}–{lastItem} dari {totalItems} konten
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePage(currentPage - 1)}
              disabled={currentPage <= 1 || isFetching}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Sebelumnya
            </button>
            <span className="text-[11.5px] text-muted">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePage(currentPage + 1)}
              disabled={currentPage >= totalPages || isFetching}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Hapus konten budaya?"
        description={`Konten “${deleteTarget?.title ?? ""}” akan dihapus dan tidak bisa dikembalikan. Menghapus konten juga dapat menghapus data terkait seperti detail kategori, sumber, dan keterkaitan lain mengikuti perilaku cascade di backend.`}
        confirmLabel="Hapus konten"
        busy={dialogBusy}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </section>
  );
}
