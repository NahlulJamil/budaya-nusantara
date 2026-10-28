"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminBudayaForm } from "@/components/admin/AdminBudayaForm";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";
import {
  AdminApiError,
  fetchAdminBudayaDetail,
  type AdminBudayaContentDetail,
} from "@/lib/adminApi";

type EditState =
  | { status: "loading" }
  | { status: "ready"; content: AdminBudayaContentDetail }
  | { status: "notfound" }
  | { status: "error"; message: string };

interface AdminBudayaEditScreenProps {
  /** `null` bila segmen URL bukan ID numerik yang valid. */
  id: number | null;
}

const backLinkClass =
  "focus-ring text-[12.5px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink";

export function AdminBudayaEditScreen({ id }: AdminBudayaEditScreenProps) {
  const { expireSession } = useAdminAuth();
  const [state, setState] = useState<EditState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      await Promise.resolve();

      if (!active) {
        return;
      }

      if (id === null) {
        setState({ status: "notfound" });
        return;
      }

      setState({ status: "loading" });

      try {
        const response = await fetchAdminBudayaDetail(id, controller.signal);

        if (!active) {
          return;
        }

        setState({ status: "ready", content: response.data });
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

        if (error instanceof AdminApiError && error.status === 404) {
          setState({ status: "notfound" });
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof AdminApiError
              ? error.message
              : "Gagal memuat detail konten budaya.",
        });
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [expireSession, id, reloadKey]);

  if (state.status === "ready") {
    return (
      <AdminBudayaForm
        key={state.content.id}
        mode="edit"
        content={state.content}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <div className="mt-8 space-y-6" role="status" aria-live="polite">
        <section className="rounded-xl border border-line bg-paper p-5 sm:p-6">
          <div className="skeleton h-5 w-40 rounded-full" />
          <p className="mt-3 text-[12.5px] text-muted">
            Memuat detail konten budaya...
          </p>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="skeleton h-11 w-full rounded-lg"
                aria-hidden="true"
              />
            ))}
          </div>
        </section>
        <p>
          <Link href="/admin/budaya" className={backLinkClass}>
            ← Kembali ke daftar konten
          </Link>
        </p>
      </div>
    );
  }

  if (state.status === "notfound") {
    return (
      <section className="mt-8 rounded-xl border border-line bg-paper p-6 sm:p-8">
        <p className="eyebrow">Konten tidak ditemukan</p>
        <h2 className="mt-2 font-serif text-[22px] leading-tight text-ink">
          Konten budaya tidak tersedia
        </h2>
        <p className="mt-2 max-w-[520px] text-[13px] leading-[1.8] text-muted">
          {id === null
            ? "Alamat halaman tidak berisi ID konten yang valid."
            : `Konten dengan ID ${id} tidak ditemukan atau sudah dihapus.`}
        </p>
        <p className="mt-5">
          <Link href="/admin/budaya" className={backLinkClass}>
            ← Kembali ke daftar konten
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
      <AlertIcon className="h-6 w-6 text-red-700" />
      <h2 className="mt-3 font-serif text-[22px] leading-tight text-ink">
        Gagal memuat konten
      </h2>
      <p
        role="alert"
        className="mt-2 max-w-[560px] text-[13px] leading-[1.8] text-red-800"
      >
        {state.message}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          <RefreshIcon className="h-4 w-4" />
          Coba lagi
        </button>
        <Link href="/admin/budaya" className={backLinkClass}>
          ← Kembali ke daftar konten
        </Link>
      </div>
    </section>
  );
}
