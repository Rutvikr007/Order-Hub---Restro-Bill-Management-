import { FoodImage } from "./FoodImage";
import { QtyStepper } from "./QtyStepper";
import { Food } from "@/types";

export interface CartEntry {
  food: Food;
  qty: number;
}

interface OrderSummaryPanelProps {
  storeId: string;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  cart: CartEntry[];
  onIncrement: (foodId: string) => void;
  onDecrement: (foodId: string) => void;
  gstRate: 5 | 18;
  onGstRateChange: (rate: 5 | 18) => void;
  formError: string | null;
  isSubmitError: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function OrderSummaryPanel({
  storeId,
  customerName,
  onCustomerNameChange,
  cart,
  onIncrement,
  onDecrement,
  gstRate,
  onGstRateChange,
  formError,
  isSubmitError,
  isSubmitting,
  onSubmit,
}: OrderSummaryPanelProps) {
  const subtotal = cart.reduce((sum, entry) => sum + Number(entry.food.price) * entry.qty, 0);
  const gstAmount = subtotal * (gstRate / 100);
  const grandTotal = subtotal + gstAmount;
  const itemCount = cart.reduce((sum, entry) => sum + entry.qty, 0);

  return (
    <div className="bg-white border border-line rounded-xl shadow-sm p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg">Order Summary</h2>
        <span className="font-mono text-xs text-ink/50">{storeId}</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-ink/70 mb-1.5">
          Customer name <span className="text-ink/40">(optional)</span>
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          className="w-full border border-line bg-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {cart.length === 0 ? (
        <div className="border border-dashed border-line rounded-sm p-5 text-center text-sm text-ink/50 mb-4">
          Your order is empty. Tap any item to begin.
        </div>
      ) : (
        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
          {cart.map(({ food, qty }) => (
            <li key={food.id} className="flex items-center gap-2.5">
              <FoodImage
                imagePath={food.image_path}
                alt={food.name}
                className="w-9 h-9 rounded-sm object-cover border border-line shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{food.name}</p>
                <p className="font-mono text-xs text-ink/50">
                  ₹{Number(food.price).toFixed(2)} each
                </p>
              </div>
              <QtyStepper
                qty={qty}
                onIncrement={() => onIncrement(food.id)}
                onDecrement={() => onDecrement(food.id)}
                size="sm"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-dashed border-line pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink/60">Subtotal · {itemCount} item{itemCount === 1 ? "" : "s"}</span>
          <span className="font-mono">₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-ink/60 flex items-center gap-2">
            GST
            <span className="inline-flex rounded-full border border-line overflow-hidden">
              {([5, 18] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onGstRateChange(rate)}
                  className={`px-2 py-0.5 text-xs font-mono transition-colors ${
                    gstRate === rate ? "bg-ink text-canvas" : "bg-white text-ink/60 hover:bg-ink/5"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </span>
          </span>
          <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-dashed border-line">
          <span>Grand total</span>
          <span className="font-mono">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {formError && <p className="text-sm text-rust mt-3">{formError}</p>}
      {isSubmitError && (
        <p className="text-sm text-rust mt-3">Could not place the order. Check the form and try again.</p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || cart.length === 0}
        className="mt-4 w-full px-4 py-2.5 bg-ink text-canvas rounded-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Firing order…" : "Fire order"}
      </button>
    </div>
  );
}
