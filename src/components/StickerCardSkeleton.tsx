export function StickerCardSkeleton() {
  return (
    <div
      className="kawaii-card p-4 space-y-3"
      aria-busy="true"
      aria-label="Sedang generate prompt..."
    >
      {/* Header: emoji + expression label */}
      <div className="flex items-center gap-2">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-4 w-20 rounded-full" />
      </div>
      {/* Prompt lines */}
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-5/6 rounded-full" />
        <div className="skeleton h-3 w-4/6 rounded-full" />
      </div>
      {/* Tips */}
      <div className="skeleton h-3 w-3/4 rounded-full" />
      {/* Buttons placeholder */}
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-7 w-16 rounded-kawaii-sm" />
        <div className="skeleton h-7 w-16 rounded-kawaii-sm" />
      </div>
    </div>
  );
}
