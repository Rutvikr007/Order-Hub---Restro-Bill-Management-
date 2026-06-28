"use client";

import Link from "next/link";
import { encodeOrderId } from "@/lib/api";
import { useFoodsMap } from "@/lib/useFoodsMap";
import { Order } from "@/types";
import { StatusStamp } from "./StatusStamp";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderTicket({ order }: { order: Order }) {
  const foodsById = useFoodsMap();

  return (
    <Link
      href={`/orders/${encodeOrderId(order.id)}`}
      className="ticket-perf block bg-white border border-line rounded-sm shadow-sm hover:shadow-md transition-shadow p-5 pb-7"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-mono text-[11px] text-ink/50 uppercase tracking-wide">
            Tracking No.
          </p>
          <p className="font-mono text-xs text-ink/70">
            {order.id}
          </p>
          <p className="font-display font-bold text-lg leading-tight">{order.store_id}</p>
          <p className="text-xs text-ink/50 mt-0.5">{order.customer_name || "Walk-in customer"}</p>
        </div>
        <StatusStamp status={order.status} />
      </div>

      <ul className="font-mono text-sm text-ink/80 space-y-0.5 border-t border-dashed border-line pt-3 mb-3">
        {order.items.slice(0, 4).map((item, idx) => (
          <li key={idx} className="flex justify-between">
            <span>{foodsById.get(item.item_id)?.name ?? item.item_id}</span>
            <span>x{item.qty}</span>
          </li>
        ))}
        {order.items.length > 4 && (
          <li className="text-ink/40">+{order.items.length - 4} more</li>
        )}
      </ul>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/50 text-xs">{formatTime(order.created_at)}</span>
        <span className="font-mono font-semibold">₹{Number(order.total_amount).toFixed(2)}</span>
      </div>
    </Link>
  );
}
