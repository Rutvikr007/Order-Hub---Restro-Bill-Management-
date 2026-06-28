"use client";

import { useQuery } from "@tanstack/react-query";
import { listFoods } from "@/lib/api";
import { Food } from "@/types";

/**
 * React Query dedupes/caches this across every component that calls it,
 * so OrderTicket, the order detail page, and the order screen can each
 * call this independently without triggering duplicate network requests.
 */
export function useFoods() {
  return useQuery({
    queryKey: ["foods"],
    queryFn: () => listFoods(),
    staleTime: 30_000,
  });
}

export function useFoodsMap(): Map<string, Food> {
  const { data } = useFoods();
  const map = new Map<string, Food>();
  (data ?? []).forEach((food) => map.set(food.id, food));
  return map;
}