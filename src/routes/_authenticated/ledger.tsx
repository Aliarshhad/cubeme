import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/AppShell";
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
import { debtTotals, useCurrency, useDebts } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { dayLabel, formatMoney, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ledger")({
  head: () => ({
    meta: [
      { title: "Cube — Lending & borrowing" },
      {
        name: "description",
        content:
          "Track who owes you and who you owe. Open balances adjust your available budget automatically.",
      },
      { property: "og:title", content: "Cube — Lending & borrowing" },
      {
        property: "og:description",
        content: "Lend and borrow records that adjust your monthly budget automatically.",
      },
    ],
  }),
  component: Ledger,
});

function Ledger() {
  const currency = useCurrency();
  const debts = useDebts();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"lend" | "borrow">("lend");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["debts"] });

  const settle = useMutation({
    mutationFn: ({ id, settled }: { id: string; settled: boolean }) =>
      api.setDebtSettled(id, settled),
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteDebt(id),
    onSuccess: () => {
      invalidate();
      toast.success("Record deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = debts.data ?? [];
  const { lent, borrowed, net } = debtTotals(rows);
  const open_ = rows.filter((d) => !d.settled_at);
  const settled = rows.filter((d) => d.settled_at);

  return (
    <div className="space-y-4">
      <GlassCard>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Net effect on budget
        </p>
        <p
          className="font-display text-4xl text-glow"
          style={{ color: net < 0 ? "var(--destructive)" : "var(--success)" }}
        >
          {net >= 0 ? "+" : ""}
          {formatMoney(net, currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl glass-soft p-3">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <ArrowUpRight className="h-3 w-3" /> Lent out
            </p>
            <p className="mt-1 font-semibold">{formatMoney(lent, currency)}</p>
          </div>
          <div className="rounded-2xl glass-soft p-3">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <ArrowDownLeft className="h-3 w-3" /> Borrowed
            </p>
            <p className="mt-1 font-semibold">{formatMoney(borrowed, currency)}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-12 rounded-2xl"
          onClick={() => {
            setDirection("lend");
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> I lent
        </Button>
        <Button
          variant="secondary"
          className="h-12 rounded-2xl"
          onClick={() => {
            setDirection("borrow");
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> I borrowed
        </Button>
      </div>

      <Section title="Open">
        {open_.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">Nothing outstanding.</p>
        ) : (
          open_.map((d) => (
            <Row
              key={d.id}
              debt={d}
              currency={currency}
              onSettle={() => settle.mutate({ id: d.id, settled: true })}
              onDelete={() => remove.mutate(d.id)}
            />
          ))
        )}
      </Section>

      {settled.length > 0 && (
        <Section title="Settled">
          {settled.map((d) => (
            <Row
              key={d.id}
              debt={d}
              currency={currency}
              onSettle={() => settle.mutate({ id: d.id, settled: false })}
              onDelete={() => remove.mutate(d.id)}
            />
          ))}
        </Section>
      )}

      <DebtDialog open={open} onOpenChange={setOpen} direction={direction} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <GlassCard className="divide-y divide-border p-0">{children}</GlassCard>
    </div>
  );
}

function Row({
  debt,
  currency,
  onSettle,
  onDelete,
}: {
  debt: api.Debt;
  currency: string;
  onSettle: () => void;
  onDelete: () => void;
}) {
  const lend = debt.direction === "lend";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          lend ? "bg-destructive/25" : "bg-primary/25",
        )}
      >
        {lend ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", debt.settled_at && "line-through opacity-60")}>
          {debt.person}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {dayLabel(debt.occurred_on)}
          {debt.note ? ` · ${debt.note}` : ""}
        </p>
      </div>
      <span className="font-display text-lg">{formatMoney(debt.amount, currency)}</span>
      <div className="flex shrink-0 gap-1">
        <button
          aria-label={debt.settled_at ? "Reopen" : "Mark settled"}
          onClick={onSettle}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
        >
          {debt.settled_at ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          aria-label="Delete record"
          onClick={onDelete}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/25 hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function DebtDialog({
  open,
  onOpenChange,
  direction,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  direction: "lend" | "borrow";
}) {
  const queryClient = useQueryClient();
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayISO());
  const [note, setNote] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!person.trim()) throw new Error("Who is it with?");
      const value = Number(amount);
      if (!value || value <= 0) throw new Error("Enter an amount");
      await api.createDebt({
        direction,
        person: person.trim(),
        amount: value,
        occurred_on: occurredOn,
        note: note.trim() ? note.trim() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setPerson("");
      setAmount("");
      setNote("");
      setOccurredOn(todayISO());
      onOpenChange(false);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-[0.12em]">
            {direction === "lend" ? "Money I lent" : "Money I borrowed"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="person">Person</Label>
            <Input
              id="person"
              autoFocus
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="h-11 bg-input/40"
              placeholder="Name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="debt-amount">Amount</Label>
            <Input
              id="debt-amount"
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
            <Label htmlFor="debt-date">Date</Label>
            <Input
              id="debt-date"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="h-11 bg-input/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="debt-note">Note (optional)</Label>
            <Textarea
              id="debt-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-input/40"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {direction === "lend"
              ? "This will be subtracted from your available budget until settled."
              : "This will be added to your available budget until settled."}
          </p>
        </div>
        <DialogFooter>
          <Button
            className="h-12 w-full text-base"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            Save record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
