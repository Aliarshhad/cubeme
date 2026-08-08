import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type Expense = {
  id: string;
  amount: number;
  spent_on: string;
  note: string | null;
  category_id: string | null;
};

export type Debt = {
  id: string;
  direction: "lend" | "borrow";
  person: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  settled_at: string | null;
};

export type Recurring = {
  id: string;
  label: string;
  amount: number;
  category_id: string | null;
  day_of_month: number;
  active: boolean;
};

export type Profile = {
  id: string;
  display_name: string | null;
  currency: string;
};

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

export const monthLabel = (key: string) =>
  new Date(key).toLocaleDateString(undefined, { month: "long", year: "numeric" });

export const shiftMonth = (key: string, delta: number) => {
  const d = new Date(key);
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
};

const monthRange = (key: string) => {
  const start = new Date(key);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start: monthKey(start), end: monthKey(end) };
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/* ---------------- profile ---------------- */

export async function fetchProfile(): Promise<Profile> {
  const id = await uid();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, currency")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;
  const inserted = await supabase
    .from("profiles")
    .insert({ id })
    .select("id, display_name, currency")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data as Profile;
}

export async function updateProfile(patch: { display_name?: string; currency?: string }) {
  const id = await uid();
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------------- categories ---------------- */

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, color, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(input: { name: string; color: string }) {
  const user_id = await uid();
  const { error } = await supabase
    .from("categories")
    .insert({ ...input, user_id, sort_order: 99 });
  if (error) throw error;
}

export async function updateCategory(id: string, patch: { name?: string; color?: string }) {
  const { error } = await supabase.from("categories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- budget ---------------- */

export async function fetchBudget(month: string): Promise<number> {
  const { data, error } = await supabase
    .from("monthly_budgets")
    .select("amount")
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data ? Number(data.amount) : 0;
}

export async function setBudget(month: string, amount: number) {
  const user_id = await uid();
  const { error } = await supabase
    .from("monthly_budgets")
    .upsert({ user_id, month, amount }, { onConflict: "user_id,month" });
  if (error) throw error;
}

/* ---------------- expenses ---------------- */

export async function fetchExpenses(month: string): Promise<Expense[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, spent_on, note, category_id")
    .gte("spent_on", start)
    .lt("spent_on", end)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[];
}

export type ExpenseInput = {
  amount: number;
  category_id: string | null;
  spent_on: string;
  note: string | null;
};

export async function createExpense(input: ExpenseInput) {
  const user_id = await uid();
  const { error } = await supabase.from("expenses").insert({ ...input, user_id });
  if (error) throw error;
}

export async function updateExpense(id: string, patch: Partial<ExpenseInput>) {
  const { error } = await supabase.from("expenses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- debts ---------------- */

export async function fetchDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("id, direction, person, amount, occurred_on, note, settled_at")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...d, amount: Number(d.amount) })) as Debt[];
}

export type DebtInput = {
  direction: "lend" | "borrow";
  person: string;
  amount: number;
  occurred_on: string;
  note: string | null;
};

export async function createDebt(input: DebtInput) {
  const user_id = await uid();
  const { error } = await supabase.from("debts").insert({ ...input, user_id });
  if (error) throw error;
}

export async function updateDebt(id: string, patch: Partial<DebtInput>) {
  const { error } = await supabase.from("debts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setDebtSettled(id: string, settled: boolean) {
  const { error } = await supabase
    .from("debts")
    .update({ settled_at: settled ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDebt(id: string) {
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- recurring ---------------- */

export async function fetchRecurring(): Promise<Recurring[]> {
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("id, label, amount, category_id, day_of_month, active")
    .order("day_of_month", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Recurring[];
}

export type RecurringInput = {
  label: string;
  amount: number;
  category_id: string | null;
  day_of_month: number;
  active: boolean;
};

export async function createRecurring(input: RecurringInput) {
  const user_id = await uid();
  const { error } = await supabase.from("recurring_expenses").insert({ ...input, user_id });
  if (error) throw error;
}

export async function updateRecurring(id: string, patch: Partial<RecurringInput>) {
  const { error } = await supabase.from("recurring_expenses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteRecurring(id: string) {
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAppliedRecurringIds(month: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("recurring_applied")
    .select("recurring_id")
    .eq("month", month);
  if (error) throw error;
  return (data ?? []).map((r) => r.recurring_id);
}

/** Adds the given recurring items as real expenses for the month and logs them. */
export async function applyRecurring(month: string, items: Recurring[]) {
  const user_id = await uid();
  for (const item of items) {
    const day = String(item.day_of_month).padStart(2, "0");
    const spent_on = `${month.slice(0, 7)}-${day}`;
    const inserted = await supabase
      .from("expenses")
      .insert({
        user_id,
        amount: item.amount,
        category_id: item.category_id,
        spent_on,
        note: item.label,
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    const logged = await supabase.from("recurring_applied").insert({
      user_id,
      recurring_id: item.id,
      month,
      expense_id: inserted.data.id,
    });
    if (logged.error) throw logged.error;
  }
}
