import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">
        Multi-store · Real-time
      </p>
      <h1 className="font-display text-4xl font-bold leading-tight mb-4">
        Every order, every store,
        <br />
        one rail.
      </h1>
      <p className="text-ink/70 leading-relaxed mb-8">
        Order Hub tracks orders across all of your store locations as they happen. Fire a new
        order, watch it land on the rail instantly, and move it from placed to preparing to
        completed without a page refresh.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/create-order"
          className="px-5 py-2.5 bg-ink text-canvas rounded-sm font-medium hover:bg-ink/85 transition-colors"
        >
          Create a new order
        </Link>
        <Link
          href="/orders"
          className="px-5 py-2.5 border border-line bg-white rounded-sm font-medium hover:bg-ink/5 transition-colors"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}
