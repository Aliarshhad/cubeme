import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AmountField } from "@/components/AmountField";
import { ReceiptDetails } from "@/components/ReceiptDetails";
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
import { useCategories, useCurrency, useFxRates } from "@/hooks/use-cube";
import { needOrWant } from "@/lib/ai.functions";
import * as api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { rateFor, toBase } from "@/lib/fx";
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
  const base = useCurrency();
  const rates = useFxRates(base);
  const queryClient = useQueryClient();
  const classify = useServerFn(needOrWant);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(base);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [spentOn, setSpentOn] = useState(todayISO());
  const [note, setNote] = useState("");
  const [needWant, setNeedWant] = useState<api.NeedWant>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(expense ? String(expense.original_amount ?? expense.amount) : "");
    setCurrency(expense?.currency ?? base);
    setCategoryId(expense?.category_id ?? categories.data?.[0]?.id ?? null);
    setSpentOn(expense?.spent_on ?? todayISO());
    setNote(expense?.note ?? "");
    setNeedWant(expense?.need_want ?? null);
    setReason("");
  }, [open, expense, categories.data, base]);

  const askAi = useMutation({
    mutationFn: async () => {
      const category = categories.data?.find((c) => c.id === categoryId)?.name ?? "Uncategorised";
      return classify({
        data: {
          description: note,
          category,
          amount: Number(amount) || 0,
          currency,
        },
      });
    },
    onSuccess: (res) => {
      setNeedWant(res.label);
      setReason(res.reason);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const entered = Number(amount);
      if (!entered || entered <= 0) throw new Error("Enter an amount");
      const rate = rateFor(currency, base, rates.data);
      const payload: api.ExpenseInput = {
        amount: toBase(entered, currency, base, rates.data),
        category_id: categoryId,
        spent_on: spentOn,
        note: note.trim() ? note.trim() : null,
        currency,
        original_amount: entered,
        fx_rate: rate,
        need_want: needWant,
      };
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
      <DialogContent className="glass max-h-[90vh] overflow-y-auto border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-[0.12em]">
            {expense ? "Edit expense" : "New expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AmountField
            id="amount"
            autoFocus
            amount={amount}
            onAmountChange={setAmount}
            currency={currency}
            onCurrencyChange={setCurrency}
            base={base}
            rates={rates.data}
          />

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

          <div className="space-y-1.5">
            <Label>Need or want</Label>
            <div className="flex flex-wrap items-center gap-2">
              {(["need", "want"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setNeedWant(needWant === v ? null : v)}
                  className={cn(
                    "rounded-full border border-border px-3 py-1.5 text-sm capitalize transition-colors",
                    needWant === v
                      ? "bg-primary text-primary-foreground"
                      : "glass-soft text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => askAi.mutate()}
                disabled={askAi.isPending}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {askAi.isPending ? "Thinking…" : "Ask AI"}
              </Button>
            </div>
            {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
          </div>

          {expense?.receipt_id && <ReceiptDetails receiptId={expense.receipt_id} />}
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
