# Make "Install Cube" always visible in Settings

The row is already coded and sits above Profile, but it hides itself whenever the device doesn't look like a phone — inside the Lovable preview (an iframe) that check can fail, so you never see it on either phone.

## Changes

- Remove the device-type gate. The row shows on every device: Android, iPhone, tablet and desktop.
- Keep only one hiding rule: if Cube is already running as an installed app (standalone), the row disappears.
- Tapping the row:
  - If the browser gave us its native install prompt (Android Chrome, desktop Chrome/Edge): open that prompt right away.
  - Otherwise (iPhone Safari, or no prompt available): open the short sheet with the manual steps — Share, then Add to Home Screen. The iPhone wording stays Safari-specific; other browsers get generic "use the browser menu" wording.
- Row copy and icon stay as they are.

## Manifest check

Confirm the installed app shows correctly: name "Cube", theme colour #0a0507, standalone display, and the new Cube icons at 192, 512 and maskable 512, plus the apple-touch icon for iPhone. Adjust anything missing.

## Technical notes

- `src/components/InstallCubeRow.tsx`: drop `isMobileDevice()` from the visibility condition, keep `isStandalone()`; also re-check standalone/prompt state on the install-state subscription so the row updates after an install.
- `src/lib/install.ts`: keep `isIos`, `isStandalone`, prompt capture; `isMobileDevice` is no longer used by the row.
- Install prompt capture already runs on app load in `src/routes/__root.tsx` — unchanged.
