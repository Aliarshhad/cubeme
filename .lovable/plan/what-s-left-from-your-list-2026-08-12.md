# What's left from your list

## 1. Tour markers, Activity tab, lent dates — DONE

Markers exist on Home, Expenses, Ledger and History; the Activity tab with paged loading is in History; lent rows show lent and returned dates.

## 2. New CUBE logo everywhere — NOT DONE

The header and pre-loader still point at the old mark, and `public/` still holds the old icons with no maskable or apple-touch icon at all.

- Regenerate favicon, 192, 512, maskable 512 and apple-touch icon from the white CUBE mark on the #0a0507 → #3a1015 gradient, with padding so rounded masks never clip it.
- Header mark and pre-loader image swapped to the new mark as-is (transparent), same sizes and same tumbling motion/glow.
- Aspect ratio preserved in all three spots.

## 3. Sent / Received not affecting Available — NOT DONE

The Ledger's "Net effect" figure already counts all four categories, but the Dashboard Available card only subtracts Spent and Lent and adds Borrowed.

- Available = budget − spent − lent − sent + borrowed + received, applied everywhere Available or budget totals are shown.
- Verified by adding one Sent and one Received entry and watching Available move both ways.

## 4. Notification error — NOT DONE

Turning the reminder on still tries to subscribe through the offline worker, which is switched off inside the preview, hence "requires an active service worker".

- A small notifications-only worker gets registered on demand when the reminder is switched on, so it works in preview, in the browser and in the installed app.
- If the browser refuses permission, the message says so plainly.

## 5. "Install Cube" in Settings — NOT DONE

No install row exists yet.

- New row at the very top, above Profile, phones only.
- Android: tapping opens the browser's own install prompt, captured when the app loads.
- iPhone: tapping opens a short sheet with the manual steps (Share → Add to Home Screen).
- Hidden when already running as an installed app, and on desktop.
- Manifest name, theme colour and the new icons set so the installed app shows "Cube" with the right icon.

## 6. What's new entries — PARTLY DONE

Entries for daily push reminders, the guided tour and the Settings rebuild are already listed. Missing: the "Install Cube" option line, added at the top in the same plain style.

## Technical notes

- Icons regenerated with ImageMagick into `public/` (favicon.png, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png); `manifest.webmanifest` and `__root.tsx` links updated; header/loader switch to a new `lovable-assets` pointer for the transparent mark.
- Available balance: `debtTotals` already returns `received`/`sent`; the dashboard formula in `src/routes/_authenticated/dashboard.tsx` needs them folded in.
- `public/push-sw.js` — dedicated push/notificationclick worker registered from `src/lib/push.ts`, separate scope from `/sw.js`; the app-shell worker guard stays untouched.
- `src/lib/install.ts` + an `InstallCubeRow` component: `beforeinstallprompt` captured in the root effect, `display-mode: standalone` / `navigator.standalone` detection, iOS check for the guide sheet.
- No database changes needed.
