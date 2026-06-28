import { FoodImage } from "./FoodImage";
import { QtyStepper } from "./QtyStepper";
import { Food } from "@/types";

interface FoodCardProps {
  food: Food;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function FoodCard({ food, qty, onIncrement, onDecrement }: FoodCardProps) {
  const inOrder = qty > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onIncrement}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onIncrement();
        }
      }}
      className={`bg-white border rounded-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col cursor-pointer ${
        inOrder ? "border-accent ring-1 ring-accent/30" : "border-line"
      }`}
    >
      <div className="relative bg-white">
        <FoodImage
          imagePath={food.image_path}
          alt={food.name}
          className="w-full h-28 sm:h-32 object-contain p-3"
        />
        {food.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur border border-line text-[10px] font-mono uppercase tracking-wide text-ink/60">
            {food.category}
          </span>
        )}
        {inOrder && (
          <span className="absolute top-2 right-2 inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
            {qty}
          </span>
        )}
      </div>

      <div className="px-3 pb-3 pt-2 flex flex-col gap-2 flex-1">
        <div className="text-center">
          <p className="font-medium leading-tight text-sm sm:text-[15px]">{food.name}</p>
        </div>

        {inOrder ? (
          <div className="mt-auto pt-1" onClick={(event) => event.stopPropagation()}>
            <QtyStepper qty={qty} onIncrement={onIncrement} onDecrement={onDecrement} size="sm" />
          </div>
        ) : (
          <div className="mt-auto pt-1">
            <div className="w-full rounded-sm bg-[#374151] px-3 py-2 text-center font-mono text-sm font-medium text-white">
              ₹{Number(food.price).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
