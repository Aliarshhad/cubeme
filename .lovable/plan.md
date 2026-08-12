# Fix: onboarding tour for new signups + notification error

## 1. Why the tour never appears

Two confirmed causes in `src/components/tour/TourProvider.tsx`:

- The auto-start is gated on a budget existing: `hasBudget` requires at least one monthly budget with an amount above 0. A brand-new account has no budget, so the tour is never triggered — it waits for a step that new users haven't done yet.
- The "already seen" check also reads a browser-wide localStorage flag (`cube-tour-done`) that is not tied to an account. Once any account on that device finished the tour, every later signup on the same browser is treated as "already seen".

The database side is fine: `profiles.tour_completed_at` defaults to NULL for every new user, so the per-account flag is correctly unset at creation.

### Fix

- Remove the budget precondition. Auto-start the tour the first time an authenticated user with `tour_completed_at = null` lands on the Dashboard, as soon as the profile has loaded.
- Make the local flag per-account (`cube-tour-done:<user id>`) so it only acts as a backup for the same account, never suppressing a different one. The account's `tour_completed_at` stays the source of truth.
- Keep the completion write as-is: finishing or skipping sets `tour_completed_at` (and the per-account local flag), so it never auto-triggers again for that account.
- No change to Settings → Replay tutorial: it calls `startTour()` directly and ignores the flag, so it keeps working every time.

### Verification

Sign up with a genuinely new email in a clean browser session, confirm the tour appears automatically on the Dashboard on first load, complete or skip it, sign out and sign back in, and confirm it does not reappear. Also confirm Replay tutorial still runs it on demand.

## 2. Notification error: "Subscribing for push requires an active service worker"

In `src/lib/push.ts` the notifications worker is registered at scope `/push/`, then the code awaits `navigator.serviceWorker.ready`. That promise resolves for the worker controlling the current page — a `/push/`-scoped worker never controls pages at the app root, so the code proceeds while the new worker is still installing and `pushManager.subscribe()` fails with the "active service worker" error.

### Fix

- After registering, wait for that specific registration to reach an `active` worker (watch `installing`/`waiting` state changes, with a timeout) instead of relying on `serviceWorker.ready`.
- Retry the subscribe once if the worker becomes active a moment later, and surface plain-language messages: blocked permission, dismissed permission, or "notifications aren't supported in this browser" — no raw technical text.
- Register on demand only when the reminder is switched on, unchanged, so it keeps working in preview, in a normal browser tab and in the installed app.

### Verification

Toggle the daily reminder on in Settings in the preview and confirm it saves without an error, that permission is requested, and that the subscription is stored; toggle it off and on again to confirm it is stable.

## Files touched

- `src/components/tour/TourProvider.tsx` — auto-start conditions, per-account flag
- `src/components/tour/steps.ts` — flag key helper
- `src/lib/push.ts` — active-worker wait, retry, friendlier errors
