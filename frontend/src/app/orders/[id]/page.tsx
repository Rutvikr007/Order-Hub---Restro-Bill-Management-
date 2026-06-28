"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { encodeOrderId, getOrder, normalizeOrderId, updateOrderStatus } from "@/lib/api";
import { useFoodsMap } from "@/lib/useFoodsMap";
import { StatusStamp } from "@/components/StatusStamp";
import { ORDER_STATUSES, OrderStatus } from "@/types";

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PLACED: "PREPARING",
  PREPARING: "COMPLETED",
  COMPLETED: null,
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = normalizeOrderId(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const foodsById = useFoodsMap();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["order", orderId], updated);
      queryClient.invalidateQueries({ queryKey: ["orders", updated.store_id] });
    },
  });

  if (isLoading) return <p className="text-ink/50">Loading ticket…</p>;
  if (isError || !order) return <p className="text-rust">Could not find that order.</p>;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="max-w-lg">
      <button onClick={() => router.back()} className="text-sm text-ink/50 hover:text-ink mb-6">
        ← Back to the rail
      </button>

      <div className="ticket-perf bg-white border border-line rounded-sm shadow-sm p-7 pb-9">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-xs text-ink/50 uppercase tracking-wide">
              Tracking No.
            </p>
            <p className="font-mono text-sm text-ink/70 break-all">
              {order.id}
            </p>
            <h1 className="font-display text-2xl font-bold">{order.store_id}</h1>
          </div>
          <StatusStamp status={order.status} />
        </div>

        <ul className="font-mono text-sm border-t border-dashed border-line pt-4 mb-4 space-y-1">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{foodsById.get(item.item_id)?.name ?? item.item_id}</span>
              <span>x{item.qty}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between text-sm border-t border-dashed border-line pt-4 mb-6">
          <span className="text-ink/50">Placed {new Date(order.created_at).toLocaleString()}</span>
          <span className="font-mono font-semibold">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                disabled={s === order.status || mutation.isPending}
                onClick={() => mutation.mutate(s)}
                className={`px-3 py-1.5 rounded-sm text-sm font-medium border transition-colors ${
                  s === order.status
                    ? "bg-ink text-canvas border-ink"
                    : "border-line bg-white hover:bg-ink/5"
                } disabled:opacity-60`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-sm border border-line bg-white p-1 shadow-sm">
            <Link
              href={`/orders/${encodeOrderId(orderId)}/invoice`}
              className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V3h12v6" />
                <path d="M6 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1" />
                <path d="M6 14h12v7H6z" />
              </svg>
              Invoice
            </Link>
          </div>
        </div>

        {nextStatus && (
          <button
            onClick={() => mutation.mutate(nextStatus)}
            disabled={mutation.isPending}
            className="mt-4 w-full px-4 py-2.5 bg-accent text-white rounded-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? "Updating…" : `Advance to ${nextStatus}`}
          </button>
        )}

        {mutation.isError && (
          <p className="text-sm text-rust mt-3">Could not update status. Try again.</p>
        )}
      </div>
    </div>
  );
}
