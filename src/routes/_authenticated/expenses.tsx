import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/AppShell";
import { ExpenseDialog } from "@/components/ExpenseDialog";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Button } from "@/components/ui/button";
import { useCategories, useCurrency, useExpenses, useMonthState } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { dayLabel, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Cube — Expenses" },
      {
        name: "description",
        content: "Every expense you logged this month, grouped by day and filterable by category.",
      },
      { property: "og:title", content: "Cube — Expenses" },
      {
        property: "og:description",
        content: "Add, edit and review your daily expenses with categories and notes.",
      },
    ],
  }),
  component: Expenses,
});

function Expenses() {
  const { month, label, prev, next } = useMonthState();
  const currency = useCurrency();
  const categories = useCategories();
  const expenses = useExpenses(month);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<api.Expense | undefined>();

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const catName = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.name ?? "Uncategorised";
  const catColor = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.color ?? "var(--muted-foreground)";

  const rows = (expenses.data ?? []).filter((e) => !filter || e.category_id === filter);
  const total = rows.reduce((s, e) => s + e.amount, 0);

  const groups = rows.reduce<Record<string, api.Expense[]>>((acc, e) => {
    (acc[e.spent_on] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <MonthSwitcher label={label} onPrev={prev} onNext={next} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</p>
          <p className="font-display text-3xl text-glow">{formatMoney(total, currency)}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <FilterChip active={filter === null} onClick={() => setFilter(null)} label="All" />
        {(categories.data ?? []).map((c) => (
          <FilterChip
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
            label={c.name}
            color={c.color}
          />
        ))}
      </div>

      {Object.keys(groups).length === 0 ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">Nothing logged here yet.</p>
        </GlassCard>
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <div key={day} className="space-y-2">
            <p className="px-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {dayLabel(day)}
            </p>
            <GlassCard className="divide-y divide-border p-0">
              {items.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: catColor(e.category_id) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{catName(e.category_id)}</p>
                    {e.note && (
                      <p className="truncate text-xs text-muted-foreground">{e.note}</p>
                    )}
                  </div>
                  <span className="font-display text-lg">{formatMoney(e.amount, currency)}</span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      aria-label="Edit expense"
                      onClick={() => {
                        setEditing(e);
                        setDialogOpen(true);
                      }}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete expense"
                      onClick={() => remove.mutate(e.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        ))
      )}

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground",
      )}
    >
      {color && (
        <span
          className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}
