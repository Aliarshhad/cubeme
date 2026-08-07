import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthSwitcher({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-full glass-soft px-2 py-1.5">
      <button
        onClick={onPrev}
        aria-label="Previous month"
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/25 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-display text-sm uppercase tracking-[0.18em]">{label}</span>
      <button
        onClick={onNext}
        aria-label="Next month"
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/25 hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
