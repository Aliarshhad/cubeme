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

export function useExpenses(month: string) {
  return useQuery({ queryKey: ["expenses", month], queryFn: () => api.fetchExpenses(month) });
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

/** Open (unsettled) lend/borrow totals — these move the available budget. */
export function debtTotals(debts: api.Debt[]) {
  let lent = 0;
  let borrowed = 0;
  for (const d of debts) {
    if (d.settled_at) continue;
    if (d.direction === "lend") lent += d.amount;
    else borrowed += d.amount;
  }
  return { lent, borrowed, net: borrowed - lent };
}
