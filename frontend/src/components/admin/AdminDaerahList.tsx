"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  AlertIcon,
  CheckCircleIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import {
  INDONESIA_PROVINCES,
  PROVINCE_GROUPS,
} from "@/data/indonesiaProvinces";
import {
  AdminApiError,
  deleteAdminDaerah,
  fetchAdminDaerahList,
  type AdminDaerahListItem,
} from "@/lib/adminApi";
import type { IslandGroup } from "@/data/provinceData";

interface Notice {
  tone: "success" | "error";
  message: string;
}

type IslandFilter = IslandGroup | "all";

const ISLAND_FILTERS: { id: IslandFilter; name: string }[] = [
  { id: "all", name: "Semua pulau" },
  ...PROVINCE_GROUPS.map((group) => ({ id: group.id, name: group.name })),
];

function normalizeProvince(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/sumatera/g, "sumatra")
    .replace(/\s+/g, " ")
    .trim();
}

function createProvinceLookup(
  items: AdminDaerahListItem[],
): Map<string, AdminDaerahListItem[]> {
  const lookup = new Map<string, AdminDaerahListItem[]>();

  for (const item of items) {
    const key = normalizeProvince(item.provinsi);

    if (!key) {
      continue;
    }

    const current = lookup.get(key) ?? [];
    current.push(item);
    lookup.set(key, current);
  }

  return lookup;
}

function ProvinceSkeleton() {
  return (
    <div
      className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Memuat daftar provinsi...</span>
      {Array.from({ length: 9 }, (_, index) => (
        <div key={index} className="rounded-xl border border-line bg-paper p-4">
          <div className="skeleton h-4 w-2/5 rounded-full" />
          <div className="skeleton mt-3 h-2.5 w-3/5 rounded-full" />
          <div className="skeleton mt-4 h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-[28px] leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[11.5px] leading-[1.6] text-muted">{hint}</p>
    </div>
  );
}

export function AdminDaerahList() {
  const { expireSession } = useAdminAuth();

  const [items, setItems] = useState<AdminDaerahListItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [island, setIsland] = useState<IslandFilter>("all");

  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDaerahListItem | null>(
    null,
  );
  const [dialogBusy, setDialogBusy] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Muat seluruh daerah terdaftar agar status tiap provinsi akurat.
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
        const collected: AdminDaerahListItem[] = [];
        let page = 1;
        let lastPage = 1;

        do {
          const response = await fetchAdminDaerahList(
            { per_page: 50, page },
            controller.signal,
          );

          if (!active) {
            return;
          }

          collected.push(...response.data);
          lastPage = response.meta.last_page;
          page += 1;
        } while (page <= lastPage);

        setItems(collected);
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
        setListError(
          error instanceof AdminApiError
            ? error.message
            : "Tidak dapat memuat daftar provinsi.",
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
  }, [reloadKey, expireSession]);

  // Notifikasi sukses menutup sendiri.
  useEffect(() => {
    if (!notice || notice.tone !== "success") {
      return;
    }

    const handle = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(handle);
  }, [notice]);

  const lookup = useMemo(() => createProvinceLookup(items), [items]);

  const registeredProvinceCount = useMemo(
    () =>
      INDONESIA_PROVINCES.filter(
        (province) => (lookup.get(normalizeProvince(province.name)) ?? []).length > 0,
      ).length,
    [lookup],
  );

  const unmatched = useMemo(() => {
    const names = new Set(
      INDONESIA_PROVINCES.map((province) => normalizeProvince(province.name)),
    );

    return items.filter((item) => !names.has(normalizeProvince(item.provinsi)));
  }, [items]);

  const keyword = searchInput.trim().toLowerCase();

  const filteredGroups = useMemo(
    () =>
      PROVINCE_GROUPS.filter(
        (group) => island === "all" || group.id === island,
      )
        .map((group) => ({
          ...group,
          provinces: group.provinces.filter((province) => {
            if (!keyword) {
              return true;
            }

            if (province.name.toLowerCase().includes(keyword)) {
              return true;
            }

            return (lookup.get(normalizeProvince(province.name)) ?? []).some(
              (record) => record.nama.toLowerCase().includes(keyword),
            );
          }),
        }))
        .filter((group) => group.provinces.length > 0),
    [island, keyword, lookup],
  );

  const handleRetry = useCallback(() => {
    setIsFetching(true);
    setListError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setIsland("all");
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

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDialogBusy(true);
    setPendingId(target.id);
    setNotice(null);

    try {
      await deleteAdminDaerah(target.id);
      setDeleteTarget(null);
      setNotice({
        tone: "success",
        message: `Daerah "${target.nama}" berhasil dihapus.`,
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      handleActionError(error);
    } finally {
      setDialogBusy(false);
      setPendingId(null);
    }
  }, [deleteTarget, handleActionError]);

  const handleCancelDelete = useCallback(() => {
    if (dialogBusy) {
      return;
    }

    setDeleteTarget(null);
  }, [dialogBusy]);

  const hasFilter = keyword !== "" || island !== "all";
  const unregisteredCount = INDONESIA_PROVINCES.length - registeredProvinceCount;
  const visibleProvinceCount = filteredGroups.reduce(
    (total, group) => total + group.provinces.length,
    0,
  );

  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Provinsi"
          value={INDONESIA_PROVINCES.length}
          hint="Provinsi di Indonesia"
        />
        <StatCard
          label="Terdaftar"
          value={registeredProvinceCount}
          hint="Sudah punya daerah di sistem"
        />
        <StatCard
          label="Belum"
          value={unregisteredCount}
          hint="Menunggu ditambahkan admin"
        />
      </div>

      <div className="mt-4 rounded-xl border border-line bg-paper p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <label htmlFor="provinsi-search" className="eyebrow">
              Cari provinsi atau daerah
            </label>
            <div className="relative mt-2">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="provinsi-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Contoh: Jawa Barat"
                className="focus-ring h-11 w-full rounded-lg border border-line bg-cream pr-3 pl-9 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <label htmlFor="provinsi-island" className="eyebrow">
                Pulau
              </label>
              <select
                id="provinsi-island"
                value={island}
                onChange={(event) =>
                  setIsland(event.target.value as IslandFilter)
                }
                className="focus-ring mt-2 h-11 w-full rounded-lg border border-line bg-cream px-3 text-[13px] text-ink outline-none transition-colors focus:border-ink/40"
              >
                {ISLAND_FILTERS.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
            {hasFilter ? (
              <button
                type="button"
                onClick={handleReset}
                className="focus-ring inline-flex h-11 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                Reset
              </button>
            ) : null}
          </div>
        </div>
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

      {listError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertIcon className="mx-auto h-6 w-6 text-red-700" />
          <h2 className="mt-3 font-serif text-[20px] text-ink">
            Gagal memuat data provinsi
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
        <ProvinceSkeleton />
      ) : filteredGroups.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-line bg-paper p-8 text-center">
          <p className="eyebrow">Kosong</p>
          <h2 className="mt-2 font-serif text-[20px] text-ink">
            Tidak ada provinsi yang cocok
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-muted">
            Coba ubah kata kunci atau filter pulau yang dipakai.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Reset filter
          </button>
        </div>
      ) : (
        <div
          aria-busy={isFetching}
          className={
            isFetching ? "opacity-60 transition-opacity" : "transition-opacity"
          }
        >
          <p className="mt-5 text-[11.5px] text-muted">
            Menampilkan {visibleProvinceCount} provinsi
          </p>

          {filteredGroups.map((group) => (
            <section key={group.id} className="mt-6">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-2">
                <h2 className="font-serif text-[22px] leading-tight text-ink">
                  {group.name}
                </h2>
                <span className="text-[11px] text-muted">
                  {group.provinces.length} provinsi
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.provinces.map((province) => {
                  const records =
                    lookup.get(normalizeProvince(province.name)) ?? [];
                  const isRegistered = records.length > 0;

                  return (
                    <article
                      key={province.name}
                      className="flex flex-col rounded-xl border border-line bg-paper p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-[17px] leading-tight text-ink">
                          {province.name}
                        </h3>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${
                            isRegistered
                              ? "border-green-200 bg-green-50 text-green-800"
                              : "border-line bg-cream text-muted"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isRegistered ? "bg-green-600" : "bg-muted"
                            }`}
                            aria-hidden="true"
                          />
                          {isRegistered
                            ? `${records.length} daerah`
                            : "Belum terdaftar"}
                        </span>
                      </div>

                      {isRegistered ? (
                        <ul className="mt-3 space-y-2">
                          {records.map((record) => {
                            const busy = pendingId === record.id;

                            return (
                              <li
                                key={record.id}
                                className="rounded-lg border border-line bg-cream/70 px-3 py-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-[12.5px] font-medium text-ink">
                                      {record.nama}
                                    </p>
                                    <p className="mt-0.5 text-[10.5px] text-muted">
                                      {record.cultural_contents_count} konten
                                      &middot; {record.aksaras_count} aksara
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <Link
                                      href={`/admin/daerah/${record.id}/edit`}
                                      aria-label={`Edit ${record.nama}`}
                                      className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-paper text-ink transition-colors hover:border-ink/40 hover:bg-white"
                                    >
                                      <PencilIcon className="h-3.5 w-3.5" />
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget(record)}
                                      disabled={busy}
                                      aria-label={`Hapus ${record.nama}`}
                                      className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-paper text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[11.5px] leading-[1.6] text-muted">
                          Belum ada daerah untuk provinsi ini.
                        </p>
                      )}

                      <div className="mt-auto pt-3">
                        <Link
                          href={`/admin/daerah/create?provinsi=${encodeURIComponent(province.name)}${
                            isRegistered ? "&nama=" : ""
                          }`}
                          className="focus-ring inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-cream px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          {isRegistered ? "Tambah daerah" : "Tambah provinsi"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {unmatched.length > 0 ? (
        <section className="mt-8 rounded-xl border border-line bg-paper p-5 sm:p-6">
          <p className="eyebrow">Di luar daftar provinsi</p>
          <h2 className="mt-1 font-serif text-[20px] leading-tight text-ink">
            Daerah dengan provinsi lain
          </h2>
          <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-[1.75] text-muted">
            Data ini memakai ejaan provinsi lama atau nama di luar 38 provinsi.
          </p>
          <ul className="mt-4 space-y-2">
            {unmatched.map((record) => {
              const busy = pendingId === record.id;

              return (
                <li
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-cream/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-ink">
                      {record.nama}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {record.provinsi ?? "Tanpa provinsi"} &middot;{" "}
                      {record.cultural_contents_count} konten
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/daerah/${record.id}/edit`}
                      className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(record)}
                      disabled={busy}
                      className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Hapus daerah?"
        description={`Daerah "${deleteTarget?.nama ?? ""}" akan dihapus dan tidak bisa dikembalikan. Penghapusan ditolak bila daerah masih memiliki konten budaya atau aksara.`}
        confirmLabel="Hapus daerah"
        busy={dialogBusy}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </section>
  );
}
