import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense?: api.Expense | undefined;
}) {
  const categories = useCategories();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [spentOn, setSpentOn] = useState(todayISO());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(expense ? String(expense.amount) : "");
    setCategoryId(expense?.category_id ?? categories.data?.[0]?.id ?? null);
    setSpentOn(expense?.spent_on ?? todayISO());
    setNote(expense?.note ?? "");
  }, [open, expense, categories.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: api.ExpenseInput = {
        amount: Number(amount),
        category_id: categoryId,
        spent_on: spentOn,
        note: note.trim() ? note.trim() : null,
      };
      if (!payload.amount || payload.amount <= 0) throw new Error("Enter an amount");
      if (expense) await api.updateExpense(expense.id, payload);
      else await api.createExpense(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onOpenChange(false);
      toast.success(expense ? "Expense updated" : "Expense added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-[0.12em]">
            {expense ? "Edit expense" : "New expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              autoFocus
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-input/40 font-display text-2xl"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {(categories.data ?? []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
                    categoryId === c.id
                      ? "bg-primary text-primary-foreground"
                      : "glass-soft text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
              className="h-11 bg-input/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note / details (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-input/40"
              rows={2}
              placeholder="What was it for?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="h-12 w-full text-base"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {expense ? "Save changes" : "Add expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
