# Cube — pricing clarity, sharper copy, two new themes, tumbling pre-loader

## 1. Free / early-access signalling
- **Landing page**: a small glass pill badge directly above the "Open Cube" button reading "Free during early access", plus a line under the tagline (above the CTA): "Cube is free while we build it. No card, no trial clock, no catch."
- **Settings → Your plan**: a new card at the top of Settings — heading "You're on early access — free", body: "Everything in Cube is free right now while we're building it out. If we ever introduce paid features down the line, what you're using today stays free for you." No badge elsewhere in the app.

## 2. Feature copy rewrites (landing)
- **Lend & borrow** → "Stop keeping loans in your head, your notes app, or a WhatsApp chat you'll never scroll back to. Log what you lent and what you borrowed, and settle without the awkward "hey, remember that 3,000…""
- **Monthly budget** → "Set what you've got for the month and watch what's actually left, day by day — not just what your bank balance says, since half of that is already owed to someone."

Cards get slightly taller to fit the longer copy; the other two cards stay as they are.

## 3. Taurus theme recoloured
Replaced with the deep olive/forest green of the attached picture: near-black green-black background, olive-green glass surfaces, muted moss mid-tones, and a slightly brighter olive for buttons and focus rings — no neon lime anywhere. Same iOS liquid-glass material, colours only; no striped texture. The drifting ambient glow uses olive/forest tones.

## 4. New Butterfly theme
Third theme from the attached blue picture: deep navy-black background, midnight-blue glass, and an electric cyan-blue primary with a bright azure glow. Same glass system and drifting glow, colours only. Selectable in Settings alongside Founder and Taurus, saved to your profile, with the PWA status-bar colour following it.

Settings theme picker becomes a three-option grid with colour swatches for each.

## 5. Full-screen pre-loader
Shown while auth is being checked and initial data is loading, and again briefly whenever a page's data isn't ready yet. Driven entirely by real loading state — it disappears the moment things are ready, with a 250ms fade-out, and never lingers.

- Centre: the Cube logo at ~124px wide with a subtle drop shadow.
- Logo tumbles in real 3D: CSS `perspective` + `transform-style: preserve-3d`, `rotateY` 0→360° with an `rotateX` wobble of +8° at 25%, −8° at 75%, 0° at 0/50/100%. 2.4s loop, linear, infinite.
- A soft themed glow behind it pulses independently: scale 0.9→1.05, opacity 0.6→1, 2.2s ease-in-out loop.
- Below: "Loading Cube" in muted white (~55% opacity) with three dots blinking in sequence, staggered 0.2s.
- Respects reduced-motion (gentle fade instead of tumble).

## Technical notes
- `src/styles.css`: rewrite the `[data-theme="taurus"]` token block, add `[data-theme="butterfly"]`, and add the tumble / glow-pulse / dot-blink keyframes.
- `src/lib/theme.ts`: `ThemeName` gains `butterfly`, `THEMES` gains its entry and swatches, `isThemeName` updated. Profile `theme` column already stores free text, so no migration needed.
- New `src/components/CubeLoader.tsx` (full-screen overlay) mounted in `src/routes/_authenticated/route.tsx` for the auth/initial-data gate and reused inside route-level pending states via the router's `defaultPendingComponent`.
- Landing copy and badge in `src/routes/index.tsx`; plan card added to `src/routes/_authenticated/settings.tsx`.
