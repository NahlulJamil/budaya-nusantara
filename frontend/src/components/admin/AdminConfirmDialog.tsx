"use client";

import { useEffect, useRef } from "react";

import { AlertIcon } from "@/components/ui/icons";

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 cursor-default bg-night/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-description"
        aria-busy={busy}
        className="relative w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700">
            <AlertIcon className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="admin-confirm-title"
              className="font-serif text-[20px] leading-tight text-ink"
            >
              {title}
            </h2>
            <p
              id="admin-confirm-description"
              className="mt-2 text-[12.5px] leading-[1.75] text-muted"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="focus-ring inline-flex h-10 items-center justify-center rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="focus-ring inline-flex h-10 items-center justify-center rounded-lg bg-red-700 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Menghapus..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
