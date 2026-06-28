"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceConfig, getOrder, normalizeOrderId } from "@/lib/api";
import { useFoodsMap } from "@/lib/useFoodsMap";
import { InvoicePreviewDocument } from "@/components/InvoicePreviewDocument";

export default function OrderInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const orderId = normalizeOrderId(id);
  const router = useRouter();
  const foodsById = useFoodsMap();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  const { data: invoiceConfig } = useQuery({
    queryKey: ["invoice-config", order?.store_id],
    queryFn: () => getInvoiceConfig(order!.store_id),
    enabled: Boolean(order?.store_id),
  });

  if (isLoading) return <p className="text-ink/50">Loading invoice…</p>;
  if (isError || !order) return <p className="text-rust">Could not find that order.</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-ink/50 hover:text-ink mb-6">
        ← Back to order
      </button>

      <div className="mb-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">Invoice</p>
        <h1 className="font-display text-3xl font-bold">Printable invoice preview</h1>
        <p className="text-ink/60 mt-2">
          The invoice number uses the order tracking number, so no extra invoice ID is generated.
        </p>
      </div>

      <InvoicePreviewDocument order={order} invoiceConfig={invoiceConfig} foodsById={foodsById} />
    </div>
  );
}
