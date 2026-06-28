"use client";

import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  archiveOldOrders,
  getOrdersPerDay,
  getRevenuePerStore,
  getTopSellingItems,
} from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export default function AnalyticsPage() {
  const storeId = useAppStore((s) => s.storeId);
  const queryClient = useQueryClient();
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);

  const ordersPerDay = useQuery({
    queryKey: ["analytics", "orders-per-day", storeId],
    queryFn: () => getOrdersPerDay(storeId, 30),
  });

  const revenuePerStore = useQuery({
    queryKey: ["analytics", "revenue-per-store"],
    queryFn: () => getRevenuePerStore(),
  });

  const topItems = useQuery({
    queryKey: ["analytics", "top-items", storeId],
    queryFn: () => getTopSellingItems(5, storeId),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveOldOrders,
    onSuccess: (result) => {
      setArchiveMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const maxOrders = Math.max(1, ...(ordersPerDay.data?.map((d) => d.order_count) ?? [1]));

  return (
    <div className="space-y-12">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">Analytics</p>
        <h1 className="font-display text-3xl font-bold">The numbers behind the rail</h1>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold mb-3">
          Orders per day — {storeId} (last 30 days)
        </h2>
        <div className="bg-white border border-line rounded-sm p-5 flex items-end gap-1 h-40 overflow-x-auto">
          {ordersPerDay.data?.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1 min-w-[10px]" title={`${d.day}: ${d.order_count}`}>
              <div
                className="w-2.5 bg-accent rounded-sm"
                style={{ height: `${(d.order_count / maxOrders) * 100}px` }}
              />
            </div>
          ))}
          {ordersPerDay.isLoading && <p className="text-ink/40 text-sm">Loading…</p>}
          {ordersPerDay.data?.length === 0 && (
            <p className="text-ink/40 text-sm">No orders in this window yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-3">Revenue per store</h2>
        <div className="bg-white border border-line rounded-sm divide-y divide-line">
          {revenuePerStore.data?.map((row) => (
            <div key={row.store_id} className="flex justify-between px-5 py-3 font-mono text-sm">
              <span>{row.store_id}</span>
              <span className="text-ink/50">{row.order_count} orders</span>
              <span className="font-semibold">₹{Number(row.total_revenue).toFixed(2)}</span>
            </div>
          ))}
          {revenuePerStore.data?.length === 0 && (
            <p className="text-ink/40 text-sm px-5 py-3">No revenue recorded yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-3">Top 5 selling items — {storeId}</h2>
        <div className="bg-white border border-line rounded-sm divide-y divide-line">
          {topItems.data?.map((row, idx) => (
            <div key={row.item_id} className="flex justify-between px-5 py-3 font-mono text-sm">
              <span className="text-ink/40 w-6">{idx + 1}</span>
              <span className="flex-1">{row.item_id}</span>
              <span className="font-semibold">{row.total_qty} sold</span>
            </div>
          ))}
          {topItems.data?.length === 0 && (
            <p className="text-ink/40 text-sm px-5 py-3">No items sold yet.</p>
          )}
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <h2 className="font-display text-lg font-bold mb-1">Archive old orders</h2>
        <p className="text-ink/60 text-sm mb-3">
          Moves every order older than 30 days into <code className="font-mono">orders_archive</code>.
          Analytics keep counting archived orders, so the numbers above won&apos;t change.
        </p>
        <button
          onClick={() => archiveMutation.mutate()}
          disabled={archiveMutation.isPending}
          className="px-4 py-2 bg-ink text-canvas rounded-sm text-sm font-medium hover:bg-ink/85 disabled:opacity-50"
        >
          {archiveMutation.isPending ? "Archiving…" : "Run archival now"}
        </button>
        {archiveMessage && <p className="text-sm text-accent mt-3">{archiveMessage}</p>}
      </section>
    </div>
  );
}
