import { supabase } from "@/integrations/supabase/client";
import {
  currentUserId,
  readRows,
  readValue,
  writeDelete,
  writeInsert,
  writeUpdate,
  writeUpsert,
} from "@/lib/offline";

const money = (n: number) => n.toLocaleString();

export type Category = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type NeedWant = "need" | "want" | null;

export type Expense = {
  id: string;
  amount: number;
  spent_on: string;
  note: string | null;
  category_id: string | null;
  currency: string | null;
  original_amount: number | null;
  fx_rate: number;
  need_want: NeedWant;
  receipt_id: string | null;
};

export type DebtDirection = "lend" | "borrow" | "received" | "sent";

export type Debt = {
  id: string;
  direction: DebtDirection;
  person: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  purpose: string | null;
  settled_at: string | null;
  expected_return_on: string | null;
  returned_on: string | null;
  currency: string | null;
  original_amount: number | null;
  fx_rate: number;
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
  avatar_url: string | null;
  theme: string;
  reminder_enabled: boolean;
  reminder_time: string;
  tour_completed_at: string | null;
};

export type FxRate = {
  id: string;
  base: string;
  code: string;
  rate: number;
  manual: boolean;
  fetched_at: string | null;
};

export type Receipt = {
  id: string;
  image_path: string | null;
  merchant: string | null;
  receipt_date: string | null;
  total: number | null;
  currency: string | null;
  category_id: string | null;
};

export type ReceiptItem = {
  id: string;
  receipt_id: string;
  name: string;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
  need_want: NeedWant;
  reason: string | null;
  sort_order: number;
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
  const id = await currentUserId();
  if (!id) throw new Error("Not signed in");
  return id;
}

/* ---------------- profile ---------------- */

export async function fetchProfile(): Promise<Profile> {
  const id = await uid();
  const cols =
    "id, display_name, currency, avatar_url, theme, reminder_enabled, reminder_time, tour_completed_at";
  const cached = await readValue<Profile | null>(
    "profile",
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(cols)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Profile | null;
    },
    (value, ops) => {
      let next = value;
      for (const op of ops) {
        if (op.table === "profiles" && op.op === "update" && next)
          next = { ...next, ...(op.payload as Partial<Profile>) };
      }
      return next;
    },
  );
  if (cached) return cached;
  const inserted = await supabase.from("profiles").insert({ id }).select(cols).single();
  if (inserted.error) throw inserted.error;
  return inserted.data as Profile;
}

export async function updateProfile(patch: {
  display_name?: string;
  currency?: string;
  avatar_url?: string | null;
  theme?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
  tour_completed_at?: string | null;
}) {
  const id = await uid();
  await writeUpdate("profiles", id, patch);
}

export async function updateEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function currentEmail() {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? "";
}

export async function uploadAvatar(file: File) {
  const id = await uid();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${id}/avatar-${Date.now()}.${ext}`;
  const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (up.error) throw up.error;
  await updateProfile({ avatar_url: path });
  return path;
}

export async function signedUrl(bucket: string, path: string, seconds = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

/* ---------------- categories ---------------- */

export async function fetchCategories(): Promise<Category[]> {
  return readRows<Category>("categories", "categories", fetchCategoriesNet, {
    sort: (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  });
}

async function fetchCategoriesNet(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, color, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(input: { name: string; color: string }) {
  await writeInsert("categories", { ...input, sort_order: 99 });
}

export async function updateCategory(id: string, patch: { name?: string; color?: string }) {
  await writeUpdate("categories", id, patch);
}

export async function deleteCategory(id: string) {
  await writeDelete("categories", id);
}

/* ---------------- fx rates ---------------- */

export async function fetchFxRates(base: string): Promise<FxRate[]> {
  const { data, error } = await supabase
    .from("fx_rates")
    .select("id, base, code, rate, manual, fetched_at")
    .eq("base", base)
    .order("code", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, rate: Number(r.rate) })) as FxRate[];
}

export async function upsertFxRate(input: {
  base: string;
  code: string;
  rate: number;
  manual: boolean;
  fetched_at?: string | null;
}) {
  const user_id = await uid();
  const { error } = await supabase
    .from("fx_rates")
    .upsert(
      {
        user_id,
        base: input.base,
        code: input.code,
        rate: input.rate,
        manual: input.manual,
        fetched_at: input.fetched_at ?? new Date().toISOString(),
      },
      { onConflict: "user_id,base,code" },
    );
  if (error) throw error;
}

export async function deleteFxRate(id: string) {
  const { error } = await supabase.from("fx_rates").delete().eq("id", id);
  if (error) throw error;
}

/** Writes fetched rates, never overwriting a manually edited rate. */
export async function saveAutoRates(base: string, rates: Record<string, number>) {
  const existing = await fetchFxRates(base);
  const manual = new Set(existing.filter((r) => r.manual).map((r) => r.code));
  const stamp = new Date().toISOString();
  for (const [code, rate] of Object.entries(rates)) {
    if (manual.has(code) || code === base) continue;
    await upsertFxRate({ base, code, rate, manual: false, fetched_at: stamp });
  }
}

/* ---------------- budget ---------------- */

export async function fetchBudget(month: string): Promise<number> {
  return readValue<number>(
    `budget:${month}`,
    async () => {
      const { data, error } = await supabase
        .from("monthly_budgets")
        .select("amount")
        .eq("month", month)
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.amount) : 0;
    },
    (cached, ops) => {
      let value = cached ?? 0;
      for (const op of ops) {
        if (op.table !== "monthly_budgets") continue;
        const payload = op.payload as { month?: string; amount?: number };
        if (payload.month === month && payload.amount != null) value = Number(payload.amount);
      }
      return value;
    },
  );
}

export async function setBudget(month: string, amount: number) {
  await writeUpsert("monthly_budgets", { month, amount }, "user_id,month", {
    action: "budget",
    activity: `Set the ${monthLabel(month)} budget to ${money(amount)}`,
  });
}

export async function fetchBudgets(): Promise<{ month: string; amount: number }[]> {
  return readValue<{ month: string; amount: number }[]>(
    "budgets",
    async () => {
      const { data, error } = await supabase
        .from("monthly_budgets")
        .select("month, amount")
        .order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b) => ({ month: b.month, amount: Number(b.amount) }));
    },
    (cached, ops) => {
      const rows = [...(cached ?? [])];
      for (const op of ops) {
        if (op.table !== "monthly_budgets") continue;
        const payload = op.payload as { month?: string; amount?: number };
        if (!payload.month || payload.amount == null) continue;
        const existing = rows.findIndex((r) => r.month === payload.month);
        const row = { month: payload.month, amount: Number(payload.amount) };
        if (existing >= 0) rows[existing] = row;
        else rows.push(row);
      }
      return rows.sort((a, b) => (a.month < b.month ? 1 : -1));
    },
  );
}

/* ---------------- expenses ---------------- */

const EXPENSE_COLS =
  "id, amount, spent_on, note, category_id, currency, original_amount, fx_rate, need_want, receipt_id";

const mapExpense = (e: Record<string, unknown>): Expense =>
  ({
    ...e,
    amount: Number(e['amount']),
    original_amount: e['original_amount'] == null ? null : Number(e['original_amount']),
    fx_rate: Number(e['fx_rate'] ?? 1),
  }) as Expense;

export async function fetchExpenses(month: string): Promise<Expense[]> {
  const { start, end } = monthRange(month);
  return readRows<Expense>(`expenses:${month}`, "expenses", () => fetchExpensesNet(month), {
    filter: (e) => e.spent_on >= start && e.spent_on < end,
    sort: (a, b) => (a.spent_on < b.spent_on ? 1 : -1),
  });
}

async function fetchExpensesNet(month: string): Promise<Expense[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_COLS)
    .gte("spent_on", start)
    .lt("spent_on", end)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function fetchAllExpenses(): Promise<Expense[]> {
  return readRows<Expense>("expenses:all", "expenses", fetchAllExpensesNet, {
    sort: (a, b) => (a.spent_on < b.spent_on ? 1 : -1),
  });
}

async function fetchAllExpensesNet(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_COLS)
    .order("spent_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export type ExpenseInput = {
  amount: number;
  category_id: string | null;
  spent_on: string;
  note: string | null;
  currency?: string | null;
  original_amount?: number | null;
  fx_rate?: number;
  need_want?: NeedWant;
  receipt_id?: string | null;
};

export async function createExpense(input: ExpenseInput) {
  return writeInsert("expenses", { fx_rate: 1, ...input }, {
    action: "expense",
    activity: `Added an expense of ${money(input.amount)}${input.note ? ` \u2014 ${input.note}` : ""}`,
  });
}

export async function updateExpense(id: string, patch: Partial<ExpenseInput>) {
  await writeUpdate("expenses", id, patch, {
    action: "expense",
    activity:
      patch.amount != null
        ? `Edited an expense to ${money(patch.amount)}`
        : "Edited an expense",
  });
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- receipts ---------------- */

export async function uploadReceiptImage(file: File) {
  const id = await uid();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${id}/receipt-${Date.now()}.${ext}`;
  const up = await supabase.storage.from("receipts").upload(path, file);
  if (up.error) throw up.error;
  return path;
}

export async function createReceipt(input: {
  image_path: string | null;
  merchant: string | null;
  receipt_date: string | null;
  total: number | null;
  currency: string | null;
  category_id: string | null;
  raw?: unknown;
}) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("receipts")
    .insert({ ...input, raw: (input.raw ?? null) as never, user_id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchReceipt(id: string): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from("receipts")
    .select("id, image_path, merchant, receipt_date, total, currency, category_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? ({ ...data, total: data.total == null ? null : Number(data.total) } as Receipt) : null;
}

export type ReceiptItemInput = {
  name: string;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
  need_want: NeedWant;
  reason: string | null;
};

export async function createReceiptItems(receipt_id: string, items: ReceiptItemInput[]) {
  if (items.length === 0) return;
  const user_id = await uid();
  const rows = items.map((it, i) => ({ ...it, receipt_id, user_id, sort_order: i }));
  const { error } = await supabase.from("receipt_items").insert(rows);
  if (error) throw error;
}

export async function fetchReceiptItems(receipt_id: string): Promise<ReceiptItem[]> {
  const { data, error } = await supabase
    .from("receipt_items")
    .select("id, receipt_id, name, quantity, unit_price, line_total, need_want, reason, sort_order")
    .eq("receipt_id", receipt_id)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    quantity: Number(r.quantity),
    unit_price: r.unit_price == null ? null : Number(r.unit_price),
    line_total: r.line_total == null ? null : Number(r.line_total),
  })) as ReceiptItem[];
}

export async function updateReceiptItem(
  id: string,
  patch: Partial<ReceiptItemInput> & { sort_order?: number },
) {
  const { error } = await supabase.from("receipt_items").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------------- debts / transfers ---------------- */

const DEBT_COLS =
  "id, direction, person, amount, occurred_on, note, purpose, settled_at, expected_return_on, returned_on, currency, original_amount, fx_rate";

export async function fetchDebts(): Promise<Debt[]> {
  return readRows<Debt>("debts", "debts", fetchDebtsNet, {
    sort: (a, b) => (a.occurred_on < b.occurred_on ? 1 : -1),
  });
}

async function fetchDebtsNet(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select(DEBT_COLS)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    amount: Number(d.amount),
    original_amount: d.original_amount == null ? null : Number(d.original_amount),
    fx_rate: Number(d.fx_rate ?? 1),
  })) as Debt[];
}

export type DebtInput = {
  direction: DebtDirection;
  person: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  purpose?: string | null;
  expected_return_on?: string | null;
  currency?: string | null;
  original_amount?: number | null;
  fx_rate?: number;
};

const debtLabel = (input: Pick<DebtInput, "direction" | "person" | "amount">) => {
  const amount = money(input.amount);
  if (input.direction === "lend") return `Lent ${amount} to ${input.person}`;
  if (input.direction === "borrow") return `Borrowed ${amount} from ${input.person}`;
  if (input.direction === "received") return `Received ${amount} from ${input.person}`;
  return `Sent ${amount} to ${input.person}`;
};

export async function createDebt(input: DebtInput) {
  await writeInsert("debts", { fx_rate: 1, ...input }, {
    action: "ledger",
    activity: debtLabel(input),
  });
}

export async function updateDebt(id: string, patch: Partial<DebtInput>) {
  await writeUpdate("debts", id, patch, {
    action: "ledger",
    activity: `Edited a ledger entry${patch.person ? ` with ${patch.person}` : ""}`,
  });
}

export async function setDebtSettled(id: string, settled: boolean) {
  const now = new Date();
  await writeUpdate(
    "debts",
    id,
    {
      settled_at: settled ? now.toISOString() : null,
      returned_on: settled ? now.toLocaleDateString("en-CA") : null,
    },
    {
      action: "ledger",
      activity: settled ? "Marked a ledger entry settled" : "Reopened a settled ledger entry",
    },
  );
}

export async function deleteDebt(id: string) {
  await writeDelete("debts", id, { action: "ledger", activity: "Deleted a ledger entry" });
}

/* ---------------- recurring ---------------- */

export async function fetchRecurring(): Promise<Recurring[]> {
  return readRows<Recurring>("recurring", "recurring_expenses", fetchRecurringNet, {
    sort: (a, b) => a.day_of_month - b.day_of_month,
  });
}

async function fetchRecurringNet(): Promise<Recurring[]> {
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
  await writeInsert("recurring_expenses", input, {
    action: "recurring",
    activity: `Added the recurring expense \u201c${input.label}\u201d (${money(input.amount)})`,
  });
}

export async function updateRecurring(id: string, patch: Partial<RecurringInput>) {
  await writeUpdate("recurring_expenses", id, patch, {
    action: "recurring",
    activity: "Edited a recurring expense",
  });
}

export async function deleteRecurring(id: string) {
  await writeDelete("recurring_expenses", id, {
    action: "recurring",
    activity: "Deleted a recurring expense",
  });
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
  for (const item of items) {
    const day = String(item.day_of_month).padStart(2, "0");
    const spent_on = `${month.slice(0, 7)}-${day}`;
    const expenseId = await writeInsert(
      "expenses",
      {
        amount: item.amount,
        category_id: item.category_id,
        spent_on,
        note: item.label,
        fx_rate: 1,
      },
      {
        action: "recurring",
        activity: `Recurring expense \u201c${item.label}\u201d added to ${monthLabel(month)} (${money(item.amount)})`,
      },
    );
    await writeInsert("recurring_applied", {
      recurring_id: item.id,
      month,
      expense_id: expenseId,
    });
  }
}
