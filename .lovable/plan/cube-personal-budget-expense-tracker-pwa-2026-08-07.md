# Cube — Personal Budget & Expense Tracker (PWA)

A premium, dark liquid-glass budgeting app named **Cube**, using your uploaded cube logo in the header and as the app icon. Red / maroon / black with white text, frosted glass cards over soft red glow blobs.

## What you'll be able to do

**Sign in**
- Email + password account so your data syncs across phone and desktop.
- Everything you add is saved to your account and visible whenever you come back.

**Monthly budget**
- Pick a month (with quick month switcher) and set that month's total budget.
- Header summary: Budget set, Spent, Remaining, plus a progress ring that turns amber/red as you approach the limit.
- Remaining = Budget − Expenses − Money lent + Money borrowed.

**Expenses**
- Add an expense with amount, category, date, and an optional note/details.
- Starter categories: Travelling, Food, Strike, Home, Extra.
- Add your own categories, rename any category (including the starters), pick its color, and delete unused ones.
- Edit or delete any expense; list grouped by day, filterable by category.

**Lending / Borrowing**
- Log "I lent to X" or "I borrowed from Y" with amount, person, optional note and date.
- Lending automatically subtracts from your available budget; borrowing adds to it.
- Mark an entry as settled/repaid — that reverses its effect on the budget.
- Open balances summary: total owed to you, total you owe.

**Recurring expenses**
- Save repeating items (rent, bills, subscriptions) with an amount, category and day-of-month.
- When you open a new month, Cube shows the pending recurring items and you confirm to add them (one tap, no surprise duplicates).

**Currency**
- Currency picker in settings, defaulting to PKR (Rs). Affects all formatting.

**Installable PWA + offline**
- Add Cube to your home screen with the cube icon and standalone (no browser bars) launch.
- App shell is cached so it opens without internet; entries you view stay readable, and new entries sync when you're back online.

## Design

- Background: near-black with deep maroon → crimson radial glow shapes.
- Cards: translucent frosted glass, thin light border, soft inner highlight, generous radius.
- Accent red for key numbers, CTAs and the progress ring; white/muted-white text.
- Bold condensed display headings (matching the logo's geometric feel) with a clean sans body.
- Mobile-first layout with a bottom glass tab bar (Home, Expenses, Lend/Borrow, Settings), scaling to a wider desktop layout.

## Technical outline

- Enable Lovable Cloud (Postgres + auth). Tables, all RLS-scoped to `auth.uid()` with grants:
  `profiles` (currency, display name), `categories` (name, color, is_default), `monthly_budgets` (month, amount, unique per user+month), `expenses` (amount, category_id, spent_on, note), `debts` (direction lend/borrow, person, amount, occurred_on, note, settled_at), `recurring_expenses` (label, amount, category_id, day_of_month, active) and `recurring_applied` (month log so items apply once).
- Trigger on signup creates the profile plus the five default categories.
- Data access via `createServerFn` with `requireSupabaseAuth`; reads through TanStack Query, month summary computed server-side.
- Routes: public `/` (landing + sign-in CTA), `/auth`, and `/_authenticated/dashboard`, `/expenses`, `/ledger`, `/settings`.
- Design tokens in `src/styles.css` (oklch), glass utilities via `@utility`, no hardcoded colors.
- PWA: manifest + icons derived from the logo, `vite-plugin-pwa` with `generateSW`, NetworkFirst navigation, registration guarded off in preview/dev.
- Logo uploaded as a CDN asset for in-app use; a square `public/favicon.png` for the icon.
- Per-route head metadata (title/description/og).
