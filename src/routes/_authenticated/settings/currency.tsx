import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useOfflineStatus } from "@/lib/offline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFxRates, useProfile } from "@/hooks/use-cube";
import { logActivity } from "@/lib/activity";
import * as api from "@/lib/api";
import { CURRENCIES } from "@/lib/format";
import { CURRENCY_OPTIONS } from "@/lib/fx";
import { getLiveRates } from "@/lib/fx.functions";

export const Route = createFileRoute("/_authenticated/settings/currency")({
  head: () => ({
    meta: [
      { title: "Cube — Currency & exchange rates" },
      {
        name: "description",
        content:
          "Choose your base currency and refresh or override the exchange rates Cube uses for converted amounts.",
      },
      { property: "og:title", content: "Cube — Currency & exchange rates" },
      {
        property: "og:description",
        content: "Base currency plus automatic and manual exchange rates.",
      },
    ],
  }),
  component: CurrencyPage,
});

function CurrencyPage() {
  const profile = useProfile();
  const queryClient = useQueryClient();
  const base = profile.data?.currency ?? "PKR";
  const rates = useFxRates(base);
  const refresh = useServerFn(getLiveRates);

  const saveCurrency = useMutation({
    mutationFn: (value: string) => api.updateProfile({ currency: value }),
    onSuccess: (_d, value) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      void logActivity("currency", `Changed base currency to ${value}`);
      toast.success("Base currency updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refreshRates = useMutation({
    mutationFn: async () => {
      const res = await refresh({ data: { base, codes: [...CURRENCY_OPTIONS] } });
      await api.saveAutoRates(base, res.rates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fx-rates", base] });
      void logActivity("rates", "Refreshed exchange rates");
      toast.success("Rates refreshed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setRate = useMutation({
    mutationFn: ({ code, rate }: { code: string; rate: number }) =>
      api.upsertFxRate({ base, code, rate, manual: true }),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["fx-rates", base] });
      void logActivity("rates", `Set the ${v.code} rate to ${v.rate}`);
      toast.success("Rate saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRate = useMutation({
    mutationFn: (id: string) => api.deleteFxRate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fx-rates", base] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg uppercase tracking-[0.14em]">Currency &amp; rates</h1>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refreshRates.mutate()}
            disabled={refreshRates.isPending || !offline.online}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Base currency</Label>
          <Select value={base} onValueChange={(v) => saveCurrency.mutate(v)}>
            <SelectTrigger className="h-11 bg-input/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          A rate is what one unit of that currency is worth in {base}. Edit any rate to override the
          automatic value.
        </p>

        <ul className="space-y-2">
          {CURRENCY_OPTIONS.filter((c) => c !== base).map((code) => {
            const row = rates.data?.find((r) => r.code === code);
            return (
              <li key={code} className="flex items-center gap-2">
                <span className="w-12 text-sm font-semibold">{code}</span>
                <Input
                  key={`${code}-${row?.rate ?? "none"}`}
                  defaultValue={row ? String(row.rate) : ""}
                  inputMode="decimal"
                  placeholder="—"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0 && v !== row?.rate) setRate.mutate({ code, rate: v });
                  }}
                  className="h-9 flex-1 bg-input/40"
                />
                {row?.manual && (
                  <button
                    aria-label={`Reset ${code} rate`}
                    onClick={() => removeRate.mutate(row.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </div>
  );
}
