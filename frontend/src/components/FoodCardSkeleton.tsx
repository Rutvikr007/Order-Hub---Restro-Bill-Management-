export function FoodCardSkeleton() {
  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-32 bg-line/50" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3.5 w-3/4 rounded bg-line/60" />
        <div className="h-3 w-1/3 rounded bg-line/50" />
        <div className="h-7 w-full rounded-full bg-line/40 mt-1" />
      </div>
    </div>
  );
}