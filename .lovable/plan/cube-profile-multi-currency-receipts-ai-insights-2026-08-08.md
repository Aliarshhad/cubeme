# Cube — Profile, multi-currency, receipts & AI insights

## 1. Typography & copy

- App font becomes Helvetica (`Helvetica Neue, Helvetica, Arial` stack) for all body and heading text, replacing Manrope/Anton.
- Landing headline "EVERY RUPEE, ACCOUNTED FOR" becomes **"Money loves water"** in a free handwritten marker font (Caveat Brush, closest lookalike to Have Heart One).
- Subheading becomes: "A daily budgeting companion for monthly planning, it needs to move and flow to grow rather than stay still. When money sits in one place, it loses value, but when it circulates, it multiplies." — in Helvetica.

## 2. Profile page

New `/profile` page (linked from the nav and settings):

- Avatar upload (camera or gallery) stored in a private `avatars` storage bucket, shown in the header.
- Editable display name.
- Change email (sends a confirmation link to the new address).
- Optional password change.

## 3. Multi-currency with editable rates

- Settings gains a **Currency & rates** section: your base currency plus a rate table for the currencies you use.
- Rates auto-refresh daily from a free public rates API; every rate is editable and a manual override sticks until you reset it.
- Expense, lend/borrow and received/sent forms get a currency selector next to the amount. You enter e.g. 20 USD, and Cube stores both the original amount/currency/rate used and the converted base-currency value, so budgets and totals always add up in your base currency.
- Amounts display in base currency with the original shown underneath (e.g. "Rs 5,600 · $20").

## 4. Ledger upgrades

- **Expected return date (optional)** on lend and borrow entries, with an overdue badge once the date passes.
- **Received / Sent** entries in the same ledger: person, purpose/notes, amount, date, currency. These are plain money movements (not repayable), tracked with their own totals and affecting available budget (received adds, sent subtracts), kept visually distinct from lend/borrow.
- Ledger gets tabs: Lent · Borrowed · Received · Sent.

## 5. Receipt scanning

- "Scan receipt" button on the expenses page opens the camera or gallery picker.
- The photo is uploaded to a private `receipts` bucket and read by Lovable AI vision, which returns merchant, date, total, a suggested category, and line items (name, quantity, unit price, line total).
- A review screen shows the suggested expense — every field editable, including the category — before saving.
- Saved expenses keep a "More details" view listing the line items and the original receipt photo.

## 6. AI need vs want

- After a receipt scan (and on demand for any expense), AI labels each item/expense **Need** or **Want** with a one-line reason; you can flip the label manually.
- Dashboard shows a Needs vs Wants split for the month.

## 7. 50-30-20 guidance

- When you set or edit the monthly budget, Cube shows the 50/30/20 breakdown (needs / wants / savings) with the amounts for your budget, and tracks actual needs and wants spending against those targets during the month.

## 8. History page

- New `/history` page with Daily and Monthly views: day-by-day totals for a month, and month-by-month totals across the year, each with category breakdown and drill-down into entries. Includes expenses, receipts and ledger movements.

## Technical notes

- Database: add `avatar_url` to `profiles`; add `currency`, `original_amount`, `fx_rate` columns to `expenses` and `debts`; add `expected_return_on` to `debts` plus `received`/`sent` directions; new tables for `fx_rates` (per user, editable), `receipts`, `receipt_items`, and a `need_want` label on expenses/items. All with RLS scoped to `auth.uid()` and matching GRANTs.
- Storage: private `avatars` and `receipts` buckets with owner-only RLS policies; signed URLs for display.
- AI: receipt OCR/parsing and need-vs-want classification run in TanStack server functions through Lovable AI (`openai/gpt-5.6-sol`) with structured output; images passed as signed URLs.
- FX refresh runs in a server function with a per-user cache; user overrides are never overwritten by the auto refresh.
- Money math centralises in one conversion helper so budget, dashboard, ledger and history all agree.

## Suggested order

1. Fonts + landing copy (quick visible win)
2. Profile page + avatar storage
3. Currency/rates engine and form selectors
4. Ledger: expected return date, received/sent
5. 50-30-20 + needs/wants
6. Receipt scanning with AI + line items
7. History page
