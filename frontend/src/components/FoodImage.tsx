"use client";

import { API_BASE_URL } from "@/lib/api";
import { DEFAULT_FOOD_IMAGE } from "@/types";

interface FoodImageProps {
  imagePath: string | null | undefined;
  alt: string;
  className?: string;
}

export function FoodImage({ imagePath, alt, className }: FoodImageProps) {
  const src = imagePath ? `${API_BASE_URL}${imagePath}` : DEFAULT_FOOD_IMAGE;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        // If an uploaded image 404s for any reason, fall back gracefully
        // instead of showing a broken-image icon.
        const img = e.currentTarget;
        if (img.src !== window.location.origin + DEFAULT_FOOD_IMAGE) {
          img.src = DEFAULT_FOOD_IMAGE;
        }
      }}
    />
  );
}