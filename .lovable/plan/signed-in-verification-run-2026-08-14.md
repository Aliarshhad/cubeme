# Signed-in verification run

Two checks remain from the offline-first work. Both need your signed-in session, which is now available. No feature code changes are planned — only fixes if a check fails.

## 1. Offline round-trip

1. Load the dashboard signed in and confirm the sync indicator in Settings reads "Online".
2. Force the browser offline, then:
   - add one expense (with a category and a note),
   - add one ledger entry (lent, with an expected return date).
3. Confirm both appear immediately in the UI and land in the local queue, and that the status indicator switches to "Offline".
4. Restore connectivity and confirm:
   - the queue drains automatically with no button and no popup,
   - status passes through "Syncing" and settles on "Online",
   - both records exist server-side exactly once (no duplicates),
   - the 7-day offline window is refreshed.
5. Open History → Activity and confirm both actions appear in correct reverse-chronological order alongside a budget edit made in a deliberately mixed order.

## 2. Guided tour walkthrough

Replay the tutorial from Settings and step through all 10 steps, confirming each highlight lands on a real element on the current dashboard layout (Available, Budget, Where it went, More to love area, Expenses, Ledger, History, Settings rows including ones inside collapsed accordions), with no step pointing at the removed "Nothing logged today" card.

## Outcome

I report exactly what passed. If something fails, I fix that specific issue (target selector, queue de-duplication, or status labelling) and re-run the affected check.

## Technical notes

- Driven headlessly against `http://localhost:8080` with the injected session restored via cookies plus the Supabase storage key, so it exercises your real account data.
- Offline is simulated at the browser context level so the service worker and IndexedDB queue behave as they do on a real dropped connection.
- Test rows created during the run are deleted afterwards so your ledger and expense history stay clean.
