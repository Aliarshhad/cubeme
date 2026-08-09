# Cube — iOS glass refresh, themes, receipts, reminders, privacy

## 1. Typography — San Francisco
Switch display and body fonts to the native Apple system stack (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, then Helvetica Neue/Arial). Real SF on iPhone/Mac, clean system font elsewhere. The handwritten marker font is removed — "MONEY LOVES WATER" now renders in San Francisco (heavy weight, tight tracking, subtle glow).

## 2. iOS liquid-glass theme system
Rebuild the glass layer to feel like iOS 26 controls: thinner borders, brighter specular top edge, stronger blur with saturation lift, softer large-radius corners, and layered translucency (a "thick" card glass and a "thin" chrome glass for header/tab bar).

Two named themes, switchable in Settings:
- **Founder** (default, current identity): near-black with deep maroon/crimson glow.
- **Taurus** (new): Neon Lime Noir — near-black `#0A1002` surfaces, `#172800`/`#315F00` mid tones, `#65A800` primary and `#9CFF00` neon accent, soft 3D/neumorphic depth with strong green glow.

Implementation: theme is a `data-theme` attribute on `<html>` driving a second token block in `src/styles.css`; every component keeps using semantic tokens so nothing needs recolouring. Choice is saved per user (new `theme` column on the profile) plus mirrored to local storage so it applies instantly on load with no flash. The PWA `theme-color` meta updates with the active theme.

## 3. Animated maroon background motion
Replace the static glow field with a slow, GPU-cheap animated field: two or three large blurred radial blobs drifting and breathing on a 20–40s loop behind all content, tinted from the active theme (maroon for Founder, lime for Taurus). Respects `prefers-reduced-motion` by falling back to the static gradient.

## 4. Dashboard number overflow + remove percentage
- Remove the "% used" ring/percentage block entirely.
- Rebuild the hero card so large amounts can never escape the glass: available amount uses a fluid clamp-based type size that steps down automatically as the digit count grows, with `min-w-0`, wrapping/`tabular-nums`, and a compact form (e.g. `1.24M`) with the full value shown on tap for very large numbers.
- Spent / Lent / Borrowed stat tiles get the same fluid-shrink treatment instead of truncating with an ellipsis.
- Spending by category keeps its bars, which now carry the removed progress signal.

## 5. Landing copy
- Subheading → "Money needs to move and flow to grow rather than stay still. When you circulates, it multiplies."
- Fourth feature card: "RECURRING / Rent and bills roll into each new month with one tap." → "CLOUD SYNCED / Your data is securely saved and available on any device." (icon changes to a cloud).

Note: the recurring feature itself stays in the app — only the landing card changes.

## 6. Receipt scanning — wire it up
The scanner and AI parsing already exist but are not reachable from any screen. This connects them:
- A "Scan receipt" action on the Expenses page and dashboard opens the scanner: **Take photo** (built-in camera via capture input) or **Choose from gallery**.
- The image is uploaded to private storage, parsed by AI into merchant, date, total, currency and a suggested category — all editable before saving.
- Saving creates the expense linked to the receipt.
- "More details" expands the itemised list — item name, quantity, unit price, line total — each field editable, with add/remove row and a running total check against the receipt total.
- Existing expenses with a receipt show a receipt badge that opens the same detail view and the stored photo.

## 7. Daily budgeting reminder
New Reminders section in Settings: toggle on, pick a time (default 9:00 PM).
- Requests notification permission and schedules a daily local notification through the service worker while the app is installed/open.
- Always-reliable fallback: if you haven't logged anything today, the dashboard shows a gentle nudge card with a "log today's spending" action and a daily streak count.

## 8. Privacy & data policy page
New public route `/privacy`, linked from the landing footer, Settings and the auth screen, written as your own statements:
- **What we collect** — account info (email, name, profile picture); financial entries you type (budget amounts, categories, notes, lend/borrow amounts and the names you attach); receipt photos when you use the scanner; basic device/usage data needed to run the app. No bank connections, no card numbers, no contact-list access.
- **How each type is used** — budget/expense data powers your dashboard and history; receipt photos are processed to extract line items and then kept in your private storage so you can review them later, and you can delete any photo at any time; lending contact names exist only to label your own ledger and are never shared with that person or anyone else; device data is used only for reliability.
- **Retention & deletion** — deleted entries are removed immediately; account deletion can be requested in-app and removes your data, including receipt photos, within 30 days; nothing is sold or used for advertising.
- **Security** — passwords are hashed and never stored in readable form, all traffic is encrypted in transit over HTTPS, data is stored in a managed Postgres database with per-user access rules so only your signed-in account can read your rows, and receipt photos live in a private bucket reachable only through short-lived signed links.
- **Your rights** — access, correct, export and delete your data; contact route for requests.

A contact email placeholder is included for you to fill in; no certification or compliance claims (GDPR, SOC 2, etc.) are made since those aren't confirmed.

## Technical notes
- `src/styles.css`: system font stack, rebuilt `glass`/`glass-soft` utilities, `[data-theme="taurus"]` token block, animated `glow-field` with reduced-motion fallback.
- Small `ThemeProvider`-style hook + `src/components/ThemeToggle.tsx`; profile gets a `theme` text column via migration.
- Dashboard hero refactored into a fluid `AmountDisplay` component reused by stat tiles and history.
- `ReceiptScanner` and `ReceiptDetails` mounted from `expenses.tsx` and `ExpenseDialog`; item rows become editable with a save mutation.
- Reminder scheduling lives in a client hook using the existing service worker registration; time and toggle stored locally.
- New `src/routes/privacy.tsx` with its own head metadata.
