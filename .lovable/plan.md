# What's left on the Cube list

Item 1 is done: tour markers on Home/Expenses/Ledger/History, the Activity tab, and lent/returned dates are all in the app already.

Still outstanding — items 2 through 6:

## 2. Site metadata

Home page title and description become exactly:

- Title: "Cube — Calculate your budget every day"
- Description: "Set a monthly budget, log expenses by category, and track who you've lent to or borrowed from — all in one clean, distraction-free app."

Link-preview (og) title and description match. Sitewide defaults updated to the same wording.

## 3. New CUBE logo everywhere

- **Icons**: the white cube mark centred on the dark #0a0507 → #3a1015 gradient with generous padding so rounded-corner masks never clip it. Regenerates favicon, 192, 512, maskable 512 and apple-touch icon, replacing the current files.
- **Header**: the new mark as-is on the transparent header, same size as now.
- **Pre-loader**: same tumbling motion and glow, new image only.
- Aspect ratio preserved in all three spots.

## 4. Fix the notification error

Reminders fail because the offline worker is intentionally disabled inside the Lovable preview, so there is no active worker to subscribe with. A small notifications-only worker gets registered on demand when you switch the reminder on, so it works in preview, in the browser and in the installed app. If the browser refuses permission, the message says so plainly instead of the current technical error.

## 5. "Install Cube" in Settings

New row at the very top, above Profile, phones only.

- Android: tapping opens the browser's own install prompt straight away (captured when the app loads).
- iPhone: tapping opens a short sheet with the manual steps — tap Share, then "Add to Home Screen".
- Hidden entirely when Cube is already running as an installed app, and on desktop.
- Manifest name, theme colour and the new icons set so the installed app shows "Cube" with the right icon on both platforms.

## 6. What's new entries

Added at the top, newest first, in the existing plain style: Install Cube option; Settings rebuilt with dedicated Currency & rates and Categories pages; daily push reminders; guided tour for new users.

## Technical notes

- `public/push-sw.js` — dedicated push/notificationclick worker registered from `src/lib/push.ts` (no PROD/preview guard, separate scope from `/sw.js`); the app-shell worker guard stays untouched.
- Icons regenerated from the uploaded PNG with ImageMagick into `public/` (favicon.png, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png); `manifest.webmanifest` and the `__root.tsx` links updated. Header/loader use a new `lovable-assets` pointer for the transparent mark.
- `src/lib/install.ts` + an `InstallCubeRow` component: `beforeinstallprompt` captured in the root effect, `display-mode: standalone` / `navigator.standalone` detection, iOS UA check for the guide sheet (shadcn Dialog).
- No database changes needed.
