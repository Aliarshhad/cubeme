import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AmountField } from "@/components/AmountField";
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
import { debtTotals, useCurrency, useDebts, useFxRates } from "@/hooks/use-cube";
import * as api from "@/lib/api";
import { dayLabel, formatMoney, todayISO } from "@/lib/format";
import { rateFor, toBase } from "@/lib/fx";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ledger")({
  head: () => ({
    meta: [
      { title: "Cube — Lending, borrowing & transfers" },
      {
        name: "description",
        content:
          "Track money lent, borrowed, received and sent, with expected return dates and automatic budget effects.",
      },
      { property: "og:title", content: "Cube — Lending, borrowing & transfers" },
      {
        property: "og:description",
        content: "Lend, borrow, receive and send records that adjust your monthly budget.",
      },
    ],
  }),
  component: Ledger;
});

const TABS: { key: api.DebtDirection; label: string }[] = [
  { key: "lend", label: "Lent" },
  { key: "borrow", label: "Borrowed" },
  { key: "received", label: "Received" },
  { key: "sent", label: "Sent" },
];

function Ledger() {
  const currency = useCurrency();
  const debts = useDebts();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<api.DebtDirection>("lend");
  const [tab, setTab] = useState<api.DebtDirection>("lend");

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
  const { lent, borrowed, received, sent, net } = debtTotals(rows);
  const visible = rows.filter((d) => d.direction === tab);

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
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile label="Lent out" value={formatMoney(lent, currency)} />
          <Tile label="Borrowed" value={formatMoney(borrowed, currency)} />
          <Tile label="Received" value={formatMoney(received, currency)} />
          <Tile label="Sent" value={formatMoney(sent, currency)} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={t.key === "lend" ? "default" : "secondary"}
            className="h-12 rounded-2xl"
            onClick={() => {
              setDirection(t.key);
              setTab(t.key);
              setOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 rounded-full border border-border px-4 py-1.5 text-sm transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <GlassCard className="divide-y divide-border p-0">
        {visible.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          visible.map((d) => (
            <Row
              key={d.id}
              debt={d}
              currency={currency}
              onSettle={() => settle.mutate({ id: d.id, settled: !d.settled_at })}
              onDelete={() => remove.mutate(d.id)}
            />
          ))
        )}
      </GlassCard>

      <DebtDialog open={open} onOpenChange={setOpen} direction={direction} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass-soft p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-semibold">{value}</p>
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
  const outgoing = debt.direction === "lend" || debt.direction === "sent";
  const repayable = debt.direction === "lend" || debt.direction === "borrow";
  const overdue =
    repayable && !debt.settled_at && !!debt.expected_return_on && debt.expected_return_on < todayISO();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          outgoing ? "bg-destructive/25" : "bg-primary/25",
        )}
      >
        {outgoing ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", debt.settled_at && "line-through opacity-60")}>
          {debt.person}
          {overdue && (
            <span className="ml-2 rounded-full bg-destructive/30 px-2 py-0.5 text-[10px] uppercase">
              Overdue
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {dayLabel(debt.occurred_on)}
          {debt.purpose ? ` · ${debt.purpose}` : ""}
          {debt.note ? ` · ${debt.note}` : ""}
          {debt.expected_return_on ? ` · due ${dayLabel(debt.expected_return_on)}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-display text-lg">{formatMoney(debt.amount, currency)}</span>
        {debt.currency && debt.currency !== currency && debt.original_amount != null && (
          <p className="text-[11px] text-muted-foreground">
            {formatMoney(debt.original_amount, debt.currency)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {repayable && (
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
        )}
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

const TITLES: Record<api.DebtDirection, string> = {
  lend: "Money I lent",
  borrow: "Money I borrowed",
  received: "Amount received",
  sent: "Amount sent",
};

const HINTS: Record<api.DebtDirection, string> = {
  lend: "Subtracted from your available budget until settled.",
  borrow: "Added to your available budget until settled.",
  received: "Added to your available budget.",
  sent: "Subtracted from your available budget.",
};

function DebtDialog({
  open,
  onOpenChange,
  direction,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  direction: api.DebtDirection;
}) {
  const queryClient = useQueryClient();
  const base = useCurrency();
  const rates = useFxRates(base);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(base);
  const [occurredOn, setOccurredOn] = useState(todayISO());
  const [expectedOn, setExpectedOn] = useState("");
  const [purpose, setPurpose] = useState("");
  const [note, setNote] = useState("");

  const repayable = direction === "lend" || direction === "borrow";

  const save = useMutation({
    mutationFn: async () => {
      if (!person.trim()) throw new Error("Who is it with?");
      const value = Number(amount);
      if (!value || value <= 0) throw new Error("Enter an amount");
      await api.createDebt({
        direction,
        person: person.trim(),
        amount: toBase(value, currency, base, rates.data),
        original_amount: value,
        currency,
        fx_rate: rateFor(currency, base, rates.data),
        occurred_on: occurredOn,
        expected_return_on: repayable && expectedOn ? expectedOn : null,
        purpose: purpose.trim() ? purpose.trim() : null,
        note: note.trim() ? note.trim() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setPerson("");
      setAmount("");
      setPurpose("");
      setNote("");
      setExpectedOn("");
      setOccurredOn(todayISO());
      onOpenChange(false);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[90vh] overflow-y-auto border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-[0.12em]">
            {TITLES[direction]}
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

          <AmountField
            id="debt-amount"
            amount={amount}
            onAmountChange={setAmount}
            currency={currency}
            onCurrencyChange={setCurrency}
            base={base}
            rates={rates.data}
          />

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

          {repayable && (
            <div className="space-y-1.5">
              <Label htmlFor="debt-expected">Expected return date (optional)</Label>
              <Input
                id="debt-expected"
                type="date"
                value={expectedOn}
                onChange={(e) => setExpectedOn(e.target.value)}
                className="h-11 bg-input/40"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="debt-purpose">Purpose (optional)</Label>
            <Input
              id="debt-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="h-11 bg-input/40"
              placeholder="Rent, gift, salary…"
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

          <p className="text-xs text-muted-foreground">{HINTS[direction]}</p>
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
