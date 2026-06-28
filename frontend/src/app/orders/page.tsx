"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listOrders } from "@/lib/api";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import { OrderTicket } from "@/components/OrderTicket";
import { Pagination } from "@/components/Pagination";
import { useAppStore } from "@/store/useAppStore";
import { OrderStatus, ORDER_STATUSES } from "@/types";

const LIMIT = 9;

export default function OrdersPage() {
  const storeId = useAppStore((s) => s.storeId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");

  useRealtimeOrders(storeId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", storeId, page, status],
    queryFn: () =>
      listOrders({ store_id: storeId, page, limit: LIMIT, status: status || undefined }),
    enabled: Boolean(storeId),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">The rail</p>
          <h1 className="font-display text-3xl font-bold">{storeId}</h1>
        </div>

        <div className="flex gap-2">
          {(["", ...ORDER_STATUSES] as const).map((s) => (
            <button
              key={s || "all"}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-sm text-sm font-medium border transition-colors ${
                status === s
                  ? "bg-ink text-canvas border-ink"
                  : "border-line bg-white hover:bg-ink/5"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-ink/50">Loading the rail…</p>}
      {isError && <p className="text-rust">Could not load orders for this store.</p>}

      {data && data.data.length === 0 && (
        <div className="border border-dashed border-line rounded-sm p-10 text-center text-ink/50">
          No orders on the rail yet for {storeId}{status ? ` with status ${status}` : ""}.
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((order) => (
              <OrderTicket key={order.id} order={order} />
            ))}
          </div>

          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.total_pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
