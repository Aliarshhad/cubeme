import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Repeat, TrendingDown, TrendingUp, Pencil, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { AmountDisplay } from "@/components/AmountDisplay";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { GlassCard } from "@/components/AppShell";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { ExpenseDialog } from "@/components/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";
import { formatMoney } from "@/lib/format";
import {
  debtTotals,
  useAppliedRecurring,
  useBudget,
  useCategories,
  useCurrency,
  useDebts,
  useExpenses,
  useMonthState,
  useRecurring,
} from "@/hooks/use-cube";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Cube — Monthly budget dashboard" },
      {
        name: "description",
        content:
          "Track your monthly budget, spending by category and open lending balances in Cube.",
      },
      { property: "og:title", content: "Cube — Monthly budget dashboard" },
      {
        property: "og:description",
        content: "Your monthly budget, expenses and lend/borrow balances at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

/* progress is shown by the category bars below */

function Dashboard() {
  const { month, label, prev, next } = useMonthState();
  const currency = useCurrency();
  const queryClient = useQueryClient();

  const budget = useBudget(month);
  const expenses = useExpenses(month);
  const debts = useDebts();
  const categories = useCategories();
  const recurring = useRecurring();
  const applied = useAppliedRecurring(month);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const saveBudget = useMutation({
    mutationFn: (amount: number) => api.setBudget(month, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", month] });
      setEditingBudget(false);
      toast.success("Budget updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (recurring.data ?? []).filter(
    (r) => r.active && !(applied.data ?? []).includes(r.id),
  );

  const applyPending = useMutation({
    mutationFn: () => api.applyRecurring(month, pending),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", month] });
      queryClient.invalidateQueries({ queryKey: ["recurring-applied", month] });
      toast.success("Recurring expenses added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const budgetAmount = budget.data ?? 0;
  const spent = (expenses.data ?? []).reduce((s, e) => s + e.amount, 0);
  const { lent, borrowed, received, sent } = debtTotals(debts.data ?? []);
  const remaining = budgetAmount - spent - lent - sent + borrowed + received;

  const byCategory = (categories.data ?? [])
    .map((c) => ({
      ...c,
      total: (expenses.data ?? [])
        .filter((e) => e.category_id === c.id)
        .reduce((s, e) => s + e.amount, 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      <MonthSwitcher label={label} onPrev={prev} onNext={next} />

      <GlassCard>
        <div className="min-w-0 space-y-2" data-tour="available">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Available</p>
          <AmountDisplay
            value={remaining}
            currency={currency}
            className="text-glow"
            tone={remaining < 0 ? "var(--destructive)" : undefined}
          />
          {editingBudget ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveBudget.mutate(Number(budgetDraft) || 0);
              }}
            >
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                step="0.01"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                className="h-9 bg-input/40"
                placeholder="Monthly budget"
              />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          ) : (
            <button
              onClick={() => {
                setBudgetDraft(String(budgetAmount || ""));
                setEditingBudget(true);
              }}
              data-tour="budget"
              className="flex max-w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="truncate">Budget {formatMoney(budgetAmount, currency)}</span>
              <Pencil className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center" data-tour="pills">
          <Stat label="Spent" value={spent} currency={currency} />
          <Stat label="Lent out" value={lent} currency={currency} tone="down" />
          <Stat label="Borrowed" value={borrowed} currency={currency} tone="up" />

        </div>
      </GlassCard>

      <div className="flex gap-2">
        <Button
          data-tour="add-expense"
          className="h-14 flex-1 rounded-3xl text-base font-semibold"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1 h-5 w-5" /> Add expense
        </Button>
        <Button
          data-tour="scan"
          variant="secondary"
          className="h-14 rounded-3xl px-5 text-base font-semibold"
          onClick={() => setScanOpen(true)}
        >
          <ScanLine className="mr-1 h-5 w-5" /> Scan
        </Button>
      </div>



      {pending.length > 0 && (
        <GlassCard className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Repeat className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-display text-lg">Recurring ready</p>
              <p className="text-sm text-muted-foreground">
                {pending.length} item{pending.length > 1 ? "s" : ""} not yet added to {label}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => applyPending.mutate()} disabled={applyPending.isPending}>
            Add all
          </Button>
        </GlassCard>
      )}

      <GlassCard>
        <h2 className="mb-3 text-lg uppercase tracking-[0.14em]">Where it went</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses logged for {label} yet.</p>
        ) : (
          <ul className="space-y-3">
            {byCategory.map((c) => (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="font-semibold">{formatMoney(c.total, currency)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${spent > 0 ? (c.total / spent) * 100 : 0}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-lg uppercase tracking-[0.14em]">More to love</h2>
          <p className="text-sm text-muted-foreground">A peek at what&apos;s coming to Cube next.</p>
        </div>
        <GlassCard className="relative">
          <span className="absolute right-4 top-4 rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Coming soon
          </span>
          <p className="pr-24 font-display text-xl tracking-tight">Bill Split</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Split a group expense evenly and add everyone&apos;s share straight to your ledger — no
            manual math.
          </p>
        </GlassCard>
      </section>

      <ExpenseDialog open={addOpen} onOpenChange={setAddOpen} />
      <ReceiptScanner open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}

function Stat({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone?: "up" | "down" | undefined;
}) {
  return (
    <div className="min-w-0 rounded-2xl glass-soft px-2 py-3">
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {tone === "up" && <TrendingUp className="h-3 w-3" />}
        {tone === "down" && <TrendingDown className="h-3 w-3" />}
        {label}
      </p>
      <AmountDisplay
        value={value}
        currency={currency}
        size="stat"
        className="mt-1 font-semibold"
      />
    </div>

  );
}
