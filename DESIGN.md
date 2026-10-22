# Handa PH — Design system

## World

Community bulletin board on cork: official notices pinned as paper cards. Warm, tactile, trustworthy in a barangay-hall sense — not a generic dark weather app.

## Color

- Cork ground: `#b8956a` → `#9a7a52`
- Paper: `#faf6ef`, ink: `#1c1410`
- Stamp / alert: `#8b1e1e`
- TCWS levels: unchanged semantic palette from `src/lib/tcws.ts`

## Type

- Display: Libre Baskerville (headings, storm names)
- UI: Karla (body, controls, nav)

## Components

- `PaperCard` — shadow, optional pushpin, slight tilt
- `SignalBadge` — large TCWS pin card
- Folder-style bottom nav with SVG icons
- `field-input`, `btn-primary`, `btn-ghost`, `stamp-box` utilities

## Motion

- Signal rise: single `signal-pulse` on TCWS increase; disabled under `prefers-reduced-motion`
