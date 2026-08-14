# Finish verification: offline round-trip, tour targets, lint cleanup

## What blocks the signed-in part

Authenticated end-to-end checks need a live session in the preview. Right now the browser tooling reports **signed out**, so I cannot log in as you or create a session myself. To run the offline sync round-trip and the tour walkthrough on real data, sign in once in the preview (any account) and tell me — the session then becomes available to me on the next message.

## What I can verify without a session

- Tour targets vs. the new dashboard: every step target (`available`, `budget`, `pills`, `add-expense`, `scan`, `category-filter`, `ledger-actions`, `history-toggle`, `reminder`, `categories`) exists in the current pages, including on the collapsed Settings accordion items, so the highlight ring still finds them after the dashboard changes. No step points at the removed "Nothing logged today" card. I'll confirm the ring geometry visually once signed in.
- Public route health: home and privacy render with no console errors, and the offline modules load without touching browser-only APIs during SSR.

## Signed-in checks I'll run once a session exists

1. Load Dashboard, walk all 10 tour steps, confirm each highlight lands on the right element and the final "You're all set" card writes the completion flag (no re-trigger on reload).
2. Confirm Replay tutorial in Settings restarts it independently of that flag.
3. Offline round-trip: go offline in the browser, add an expense, edit the budget, add a ledger entry, confirm they appear immediately and show as pending; go back online, confirm they sync once, with no duplicates, and Activity shows every action in reverse-chronological order.
4. Confirm the Settings sync indicator moves through Offline → Syncing → Online and updates "last synced".

## Lint cleanup

Run Prettier across the pre-existing files with formatting noise (older routes, components and libs) so the repo is clean. Formatting only — no behavioural edits, no logic touched.

## Technical notes

- Verification uses Playwright against `localhost:8080`; offline is simulated with the browser context's offline mode so the IndexedDB queue and the reconnect drain are exercised for real.
- Duplicate protection relies on client-generated row ids in the queue; the round-trip test checks row counts before and after the drain to prove it.
