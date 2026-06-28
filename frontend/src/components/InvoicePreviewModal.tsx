"use client";

import { useMemo } from "react";
import { InvoiceQrImage } from "./InvoiceQrImage";
import { Food, InvoiceConfig, Order } from "@/types";

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  invoiceConfig: InvoiceConfig | null | undefined;
  foodsById: Map<string, Food>;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function PrinterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

export function InvoicePreviewModal({
  open,
  onClose,
  order,
  invoiceConfig,
  foodsById,
}: InvoicePreviewModalProps) {
  const values = useMemo(() => {
    const subtotal = Number(order.total_amount);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const rawGrandTotal = subtotal + cgst + sgst;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = grandTotal - rawGrandTotal;
    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

    return {
      subtotal,
      cgst,
      sgst,
      rawGrandTotal,
      grandTotal,
      roundOff,
      totalQty,
    };
  }, [order.items, order.total_amount]);

  if (!open) return null;

  const restaurantName = invoiceConfig?.restaurant_name || "Restaurant Name";
  const restaurantAddress = invoiceConfig?.restaurant_address || "Restaurant Address";
  const gstNumber = invoiceConfig?.gst_number || "GST Number";
  const footerNote = invoiceConfig?.footer_note || "Thanks! Visit Again";
  const qrImagePath = invoiceConfig?.qr_image_path ?? null;
  const customerName = order.customer_name || "Walk-in customer";
  const orderDate = new Date(order.created_at);

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) return;

    const rows = order.items
      .map((item) => {
        const foodName = foodsById.get(item.item_id)?.name ?? item.item_id;
        return `
          <tr>
            <td>${escapeHtml(foodName)}</td>
            <td style="text-align:right;">${item.qty}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Invoice ${escapeHtml(order.id)}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111; }
            .invoice { max-width: 760px; margin: 0 auto; border: 1px solid #ddd; padding: 24px; }
            .header { text-align: center; margin-bottom: 18px; }
            .header h1 { margin: 0 0 4px; font-size: 24px; }
            .header p { margin: 2px 0; font-size: 13px; }
            .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; font-size: 13px; margin: 18px 0; }
            .meta div { padding: 6px 0; border-bottom: 1px solid #eee; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
            th { text-align: left; }
            .totals { margin-top: 16px; margin-left: auto; width: 320px; font-size: 13px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
            .grand { font-weight: 700; border-top: 1px solid #ddd; margin-top: 6px; padding-top: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 13px; }
            .qr { width: 140px; height: 140px; object-fit: contain; border: 1px solid #ddd; margin: 12px auto 0; display: block; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>${escapeHtml(restaurantName)}</h1>
              <p>${escapeHtml(restaurantAddress)}</p>
              <p>GST: ${escapeHtml(gstNumber)}</p>
            </div>
            <div class="meta">
              <div><strong>Invoice Number:</strong> ${escapeHtml(order.id)}</div>
              <div><strong>Store Name:</strong> ${escapeHtml(order.store_id)}</div>
              <div><strong>Customer Name:</strong> ${escapeHtml(customerName)}</div>
              <div><strong>Date:</strong> ${orderDate.toLocaleDateString()}</div>
              <div><strong>Time:</strong> ${orderDate.toLocaleTimeString()}</div>
              <div><strong>Total Quantity:</strong> ${values.totalQty}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align:right;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="totals">
              <div><span>Subtotal</span><span>₹${values.subtotal.toFixed(2)}</span></div>
              <div><span>CGST (2.5%)</span><span>₹${values.cgst.toFixed(2)}</span></div>
              <div><span>SGST (2.5%)</span><span>₹${values.sgst.toFixed(2)}</span></div>
              <div><span>Round Off</span><span>₹${values.roundOff.toFixed(2)}</span></div>
              <div class="grand"><span>Grand Total</span><span>₹${values.grandTotal.toFixed(2)}</span></div>
            </div>
            <img class="qr" src="${qrImagePath ? `${window.location.origin}${qrImagePath}` : `${window.location.origin}/QR.png`}" alt="QR code" />
            <div class="footer">${escapeHtml(footerNote)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
      <div className="mx-auto my-6 max-w-3xl bg-white border border-line rounded-xl shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/40">Invoice</p>
            <h2 className="font-display text-xl font-bold">Preview for {order.store_id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-canvas hover:bg-ink/85"
            >
              <PrinterIcon />
              Print
            </button>
            <button
              onClick={onClose}
              className="rounded-sm border border-line px-4 py-2 text-sm font-medium hover:bg-ink/5"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mx-auto max-w-2xl border border-dashed border-line rounded-xl p-6 bg-canvas">
            <div className="text-center mb-5">
              <p className="font-display text-2xl font-bold">{restaurantName}</p>
              <p className="text-sm text-ink/60 whitespace-pre-line mt-1">{restaurantAddress}</p>
              <p className="text-sm text-ink/60 mt-1">GST: {gstNumber}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-dashed border-line pt-4">
              <div>
                <span className="text-ink/50">Invoice Number:</span>{" "}
                <span className="font-medium">{order.id}</span>
              </div>
              <div>
                <span className="text-ink/50">Store Name:</span>{" "}
                <span className="font-medium">{order.store_id}</span>
              </div>
              <div>
                <span className="text-ink/50">Customer Name:</span>{" "}
                <span className="font-medium">{customerName}</span>
              </div>
              <div>
                <span className="text-ink/50">Date:</span>{" "}
                <span className="font-medium">{orderDate.toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-ink/50">Time:</span>{" "}
                <span className="font-medium">{orderDate.toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-ink/50">Total Quantity:</span>{" "}
                <span className="font-medium">{values.totalQty}</span>
              </div>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 font-medium text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {order.items.map((item) => (
                  <tr key={item.item_id} className="border-b border-dashed border-line">
                    <td className="py-2">{foodsById.get(item.item_id)?.name ?? item.item_id}</td>
                    <td className="py-2 text-right">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 ml-auto max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Subtotal</span>
                <span className="font-mono">₹{values.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">CGST (2.5%)</span>
                <span className="font-mono">₹{values.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">SGST (2.5%)</span>
                <span className="font-mono">₹{values.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Round Off</span>
                <span className="font-mono">₹{values.roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-line pt-2 text-base font-semibold">
                <span>Grand Total</span>
                <span className="font-mono">₹{values.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <InvoiceQrImage
                imagePath={qrImagePath}
                alt="Invoice QR"
                className="h-36 w-36 rounded-lg border border-line bg-white object-contain p-2"
              />
              <p className="text-center text-sm text-ink/70 whitespace-pre-line">{footerNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
