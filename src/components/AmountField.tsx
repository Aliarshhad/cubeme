import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FxRate } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { CURRENCY_OPTIONS, rateFor, toBase } from "@/lib/fx";

/**
 * Amount input with an optional currency switch.
 * Shows the converted base-currency value whenever a foreign currency is picked.
 */
export function AmountField({
  id,
  label = "Amount",
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  base,
  rates,
  autoFocus,
}: {
  id: string;
  label?: string;
  amount: string;
  onAmountChange: (v: string) => void;
  currency: string;
  onCurrencyChange: (v: string) => void;
  base: string;
  rates: FxRate[] | undefined;
  autoFocus?: boolean;
}) {
  const numeric = Number(amount) || 0;
  const rate = rateFor(currency, base, rates);
  const converted = toBase(numeric, currency, base, rates);
  const foreign = currency !== base;

  const codes = Array.from(
    new Set([base, ...CURRENCY_OPTIONS, ...(rates ?? []).map((r) => r.code)]),
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          autoFocus={autoFocus}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="h-12 flex-1 bg-input/40 font-display text-2xl"
          placeholder="0"
        />
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="h-12 w-[104px] bg-input/40" aria-label="Currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {codes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {foreign && (
        <p className="text-xs text-muted-foreground">
          ≈ {formatMoney(converted, base)} · rate 1 {currency} = {rate} {base}
        </p>
      )}
    </div>
  );
}
