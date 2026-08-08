/** Server-only helpers for exchange-rate lookups. */

export async function fetchRatesFromProvider(base: string, codes: string[]) {
  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
  if (!res.ok) throw new Error("Could not reach the exchange-rate service");
  const json = (await res.json()) as {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };
  if (json.result !== "success" || !json.rates) {
    throw new Error("Exchange-rate service returned no rates");
  }

  // Provider gives units of `code` per 1 base. We store base per 1 code.
  const out: Record<string, number> = {};
  for (const code of codes) {
    if (code === base) continue;
    const perBase = json.rates[code];
    if (typeof perBase === "number" && perBase > 0) {
      out[code] = Number((1 / perBase).toFixed(6));
    }
  }
  return { rates: out, updatedAt: json.time_last_update_utc ?? null };
}
