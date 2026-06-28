interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-8 font-mono text-sm">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 border border-line rounded-sm disabled:opacity-30 hover:bg-ink/5 transition-colors"
      >
        ← Prev
      </button>
      <span className="text-ink/60">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 border border-line rounded-sm disabled:opacity-30 hover:bg-ink/5 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
