# Cube — ledger fix, guided tour, Settings rebuild, activity log, real reminders

## 1. Fix Sent / Received (confirmed root cause)

The database rule on the ledger table still only allows `lend` and `borrow`, so any Sent or Received entry is rejected before it saves. Migration widens it to allow all four kinds. Sent lowers Available, Received raises it (the dashboard math already treats them that way).

## 2. 10-step guided tour

A coach-mark overlay that runs itself once, the first time you land on Home after setting your first budget.

- Dim the screen to ~78% black, dashed `#f2a3ac` border with a soft pulse around the target, tooltip card with the text, 10 step dots, and Next (last step reads "Done").
- Skip sits top-right on every step and ends the tour instantly from anywhere.
- The tour navigates for you: Home (steps 1-5) → Expenses (6) → Ledger (7) → History (8) → Settings (9-10), with the exact copy you supplied.
- Targets get stable markers: Available card, Budget line + pencil, the Spent/Lent/Borrowed pills, Add expense, Scan, category filter row, the four ledger buttons, Daily/Monthly toggle, Daily reminder row, Categories row.
- Finishing or skipping clears everything, returns to Home, and shows the closing note "You can replay this tour anytime from Settings → Replay tutorial" with one "Cube it" button.
- A saved flag (on your profile, so it follows your account) prevents it ever auto-running again. Settings → Replay tutorial is the only way to restart it, and it ignores the flag.

## 3 & 4. Settings rebuilt as collapsible sections

Order, top to bottom:

- **Profile** — chevron row opening the existing profile page (edit name, email, picture).
- **Subscription** — expands in place: "Cheers, you're on early access — free. Everything in Cube is free right now while we're building it out."
- **Themes** — expands in place (Founder / Taurus / Butterfly picker).
- **Daily reminder** — expands in place (toggle + time).
- **Default currency** — stays as the current dropdown.
- **Currency & rates** — chevron row opening its own page (moved out of Profile).
- **Categories** — chevron row opening its own page (add, rename, recolour, delete).
- **Privacy & data policy** — unchanged.
- **What's new** — new row, own page (see item 9).
- **Replay tutorial** — bottom row.

## 5. Recurring removed

Recurring UI, the dashboard "apply recurring" prompt, and its data hooks are removed. The underlying tables are left untouched so nothing is lost.

## 6. Lent dates

Each Lent row shows the date lent and, once you mark it returned, the return date is stamped automatically and shown ("Lent 3 Aug · Returned 11 Aug"). Un-marking clears it.

## 7. History → Activity tab

Third tab beside Daily and Monthly: a read-only, newest-first feed with date and time for every in-app action — sign in / sign out, budget changes, theme changes, expenses added/edited/deleted, ledger entries and settlements, category and currency edits, profile edits, reminder changes. Written server-side and readable only by you; no edit or delete anywhere in the app.

## 8. Reminders that arrive with the app closed

Real push notifications instead of the current in-page-only reminder:

- Your device registers for push when you enable the reminder; the subscription is stored on your account.
- A scheduled backend job runs every 15 minutes and pushes to anyone whose chosen time has arrived and who hasn't already been notified that day.
- Works with the app fully closed and while signed out on that device. Two honest limits: notifications only work on a device where you allowed them, and on iPhone the app must be added to the Home Screen first (Apple requirement). I'll show that hint in Settings.

## 9. What's new

Detail page listing entries newest-first: date + one plain sentence. Backed by a single editable array in one file so you can add a line per release. Seeded with a few factual entries for the changes in this round.

## Technical notes

- Migration: widen `debts_direction_check` to `lend|borrow|sent|received`; add `returned_on` to `debts`; add `tour_completed_at` to `profiles`; new `activity_log` table (append-only: insert + select for the owner, no update/delete policy) and `push_subscriptions` table, both with GRANTs and owner-scoped RLS.
- Tour: `src/components/tour/` — provider + overlay + step registry keyed by `data-tour` attributes; positioning via `getBoundingClientRect` with scroll-into-view; router `navigate` between steps.
- Activity: `logActivity()` helper called from mutation success paths plus `onAuthStateChange` for sign in/out.
- Push: edge-compatible web-push (VAPID via Web Crypto), keys stored as secrets; push/notificationclick handlers added to the existing service worker via `workbox.importScripts`; `pg_cron` + `pg_net` hitting a new `/api/public/hooks/daily-reminder` route guarded by a shared secret.
- Settings sections use the existing shadcn Accordion; new routes `_authenticated/settings/currency`, `settings/categories`, `settings/whats-new`.
