"use client";

import type { PreviewReason } from "@/hooks/useHomeData";

interface PreviewNoteProps {
  reason: PreviewReason;
  onRetry: () => void;
}

export function PreviewNote({ reason, onRetry }: PreviewNoteProps) {
  if (!reason) {
    return null;
  }

  return (
    <p className="preview-note mt-5" role="status">
      {reason === "error"
        ? "Pratinjau kuratif — API belum dapat dihubungi."
        : "Pratinjau kuratif — belum ada konten published dari API."}
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-amber"
      >
        Coba lagi
      </button>
    </p>
  );
}
