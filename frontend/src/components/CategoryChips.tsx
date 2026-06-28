interface CategoryChipsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export const ALL_CATEGORY = "All";

export function CategoryChips({ categories, active, onChange }: CategoryChipsProps) {
  const chips = [ALL_CATEGORY, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {chips.map((chip) => {
        const isActive = chip === active;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onChange(chip)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
              isActive
                ? "bg-ink text-canvas border-ink"
                : "border-line bg-white text-ink/70 hover:bg-ink/5"
            }`}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}   