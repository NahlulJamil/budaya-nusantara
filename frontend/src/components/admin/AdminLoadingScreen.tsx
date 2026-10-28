export function AdminLoadingScreen({
  label = "Memeriksa sesi admin...",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-cream px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-xl border border-line bg-paper p-6">
        <p className="eyebrow">Admin GaleriBudaya</p>
        <p className="mt-2 text-[14px] leading-[1.7] text-ink">{label}</p>
        <div className="mt-5 space-y-2" aria-hidden="true">
          <div className="skeleton h-2.5 w-4/5 rounded-full" />
          <div className="skeleton h-2.5 w-3/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
