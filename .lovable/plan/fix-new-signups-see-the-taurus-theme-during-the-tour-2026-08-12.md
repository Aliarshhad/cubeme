# Fix: new signups see the Taurus theme during the tour

## What's actually happening

The tour does not touch the theme anywhere — confirmed by reading the tour code (`TourProvider.tsx`, `steps.ts`): it only navigates, measures elements and writes `tour_completed_at`. The theme flip has a different cause.

The saved theme in the database is correct: every recent account, including the newest signups, has `theme = 'founder'`.

The problem is the browser-side cache. `src/hooks/use-theme.ts` applies `readStoredTheme()` on mount, which reads a single device-wide localStorage key `cube-theme` that is never scoped to an account and never cleared on sign-out. So on a device where any earlier account picked Taurus, a brand-new signup renders in Taurus — exactly on the first Dashboard load, which is when the tour auto-starts, which makes it look like the tour caused it. It only corrects itself once the account's profile row has loaded and the reconcile effect runs, so on a slow or failed profile fetch it stays Taurus.

## Fix

- Scope the cached theme to the account: store it under `cube-theme:<user id>` instead of one shared key, so one account's choice can never paint another account's session.
- Treat the account's saved theme as the only source of truth. The cache is used purely to avoid a flash for the *same* account; when there is no cache for the signed-in account, render the default Founder theme instead of whatever the device last used.
- Clear the cached theme on sign-out so a stale value cannot leak into the next session on a shared device.
- Leave the tour completely untouched.

## Verification

Sign in on a device, switch to Taurus, sign out, sign up with a new email: the new account's first Dashboard load and the whole tour stay on Founder. Sign back into the Taurus account and confirm it still opens on Taurus with no flash, and that switching themes in Settings still saves.

## Files touched

- `src/lib/theme.ts` — per-account storage key, default-safe read, clear helper
- `src/hooks/use-theme.ts` — read/write the cache per account, profile as source of truth
- `src/components/AppShell.tsx` — clear the cached theme on sign-out
