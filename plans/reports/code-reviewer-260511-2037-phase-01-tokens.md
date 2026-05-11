# Phase 1 Review — Design Tokens & Visual Identity

**Status:** DONE
**Scope:** `tailwind.config.js`, `src/styles.css`, `index.html`, `package.json`, `public/favicon.svg`, `public/find-number-logo.svg`, `src/ui/find-number-logo.tsx`, `docs/design-tokens.md`

## Acceptance criteria
- [x] Build passes (reported 5.28KB gzip CSS, +2KB delta ≤ +4KB budget)
- [x] Zero visual regressions — all existing classes intact (`bg-p1`, `bg-p2`, `bg-gray-950`, `bg-yellow-400` still resolve; verified 9 files using them)
- [x] Logo crisp at any size — pure SVG vector
- [x] `<FindNumberLogo />` not imported (grep confirms only self-file match → tree-shaken)
- [x] `docs/design-tokens.md` documents every new token

## Technical scrutiny
- **ESM Tailwind config:** valid — `package.json` has `"type":"module"`, `tailwind.config.js` uses `export default`, `postcss.config.js` already ESM. `tailwindcss-animate` ships CJS but Node interop handles `import animate from` correctly under Tailwind 3.4.
- **`@apply bg-surface-base` in `@layer base`:** resolves cleanly — `surface.base = '#030712'` registered before `@apply` evaluation.
- **`theme('fontFamily.display')`:** Tailwind v3 expands array→comma-joined string in `theme()` CSS function. Output correct.
- **`shadow-glow-yellow-md`:** key matches config (`'glow-yellow-md'`) — Tailwind generates `shadow-glow-yellow-md` utility correctly.
- **SVG XSS:** clean — no `<script>`, no `on*`, no `<foreignObject>`, no external refs in both `favicon.svg` and `find-number-logo.svg`.
- **Logo aria:** correct — `mark` variant has `role="img"` + `aria-label`; in `full` variant the inner SVG is `aria-hidden` and outer span carries the single `role="img"` + label (no duplicate announcement).
- **theme-color #030712:** matches `surface-base`; inline body bg also aligned — no FOUC mismatch.

## Minor suggestions (non-blocking)
1. **Duplicate SVG source:** `favicon.svg` and `find-number-logo.svg` are byte-identical apart from the gradient `id` (`fav-grad` vs `fn-grad`). Acceptable now; if both ever inline on same page the IDs already differ — good defensive design. No action.
2. **`fn-grad` id collision risk:** if `<FindNumberLogo>` ever renders twice on one page, duplicate `<linearGradient id="fn-grad">` IDs appear in DOM. Browsers tolerate it (first wins) but it's a latent issue. Consider `useId()` in phase 2+ when component is actually used.
3. **`backdrop-blur-xl` on `.fn-card`:** GPU cost on low-end Android. Acceptable for modals; monitor in phase 2.

## Concerns: none blocking.

## Unresolved questions
- None for phase 1. Phase 2 should validate logo gradient `id` uniqueness when component goes live.
