# Cube: offline-first, new hero, fuller Activity log, dashboard teaser

## 1. Offline access (7-day window)

How it will behave:

- Cube becomes a real installable app that opens and works with no internet (published app only — the editor preview intentionally blocks service workers).
- After a successful online sign-in, the device keeps a 7-day offline pass. Every successful sync resets it to a fresh 7 days.
- Offline you can view everything last synced, and add or edit budgets, expenses, ledger entries, categories and notes. Changes queue on the device.
- The moment the connection returns, the queue drains automatically in the background — no sync button, no popup.
- If you stay offline past 7 days, Cube switches to read-only: your last synced data stays visible, but new entries and edits are blocked with a "Reconnect to continue" note until you're back online and signed in.
- Things that genuinely need the internet — receipt scanning, exchange-rate refresh, avatar upload, reminder setup — are disabled offline with a short "Needs internet" note.
- Nothing is ever presented as live: a "Last synced <time>" line sits with the status indicator.
- Conflicts: if the same record changed on the server after your offline edit, the server copy wins and the queued edit is dropped, with one quiet toast naming what didn't apply.
- Duplicates are prevented by giving every queued create its own id up front, so a retry can never insert the same row twice.

Status indicator (Settings, top row area next to Install Cube): Online / Syncing / Offline / Sync required, using existing theme colors.

## 2. Homepage copy

- Fix "When you circulates, it multiplies" → "When it circulates, it multiplies."
- New hero: eyebrow "Money loves water"; headline "You lent your friend 5,000 in March. Cube remembers."; subtext "So you don't have to bring it up twice. Set a budget, log expenses, and track everything you've lent and borrowed — all in one place."
- Headline scales down on small screens so the "Open Cube" button stays visible without scrolling.
- Feature list: "Strike" → "Bills" (also in the categories example copy).

## 3. Activity log gaps

Today only Settings actions (theme, currency, categories, rates) and the tour write to Activity — budget, expense, ledger and recurring actions write nothing. Logging moves into the shared data layer so every one of these creates an entry:

- budget set/edited
- expense added, edited, deleted
- ledger entry added, edited, deleted (lent / borrowed / received / sent)
- ledger entry settled or unsettled
- recurring expense added, and recurring applied at month start

Offline actions log locally and sync with the queue, so the feed stays complete and in one reverse-chronological order.

## 4. Dashboard

- Remove the "Nothing logged today" card.
- Add a "More to love" section under "Where it went", subtext "A peek at what's coming to Cube next."
- One teaser card inside: "COMING SOON" badge top-right, title "Bill Split", description "Split a group expense evenly and add everyone's share straight to your ledger — no manual math." Non-interactive, existing card fill/border/text tokens only, no new colors.

## 5. Tutorial

Replay tutorial and the first-run tour are re-checked against the changed dashboard: the removed reminder card isn't a step today, so the five dashboard steps (Available, Budget, the three pills, Add expense, Scan) still resolve. Steps are verified end to end after the changes and any step whose target moved is repointed.

## 6. What's new

One dated group of entries for today covering offline access, the new homepage hero, the fuller Activity log, and the Bill Split teaser — plain language, newest first.

## Technical notes

- Service worker via `vite-plugin-pwa` (`generateSW`, `injectRegister: null`, `devOptions.enabled: false`), keeping the existing guarded `src/lib/register-sw.ts` wrapper and the separate push worker at `public/push/sw.js` untouched. `NetworkFirst` for navigations, `CacheFirst` for hashed assets. Note: `register-sw.ts` currently points at a `/sw.js` that is never generated — the plugin now produces it.
- New `src/lib/offline/` module: an IndexedDB store (via `idb`) holding per-user snapshots of profile, categories, budgets, expenses, debts, recurring, fx rates and activity, plus a `queue` object store of pending mutations (op, table, payload, client-generated uuid, created_at) and a `session` record (userId, lastSyncAt, offlineUntil).
- `src/lib/api.ts` gains a thin offline wrapper: reads serve from Supabase when online (writing through to IndexedDB) and from IndexedDB when offline; writes go straight through when online, else append to the queue and optimistically patch the local snapshot so React Query shows them immediately.
- Sync runner listens to `online`/`offline`, visibility and a periodic check; drains the queue in insertion order, comparing each update's row `updated_at` against the queued base timestamp (server wins on conflict), then refreshes snapshots, sets `lastSyncAt`, and extends `offlineUntil` by 7 days.
- Read-only gate is a small context (`useOfflineStatus`) that dialogs/mutations consult to disable submit and show "Reconnect to continue".
- `logActivity` moves behind the same write path so entries queue offline; existing `activity_log` table and RLS are unchanged. No schema migration needed.
