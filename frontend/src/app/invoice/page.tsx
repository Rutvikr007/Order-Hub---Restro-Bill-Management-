"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { getInvoiceConfig, saveInvoiceConfig } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { DEFAULT_INVOICE_FOOTER_NOTE, InvoiceConfig } from "@/types";
import { InvoiceQrImage } from "@/components/InvoiceQrImage";

interface InvoiceFormState {
  restaurant_name: string;
  restaurant_address: string;
  gst_number: string;
  footer_note: string;
  qr_image: File | null;
}

const EMPTY_FORM: InvoiceFormState = {
  restaurant_name: "",
  restaurant_address: "",
  gst_number: "",
  footer_note: DEFAULT_INVOICE_FOOTER_NOTE,
  qr_image: null,
};

export default function InvoiceManagementPage() {
  const storeId = useAppStore((state) => state.storeId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvoiceFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data: invoiceConfig, isLoading } = useQuery({
    queryKey: ["invoice-config", storeId],
    queryFn: () => getInvoiceConfig(storeId),
    enabled: Boolean(storeId),
  });

  useEffect(() => {
    if (invoiceConfig) {
      setForm({
        restaurant_name: invoiceConfig.restaurant_name,
        restaurant_address: invoiceConfig.restaurant_address,
        gst_number: invoiceConfig.gst_number,
        footer_note: invoiceConfig.footer_note || DEFAULT_INVOICE_FOOTER_NOTE,
        qr_image: null,
      });
      return;
    }

    setForm(EMPTY_FORM);
  }, [invoiceConfig, storeId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        restaurant_name: form.restaurant_name.trim(),
        restaurant_address: form.restaurant_address.trim(),
        gst_number: form.gst_number.trim(),
        footer_note: form.footer_note.trim() || DEFAULT_INVOICE_FOOTER_NOTE,
        qr_image: form.qr_image,
      };

      return saveInvoiceConfig(storeId, payload);
    },
    onSuccess: (savedConfig) => {
      setSaveMessage(`Saved invoice configuration for ${savedConfig.store_id}.`);
      queryClient.setQueryData(["invoice-config", storeId], savedConfig);
      queryClient.invalidateQueries({ queryKey: ["invoice-config", storeId] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaveMessage(null);

    if (!form.restaurant_name.trim()) {
      setFormError("Restaurant name is required.");
      return;
    }
    if (!form.restaurant_address.trim()) {
      setFormError("Restaurant address is required.");
      return;
    }
    if (!form.gst_number.trim()) {
      setFormError("GST number is required.");
      return;
    }

    saveMutation.mutate();
  }

  const previewConfig: Pick<InvoiceConfig, "qr_image_path" | "footer_note" | "restaurant_name"> = {
    qr_image_path: invoiceConfig?.qr_image_path ?? null,
    footer_note: form.footer_note.trim() || DEFAULT_INVOICE_FOOTER_NOTE,
    restaurant_name: form.restaurant_name.trim() || invoiceConfig?.restaurant_name || "Restaurant Name",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] items-start">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">
          Invoice Management
        </p>
        <h1 className="font-display text-3xl font-bold mb-1">Store invoice configuration</h1>
        <p className="text-ink/60 mb-8">
          One configuration per store. Saving updates the existing record for the selected store
          instead of creating a duplicate.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-line rounded-sm p-5 space-y-4 max-w-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Restaurant Name</label>
              <input
                type="text"
                value={form.restaurant_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, restaurant_name: event.target.value }))
                }
                className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">GST Number</label>
              <input
                type="text"
                value={form.gst_number}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gst_number: event.target.value }))
                }
                className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Restaurant Address</label>
            <textarea
              value={form.restaurant_address}
              onChange={(event) =>
                setForm((current) => ({ ...current, restaurant_address: event.target.value }))
              }
              rows={4}
              className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">QR Image Upload</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) =>
                setForm((current) => ({ ...current, qr_image: event.target.files?.[0] ?? null }))
              }
              className="text-sm"
            />
            <p className="text-xs text-ink/40 mt-1">
              If nothing is uploaded, the page uses <span className="font-mono">QR.png</span> from
              <span className="font-mono"> frontend/public</span>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Footer Note</label>
            <input
              type="text"
              value={form.footer_note}
              onChange={(event) =>
                setForm((current) => ({ ...current, footer_note: event.target.value }))
              }
              className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-ink/40 mt-1">
              Default: <span className="font-mono">{DEFAULT_INVOICE_FOOTER_NOTE}</span>
            </p>
          </div>

          {formError && <p className="text-sm text-rust">{formError}</p>}
          {saveMutation.isError && (
            <p className="text-sm text-rust">
              Could not save the invoice configuration. Please check the form and try again.
            </p>
          )}
          {saveMessage && <p className="text-sm text-accent">{saveMessage}</p>}

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-ink text-canvas rounded-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save configuration"}
          </button>
        </form>

        {isLoading && <p className="text-ink/50 mt-4">Loading configuration…</p>}
      </section>

      <aside className="bg-white border border-line rounded-sm p-5 lg:sticky lg:top-24">
        <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-3">Preview</p>
        <div className="border border-dashed border-line rounded-sm p-4 space-y-4">
          <div className="text-center">
            <p className="font-display font-bold text-lg">{previewConfig.restaurant_name}</p>
            <p className="text-sm text-ink/60 whitespace-pre-line mt-2">
              {form.restaurant_address.trim() || "Restaurant Address"}
            </p>
          </div>

          <div className="flex justify-center">
            <InvoiceQrImage
              imagePath={previewConfig.qr_image_path}
              alt="Invoice QR preview"
              className="w-48 h-48 object-contain border border-line bg-white"
            />
          </div>

          <div className="text-center text-sm text-ink/70">
            <p className="font-mono">GST: {form.gst_number.trim() || "GST Number"}</p>
            <p className="mt-3 whitespace-pre-line">{previewConfig.footer_note}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
