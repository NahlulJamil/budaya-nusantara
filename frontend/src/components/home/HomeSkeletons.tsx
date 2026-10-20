export function CultureSkeleton() {
  return (
    <div
      className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[10px] border border-line/70 bg-paper"
        >
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-3 p-4 sm:p-[18px]">
            <div className="skeleton h-2.5 w-1/2 rounded-sm" />
            <div className="skeleton h-5 w-2/3 rounded-sm" />
            <div className="skeleton h-2.5 w-full rounded-sm" />
            <div className="skeleton h-2.5 w-4/5 rounded-sm" />
            <div className="skeleton mt-4 h-2.5 w-1/3 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div
      className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="skeleton aspect-[1.45] w-full rounded-lg"
        />
      ))}
    </div>
  );
}
