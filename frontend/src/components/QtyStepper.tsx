interface QtyStepperProps {
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
}

export function QtyStepper({ qty, onIncrement, onDecrement, size = "md" }: QtyStepperProps) {
  const dims = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDecrement();
        }}
        aria-label="Decrease quantity"
        className={`${dims} flex items-center justify-center rounded-full font-mono font-semibold text-ink/60 hover:bg-white hover:text-rust transition-colors`}
      >
        −
      </button>
      <span className="w-5 text-center font-mono text-sm font-semibold">{qty}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onIncrement();
        }}
        aria-label="Increase quantity"
        className={`${dims} flex items-center justify-center rounded-full font-mono font-semibold text-ink/60 hover:bg-white hover:text-accent transition-colors`}
      >
        +
      </button>
    </div>
  );
}