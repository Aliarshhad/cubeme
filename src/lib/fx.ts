import type { FxRate } from "@/lib/api";

/** Currency options offered across the app. */
export const CURRENCY_OPTIONS = [
  "PKR",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AED",
  "SAR",
  "CAD",
  "AUD",
  "TRY",
  "CNY",
  "JPY",
] as const;

/** Rate = how many units of the base currency one unit of `code` is worth. */
export function rateFor(code: string, base: string, rates: FxRate[] | undefined) {
  if (code === base) return 1;
  return rates?.find((r) => r.code === code)?.rate ?? 1;
}

/** Convert an amount entered in `code` into the base currency. */
export function toBase(amount: number, code: string, base: string, rates: FxRate[] | undefined) {
  return amount * rateFor(code, base, rates);
}

export function isConverted(code: string | null | undefined, base: string) {
  return !!code && code !== base;
}
