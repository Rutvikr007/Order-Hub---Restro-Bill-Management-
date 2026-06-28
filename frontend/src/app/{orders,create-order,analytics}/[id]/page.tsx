"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getOrder, updateOrderStatus } from "@/lib/api";
import { FoodImage } from "@/components/FoodImage";
import { StatusStamp } from "@/components/StatusStamp";
import { useFoodsMap } from "@/lib/useFoodsMap";
import { ORDER_STATUSES, OrderStatus } from "@/types";

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PLACED: "PREPARING",
  PREPARING: "COMPLETED",
  COMPLETED: null,
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const foodsById = useFoodsMap();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["order", id], updated);
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
            <p className="text-sm text-ink/60 mt-1">
              Bill to: <span className="font-medium text-ink">{order.customer_name || "Walk-in customer"}</span>
            </p>
          </div>
          <StatusStamp status={order.status} />
        </div>

        <ul className="border-t border-dashed border-line pt-4 mb-4 space-y-3">
          {order.items.map((item, idx) => {
            const food = foodsById.get(item.item_id);
            const lineTotal = food ? Number(food.price) * item.qty : null;
            return (
              <li key={idx} className="flex items-center gap-3">
                <FoodImage
                  imagePath={food?.image_path}
                  alt={food?.name ?? item.item_id}
                  className="w-10 h-10 rounded-sm object-cover border border-line"
                />
                <div className="flex-1 font-mono text-sm">
                  <p>{food?.name ?? item.item_id}</p>
                  <p className="text-ink/40 text-xs">x{item.qty}</p>
                </div>
                {lineTotal !== null && (
                  <span className="font-mono text-sm">₹{lineTotal.toFixed(2)}</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex justify-between text-sm border-t border-dashed border-line pt-4 mb-6">
          <span className="text-ink/50">Placed {new Date(order.created_at).toLocaleString()}</span>
          <span className="font-mono font-semibold">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>

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
