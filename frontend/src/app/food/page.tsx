"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createFood, deleteFood, listFoods, updateFood } from "@/lib/api";
import { FoodImage } from "@/components/FoodImage";
import { Food } from "@/types";

interface FormState {
  id: string | null; // null = creating a new item
  name: string;
  price: string;
  category: string;
  image: File | null;
  removeImage: boolean;
}

const EMPTY_FORM: FormState = { id: null, name: "", price: "", category: "", image: null, removeImage: false };

export default function FoodManagementPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: foods, isLoading } = useQuery({
    queryKey: ["foods"],
    queryFn: () => listFoods(),
  });

  const invalidateFoods = () => queryClient.invalidateQueries({ queryKey: ["foods"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim() || undefined,
        image: form.image,
        removeImage: form.removeImage,
      };
      return form.id ? updateFood(form.id, payload) : createFood(payload);
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      invalidateFoods();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: invalidateFoods,
  });

  function startEdit(food: Food) {
    setForm({
      id: food.id,
      name: food.name,
      price: food.price,
      category: food.category ?? "",
      image: null,
      removeImage: false,
    });
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Food name is required.");
      return;
    }
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      setFormError("Enter a valid price.");
      return;
    }

    saveMutation.mutate();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">Food Management</p>
      <h1 className="font-display text-3xl font-bold mb-1">Build the menu once</h1>
      <p className="text-ink/60 mb-8">
        Add every food item here with its price and photo. The order screen will pull from this
        list instead of asking for name, price, or image each time.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-line rounded-sm p-5 mb-10 space-y-4 max-w-xl"
      >
        <h2 className="font-display font-bold text-lg">
          {form.id ? "Update food item" : "Add a new Item"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Item name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="FarmHouse Pizza"
              className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Price (₹)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-line bg-white rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">Category (optional)</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Pizza, Beverages, Desserts…"
            className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null, removeImage: false }))}
            className="text-sm"
          />
          <p className="text-xs text-ink/40 mt-1">
            No image uploaded? <span className="font-mono">default-food.png</span> is shown instead.
          </p>
          {form.id && (
            <label className="flex items-center gap-2 text-xs text-ink/60 mt-2">
              <input
                type="checkbox"
                checked={form.removeImage}
                onChange={(e) => setForm((f) => ({ ...f, removeImage: e.target.checked, image: null }))}
              />
              Remove current image
            </label>
          )}
        </div>

        {formError && <p className="text-sm text-rust">{formError}</p>}
        {saveMutation.isError && (
          <p className="text-sm text-rust">Could not save this food item. Check the form and try again.</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-ink text-canvas rounded-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : form.id ? "Update food" : "Create food"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormError(null);
              }}
              className="text-sm text-ink/50 hover:text-ink"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {isLoading && <p className="text-ink/50">Loading menu…</p>}

      {foods && foods.length === 0 && (
        <div className="border border-dashed border-line rounded-sm p-10 text-center text-ink/50">
          No food items yet. Add your first one above.
        </div>
      )}

      {foods && foods.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food) => (
            <div key={food.id} className="bg-white border border-line rounded-sm overflow-hidden">
              <FoodImage
                imagePath={food.image_path}
                alt={food.name}
                className="w-full h-36 object-cover border-b border-line"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display font-bold leading-tight">{food.name}</p>
                  <p className="font-mono font-semibold whitespace-nowrap">
                    ₹{Number(food.price).toFixed(2)}
                  </p>
                </div>
                {food.category && (
                  <p className="text-xs text-ink/50 font-mono uppercase tracking-wide mt-1">
                    {food.category}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <button onClick={() => startEdit(food)} className="text-accent font-medium hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${food.name}"? This cannot be undone.`)) {
                        deleteMutation.mutate(food.id);
                      }
                    }}
                    className="text-rust font-medium hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}