import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import * as api from "@/lib/api";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: api.fetchProfile });
}

export function useCurrency() {
  const { data } = useProfile();
  return data?.currency ?? "PKR";
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: api.fetchCategories });
}

export function useMonthState() {
  const [month, setMonth] = useState(() => api.monthKey(new Date()));
  return {
    month,
    setMonth,
    next: () => setMonth((m) => api.shiftMonth(m, 1)),
    prev: () => setMonth((m) => api.shiftMonth(m, -1)),
    label: api.monthLabel(month),
  };
}

export function useBudget(month: string) {
  return useQuery({ queryKey: ["budget", month], queryFn: () => api.fetchBudget(month) });
}

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: api.fetchBudgets });
}

export function useExpenses(month: string) {
  return useQuery({ queryKey: ["expenses", month], queryFn: () => api.fetchExpenses(month) });
}

export function useAllExpenses() {
  return useQuery({ queryKey: ["expenses", "all"], queryFn: api.fetchAllExpenses });
}

export function useDebts() {
  return useQuery({ queryKey: ["debts"], queryFn: api.fetchDebts });
}

export function useRecurring() {
  return useQuery({ queryKey: ["recurring"], queryFn: api.fetchRecurring });
}

export function useAppliedRecurring(month: string) {
  return useQuery({
    queryKey: ["recurring-applied", month],
    queryFn: () => api.fetchAppliedRecurringIds(month),
  });
}

export function useFxRates(base: string) {
  return useQuery({ queryKey: ["fx-rates", base], queryFn: () => api.fetchFxRates(base) });
}

export function useReceiptItems(receiptId: string | null | undefined) {
  return useQuery({
    queryKey: ["receipt-items", receiptId],
    queryFn: () => api.fetchReceiptItems(receiptId as string),
    enabled: !!receiptId,
  });
}

export function useReceipt(receiptId: string | null | undefined) {
  return useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: () => api.fetchReceipt(receiptId as string),
    enabled: !!receiptId,
  });
}

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", bucket, path],
    queryFn: () => api.signedUrl(bucket, path as string),
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Money movements that change the available budget.
 * Lend/borrow only count while unsettled; received/sent are one-off movements.
 */
export function debtTotals(debts: api.Debt[]) {
  let lent = 0;
  let borrowed = 0;
  let received = 0;
  let sent = 0;
  for (const d of debts) {
    if (d.direction === "received") {
      received += d.amount;
      continue;
    }
    if (d.direction === "sent") {
      sent += d.amount;
      continue;
    }
    if (d.settled_at) continue;
    if (d.direction === "lend") lent += d.amount;
    else borrowed += d.amount;
  }
  return { lent, borrowed, received, sent, net: borrowed - lent + received - sent };
}

/** Needs vs wants split for a set of expenses. */
export function needWantTotals(expenses: api.Expense[]) {
  let need = 0;
  let want = 0;
  let unlabelled = 0;
  for (const e of expenses) {
    if (e.need_want === "need") need += e.amount;
    else if (e.need_want === "want") want += e.amount;
    else unlabelled += e.amount;
  }
  return { need, want, unlabelled };
}
