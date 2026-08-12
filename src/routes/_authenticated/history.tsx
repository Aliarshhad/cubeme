import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { GlassCard } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAllExpenses, useBudgets, useCategories, useCurrency } from "@/hooks/use-cube";
import { ACTIVITY_PAGE_SIZE, fetchActivity } from "@/lib/activity";
import * as api from "@/lib/api";
import { dayLabel, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Cube — Spending history" },
      {
        name: "description",
        content: "Review your spending day by day and month by month, with category breakdowns.",
      },
      { property: "og:title", content: "Cube — Spending history" },
      {
        property: "og:description",
        content: "Daily and monthly expense history with category breakdowns.",
      },
    ],
  }),
  component: History,
});

function History() {
  const currency = useCurrency();
  const expenses = useAllExpenses();
  const budgets = useBudgets();
  const categories = useCategories();
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const rows = expenses.data ?? [];
  const catName = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.name ?? "Uncategorised";

  const daily = groupTotals(rows, (e) => e.spent_on);
  const monthly = groupTotals(rows, (e) => `${e.spent_on.slice(0, 7)}-01`);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["daily", "monthly"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 rounded-2xl border border-border py-2.5 text-sm capitalize transition-colors",
              view === v ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <GlassCard>
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        </GlassCard>
      )}

      {view === "daily"
        ? daily.map(([day, items, total]) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {dayLabel(day)}
                </p>
                <p className="text-sm font-semibold">{formatMoney(total, currency)}</p>
              </div>
              <GlassCard className="divide-y divide-border p-0">
                {items.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{catName(e.category_id)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.note ?? ""}
                        {e.need_want ? ` · ${e.need_want}` : ""}
                      </p>
                    </div>
                    <span className="text-sm">{formatMoney(e.amount, currency)}</span>
                  </div>
                ))}
              </GlassCard>
            </div>
          ))
        : monthly.map(([month, items, total]) => {
            const budget = budgets.data?.find((b) => b.month === month)?.amount ?? 0;
            const byCat = (categories.data ?? [])
              .map((c) => ({
                name: c.name,
                color: c.color,
                total: items
                  .filter((e) => e.category_id === c.id)
                  .reduce((s, e) => s + e.amount, 0),
              }))
              .filter((c) => c.total > 0)
              .sort((a, b) => b.total - a.total);
            return (
              <GlassCard key={month} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-lg uppercase tracking-[0.12em]">{api.monthLabel(month)}</p>
                  <p className="font-display text-2xl">{formatMoney(total, currency)}</p>
                </div>
                {budget > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Budget {formatMoney(budget, currency)} ·{" "}
                    {Math.round((total / budget) * 100)}% used
                  </p>
                )}
                <ul className="space-y-1.5">
                  {byCat.map((c) => (
                    <li key={c.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                      <span>{formatMoney(c.total, currency)}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            );
          })}
    </div>
  );
}

function groupTotals(rows: api.Expense[], keyOf: (e: api.Expense) => string) {
  const map = new Map<string, api.Expense[]>();
  for (const e of rows) {
    const k = keyOf(e);
    const list = map.get(k);
    if (list) list.push(e);
    else map.set(k, [e]);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([k, items]) => [k, items, items.reduce((s, e) => s + e.amount, 0)] as const);
}
