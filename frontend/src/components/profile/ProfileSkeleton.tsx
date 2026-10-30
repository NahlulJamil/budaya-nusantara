export function ProfileSkeleton() {
  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      <div className="skeleton h-[520px] rounded-[16px]" aria-hidden="true" />
      <div aria-hidden="true">
        <div className="skeleton h-9 w-64 rounded" />
        <div className="mt-3 skeleton h-4 w-32 rounded" />
        <div className="mt-6 flex gap-2">
          <div className="skeleton h-8 w-24 rounded-md" />
          <div className="skeleton h-8 w-32 rounded-md" />
        </div>
        <div className="mt-5 space-y-4">
          <div className="skeleton h-[172px] rounded-[14px]" />
          <div className="skeleton h-[172px] rounded-[14px]" />
        </div>
      </div>
    </div>
  );
}
