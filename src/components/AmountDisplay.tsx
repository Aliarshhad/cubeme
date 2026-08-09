import { cn } from "@/lib/utils";

/**
 * Money display that shrinks as digits grow so long amounts never
 * escape their glass card. Optionally compacts millions/billions.
 */
export function AmountDisplay({
  value,
  currency,
  className,
  size = "hero",
  tone,
}: {
  value: number;
  currency: string;
  className?: string | undefined;
  size?: "hero" | "stat" | undefined;
  tone?: string | undefined;
}) {
  const full = format(value, currency, false);
  const compact = format(value, currency, true);
  const useCompact = size === "hero" ? full.length > 15 : full.length > 12;
  const text = useCompact ? compact : full;

  const fluid =
    size === "hero"
      ? text.length <= 9
        ? "text-[clamp(1.9rem,9vw,2.6rem)]"
        : text.length <= 13
          ? "text-[clamp(1.5rem,7vw,2.1rem)]"
          : "text-[clamp(1.15rem,5.5vw,1.6rem)]"
      : text.length <= 8
        ? "text-sm"
        : text.length <= 11
          ? "text-xs"
          : "text-[11px]";

  return (
    <p
      title={full}
      className={cn(
        "tnum block min-w-0 break-words font-display leading-[1.05]",
        fluid,
        className,
      )}
      style={tone ? { color: tone } : undefined}
    >
      {text}
    </p>
  );
}

function format(value: number, currency: string, compact: boolean) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 2 : Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}
