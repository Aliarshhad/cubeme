# Cube — finish the tour, new logo, install prompt, push fix

## 1. Finish the guided tour and history work

- Add the tour markers the overlay looks for: Available card, Budget line, the Spent/Lent/Borrowed pills, Add expense, Scan (Home), the category filter row (Expenses), the four ledger buttons (Ledger), the Daily/Monthly toggle (History). Settings markers already exist.
- Last tour step copy drops the mention of recurring bills, since recurring was removed.
- **Activity tab** in History, third beside Daily and Monthly: read-only feed, newest first, with date and time for every logged action. All entries, loaded in pages as you scroll.
- **Lent dates**: each row shows the date lent and, once marked returned, the return date too ("Lent 3 Aug · Returned 11 Aug"). Un-marking clears it.

## 2. Site metadata

Home page title and description become exactly:

- Title: "Cube — Calculate your budget every day"
- Description: "Set a monthly budget, log expenses by category, and track who you've lent to or borrowed from — all in one clean, distraction-free app."

Link-preview (og) title and description match.

## 3. New CUBE logo everywhere

- **Icons**: the white cube word mark centred on the dark #0a0507 → #3a1015 gradient, with generous padding so rounded-corner masks never clip it. Generates favicon, 192, 512, maskable 512 and apple-touch icon, all replacing the current files.
- **Header**: the new mark as-is on the transparent header, same size as now.
- **Pre-loader**: same tumbling motion and glow, new image only.
- Aspect ratio preserved in all three spots.

## 4. Fix the notification error

Reminders currently fail because the offline worker is intentionally disabled inside the Lovable preview. A small notifications-only worker gets registered on demand when you turn the reminder on, so it works in preview, in the browser and in the installed app. If the browser refuses permission, the message says so plainly instead of the current technical error.

## 5. "Install Cube" in Settings

New row at the very top, above Profile, phones only.

- Android: taps open the browser's own install prompt straight away (captured when the app loads).
- iPhone: taps open a short sheet with the manual steps — tap Share, then "Add to Home Screen" — since Apple gives no install prompt.
- Hidden entirely when Cube is already running as an installed app, and on desktop.
- Manifest name, theme colour and the new icons are set so the installed app shows "Cube" and the right icon on both platforms.

## 6. What's new entries

Added at the top, newest first, in the existing plain style: Install Cube option; Settings rebuilt with its own Currency & rates and Categories pages; daily push reminders; guided tour for new users.

## Technical notes

- `public/push-sw.js` — dedicated push/notificationclick worker registered from `src/lib/push.ts` (no PROD/preview guard, separate scope from `/sw.js`); the app-shell worker guard is untouched.
- Icons regenerated from the uploaded PNG with ImageMagick into `public/` (favicon.png, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png); `manifest.webmanifest` and `__root.tsx` links updated. Header/loader use a new `lovable-assets` pointer for the transparent mark.
- `src/lib/install.ts` + `InstallCubeRow` component: `beforeinstallprompt` captured in the root effect, `display-mode: standalone` / `navigator.standalone` detection, iOS UA check for the guide sheet (shadcn Dialog).
- Activity tab uses `fetchActivity` from `src/lib/activity.ts` with `useInfiniteQuery`.
- No database changes needed — `activity_log` and `debts.returned_on` already exist.
