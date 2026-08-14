# Cube — teaser cards, Eclipse theme, category colours & contact

## 1. "More to love" as a scrolling card row

Replace the single stacked teaser card on the Dashboard with a horizontally
scrollable row (swipe on phone, no scrollbar chrome). Two cards, each ~165 × 210px,
fixed size so they never stretch:

- Small "COMING SOON" pill badge, top-left
- Bold two-line title, no description text
- A simple line icon bleeding off the bottom-right corner (clipped by the card)
- Non-interactive: no tap target, no navigation

Card 1 — "Bill Split": deep maroon-to-black gradient, receipt icon.
Card 2 — "Savings goals": warmer amber-maroon gradient, coin-jar/piggy icon.

Both gradients are built from the theme's own tokens (primary, maroon, background),
so the cards re-tint automatically in Taurus, Butterfly and Eclipse instead of being
hardcoded crimson.

## 2. Sign-in page header

The sign-in page currently has no header at all — just the centred glass card, which
is why nothing stays pinned when the form is tall. It gets the same fixed top bar as
every in-app screen: glass-soft background, CUBE wordmark, pinned at the top while
the form scrolls beneath it. The card layout itself is unchanged, only offset below
the bar.

## 3. Editable category colours

On Settings → Categories, the colour dot next to each category becomes tappable and
opens a small picker: the existing 7 preset swatches plus a custom colour input for
any shade outside the presets. Choosing a colour saves immediately, updates the
"Where it went" chart colours, and writes an Activity entry ("Changed the colour of
the category …"). Adding a new category also gets a colour choice instead of only
cycling the palette.

## 4. Eclipse theme

A fourth theme built from the uploaded reference: black base with liquid bronze —
warm copper and cream highlights, ember-orange accents, no crimson. It appears in
Settings → Themes with its own swatch strip and description, saves to the account
like the others, and sets the matching PWA status-bar colour.

## 5. Contact us in Settings

A new collapsible "Contact us" section (mail icon) alongside the other Settings
sections, containing two rows:

- Email — cubeme.app@gmail.com, opens the device's mail app
- Instagram — @cubeme.app, opens instagram.com/cubeme.app in a new tab

Each row shows its own icon and the handle/address, styled like the existing rows.

## Technical notes

- Dashboard teaser: new `ComingSoonCards` block inside dashboard.tsx using a
  `flex overflow-x-auto no-scrollbar snap-x` rail; sizes via `w-[165px] h-[210px]`,
  icon absolutely positioned with `-bottom-4 -right-4 opacity-20`.
- Auth header: reuse the same markup/classes as `AppShell`'s `sticky top-0 z-30
  glass-soft` header so the two match exactly; the page keeps `ssr: false`.
- Categories: `api.updateCategory(id, { color })` already exists, so this is UI plus
  an activity log call; colour dot becomes a popover with swatches +
  `<input type="color">`.
- Eclipse: add `"eclipse"` to `ThemeName`/`THEMES`/`isThemeName` in `src/lib/theme.ts`
  and a `[data-theme="eclipse"]` OKLCH token block in `src/styles.css`, mirroring the
  existing Taurus/Butterfly blocks (including `--glow-a`/`--glow-b` for the moving
  background). No database change — `profiles.theme` is free text.
- Contact rows: plain `<a href="mailto:…">` and `<a href="https://instagram.com/…"
  target="_blank" rel="noreferrer">`; no backend involved.
- What's new gets an entry for this batch.

## Assumptions

The sign-in page gets a newly added fixed header (it had none). Category colours use
presets plus a free custom picker. The email row opens the default mail app rather
than forcing Gmail web. Tell me if you'd prefer any of these differently.
