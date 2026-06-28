"use client";

import { API_BASE_URL } from "@/lib/api";
import { DEFAULT_INVOICE_QR_IMAGE } from "@/types";

interface InvoiceQrImageProps {
  imagePath: string | null | undefined;
  alt: string;
  className?: string;
}

export function InvoiceQrImage({ imagePath, alt, className }: InvoiceQrImageProps) {
  const src = imagePath ? `${API_BASE_URL}${imagePath}` : DEFAULT_INVOICE_QR_IMAGE;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.src !== window.location.origin + DEFAULT_INVOICE_QR_IMAGE) {
          image.src = DEFAULT_INVOICE_QR_IMAGE;
        }
      }}
    />
  );
}
