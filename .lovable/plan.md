# Secure Offline Sync — signed-in round-trip verification

The offline layer is already built (`src/lib/offline/`: local snapshot store, mutation queue, background drain on reconnect/focus/interval, 7-day offline window, server-wins conflict rule, duplicate-key tolerance). What has never been checked is the real end-to-end behaviour on a signed-in account, because no test session was available in earlier runs. This plan is that verification run, plus fixes for anything it uncovers.

## What blocks it right now

The sandbox browser reports no active session, so protected routes redirect to sign-in and nothing can be exercised. The project has 12 auth accounts, so a session has to be minted for one specific account rather than auto-picked. That mint step asks for your approval and names the account it will sign in as — approve it and the run proceeds.

## The round trip I will run

1. Sign the preview browser into one non-owner test account and load the Dashboard.
2. Record the starting state: budget, expense count, ledger count, and the newest Activity entries.
3. Go offline (browser-level network cut, so the app sees a genuine offline state).
4. While offline, make a deliberately mixed set of edits:
   - add an expense with a category and note
   - edit the monthly budget
   - add a "Lent" ledger entry with a person and amount
   - delete one of the offline-created rows
5. Confirm while still offline: the edits show in the UI from local data, the Settings status row reads Offline, and the pending-change count matches the queued mutations.
6. Reconnect. Without touching any button, confirm the queue drains on its own, the status row moves Syncing then Online, and the pending count returns to zero.
7. Verify the server side directly: the rows landed once each (no duplicates), the deleted row is gone, and the budget holds the offline value.
8. Verify Activity: every one of those actions appears, in correct reverse-chronological order, with no missing or duplicated entries.
9. Re-run the drain once more to confirm a second pass pushes nothing (idempotent, no double-writes).
10. Confirm the 7-day offline window was refreshed by the successful sync.

## Fixes in scope if the run fails

Only what the run exposes, kept inside the existing offline layer and its callers:

- ordering bugs in Activity (queued entries landing with the wrong timestamp relative to their action)
- duplicate rows on retry, or a queue entry that wedges and blocks later ones
- status row reporting a state that doesn't match reality
- an offline edit that reads back correctly locally but never reaches the server

No schema changes, no new tables, no design or copy changes.

## Technical notes

- Verification drives the real app in a headless browser against the dev server, toggling network state at the browser level, not by faking a flag.
- Server-side confirmation uses read-only database queries on the test account's rows.
- Duplicate protection today relies on client-generated row ids plus tolerating duplicate-key errors during drain; step 9 is what proves that holds.
- `fx_rates` stays per-account editable as decided — the RLS review is closed and nothing in this plan touches policies.
