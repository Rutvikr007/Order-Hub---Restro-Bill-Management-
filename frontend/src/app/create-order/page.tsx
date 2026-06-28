"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createOrder, encodeOrderId } from "@/lib/api";
import { useFoods } from "@/lib/useFoodsMap";
import { useAppStore } from "@/store/useAppStore";
import { ALL_CATEGORY, CategoryChips } from "@/components/CategoryChips";
import { FoodCard } from "@/components/FoodCard";
import { FoodCardSkeleton } from "@/components/FoodCardSkeleton";
import { CartEntry, OrderSummaryPanel } from "@/components/OrderSummaryPanel";
import { Food } from "@/types";

export default function CreateOrderPage() {
  const router = useRouter();
  const storeId = useAppStore((s) => s.storeId);
  const { data: foods, isLoading: foodsLoading } = useFoods();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  // Cart lives as foodId -> qty. A Map keyed by id is what naturally
  // prevents duplicate line items - incrementing an existing key just
  // bumps its quantity instead of adding a second entry.
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [customerName, setCustomerName] = useState("");
  const [gstRate, setGstRate] = useState<5 | 18>(5);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      router.push(`/orders/${encodeOrderId(order.id)}`);
    },
  });

  const foodsById = useMemo(() => {
    const map = new Map<string, Food>();
    (foods ?? []).forEach((f) => map.set(f.id, f));
    return map;
  }, [foods]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (foods ?? []).forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort();
  }, [foods]);

  const searchLower = search.trim().toLowerCase();
  const filteredFoods = (foods ?? []).filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchLower);
    const matchesCategory = activeCategory === ALL_CATEGORY || food.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // When browsing "All", group the grid under category headings so the
  // catalog still reads as organized even without picking a single chip.
  const groupedSections = useMemo(() => {
    if (activeCategory !== ALL_CATEGORY) {
      return [{ label: activeCategory, items: filteredFoods }];
    }
    const groups = new Map<string, Food[]>();
    filteredFoods.forEach((food) => {
      const key = food.category ?? "Uncategorized";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(food);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => ({ label, items }));
  }, [activeCategory, filteredFoods]);

  // Cart updates are pure local state - no network round-trip - so every
  // tap is reflected instantly in both the grid and the summary panel.
  // That instant, no-server-wait update is the "optimistic" UX here.
  function increment(foodId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(foodId, (next.get(foodId) ?? 0) + 1);
      return next;
    });
  }

  function decrement(foodId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      const current = next.get(foodId) ?? 0;
      if (current <= 1) {
        next.delete(foodId);
      } else {
        next.set(foodId, current - 1);
      }
      return next;
    });
  }

  const cartEntries: CartEntry[] = Array.from(cart.entries())
    .map(([foodId, qty]) => {
      const food = foodsById.get(foodId);
      return food ? { food, qty } : null;
    })
    .filter((entry): entry is CartEntry => entry !== null);

  function handleSubmit() {
    setFormError(null);

    if (cartEntries.length === 0) {
      setFormError("Add at least one item to the order.");
      return;
    }

    // Same API contract as before: store_id, customer_name, items[].
    // GST shown in the summary is a frontend display calculation only -
    // the backend still computes total_amount from each food's saved
    // price, so no endpoint changes were needed for this UI rework.
    mutation.mutate({
      store_id: storeId,
      customer_name: customerName.trim() || undefined,
      items: cartEntries.map(({ food, qty }) => ({ item_id: food.id, qty })),
    });
  }

  const hasFoods = (foods?.length ?? 0) > 0;

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">New order</p>
      <h1 className="font-display text-3xl font-bold mb-1">Fire a ticket for {storeId}</h1>
      <p className="text-ink/60 mb-6">
        Switch stores from the selector at the top if this order belongs elsewhere.
      </p>

      {!foodsLoading && !hasFoods && (
        <div className="border border-dashed border-line rounded-sm p-8 text-center text-ink/60 max-w-xl">
          No food items yet — add some in <span className="font-medium text-ink">Food</span> first,
          then come back here to take an order.
        </div>
      )}

      {(foodsLoading || hasFoods) && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8 items-start">
          {/* Item grid - ~70% on desktop, stacks above the summary on mobile/tablet */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full sm:max-w-xs border border-line bg-white rounded-full px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {!foodsLoading && (
              <div className="mb-5">
                <CategoryChips
                  categories={categories}
                  active={activeCategory}
                  onChange={setActiveCategory}
                />
              </div>
            )}

            {foodsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <FoodCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="border border-dashed border-line rounded-sm p-10 text-center text-ink/50">
                No items match {search ? `"${search}"` : "this category"}. Try a different search
                or category.
              </div>
            ) : (
              <div className="space-y-8">
                {groupedSections.map((section) => (
                  <div key={section.label}>
                    {activeCategory === ALL_CATEGORY && (
                      <p className="font-mono text-xs uppercase tracking-wide text-ink/40 mb-3">
                        {section.label}
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                      {section.items.map((food) => (
                        <FoodCard
                          key={food.id}
                          food={food}
                          qty={cart.get(food.id) ?? 0}
                          onIncrement={() => increment(food.id)}
                          onDecrement={() => decrement(food.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary - ~30% on desktop, sticky; stacked below the grid on mobile/tablet */}
          <OrderSummaryPanel
            storeId={storeId}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            cart={cartEntries}
            onIncrement={increment}
            onDecrement={decrement}
            gstRate={gstRate}
            onGstRateChange={setGstRate}
            formError={formError}
            isSubmitError={mutation.isError}
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
}
