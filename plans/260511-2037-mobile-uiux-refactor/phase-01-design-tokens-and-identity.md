---
phase: 1
title: "Design tokens & visual identity foundation"
status: completed
effort: 3h
depends_on: []
owner: unassigned
---

# Phase 1 — Design Tokens & Visual Identity Foundation

## Context Links
- Plan overview: [plan.md](./plan.md)
- Current Tailwind config: `apps/web/tailwind.config.js`
- Current global styles: `apps/web/src/styles.css`
- Current package manifest: `apps/web/package.json`

## Overview
- **Priority:** P1 (foundation — all other phases consume tokens declared here)
- **Status:** completed
- **Description:** Build the design system layer that every later phase consumes: Tailwind extends (colors, shadows, keyframes, animations, font stack), `src/styles.css` custom utility/component layer, custom SVG logo mark for "Find Number", and a one-page design-token reference doc.

## Key Insights
- Codebase is barebones: `styles.css` contains only `@tailwind` directives; config only adds `p1`/`p2` colors. No keyframes, no font import, no logo asset.
- Tailwind 3.4.17 is in `devDependencies` (good — modern features available: `bg-gradient-to-*`, `tabular-nums` already used).
- `canvas-confetti` already integrated and lazy-loaded — keep behavior unchanged.
- React 18 + Vite 5 + PWA plugin in place — no SSR concerns; CSS-in-static is safe.
- All existing UI already converges on neon-yellow + p1-red + p2-blue trio; the identity layer extends rather than replaces it.

## Requirements
**Functional**
- Add color tokens: `neon.yellow / red / blue / green / purple`, `surface.{base,raised,elev}` for premium-dark layering
- Add shadow tokens: `glow-yellow / glow-red / glow-blue` (3 levels: sm/md/lg)
- Add keyframes/animations: `tile-pop`, `tile-claim-p1`, `tile-claim-p2`, `target-reveal`, `score-bump`, `fade-in-up`, `pulse-glow`, `stagger-in`
- Add font stack: system-stack + display font fallback (Inter or system sans — no remote font fetch to keep bundle/perf clean)
- Add `tailwindcss-animate` plugin
- Create `find-number-logo.svg` (inline-renderable, ≤ 2 KB) — vector mark representing "two players racing to find a number"
- Create reusable component classes via `@layer components` in `styles.css`: `.fn-card`, `.fn-modal-backdrop`, `.fn-modal-panel`, `.fn-btn-primary`, `.fn-btn-ghost`, `.fn-tile`, `.fn-glow-text-{yellow,red,blue}`
- Disable iOS tap highlight + improve `font-feature-settings: 'tnum'` globally

**Non-functional**
- Bundle delta ≤ +4 KB gzip (animate plugin ~1 KB + new utilities tree-shaken)
- Zero runtime cost: pure CSS / Tailwind compile-time
- No new fetch / network requests
- Component classes are additive — existing class names continue to work

## Architecture
```
tailwind.config.js  ──extends──▶  colors, boxShadow, keyframes, animation, fontFamily
        │                                      ▲
        ▼                                      │
src/styles.css  ──@layer components──▶  .fn-* utility classes
        │
        ▼
src/ui/find-number-logo.tsx  ──inline SVG──▶  consumed by landing + lobby + result
        │
        ▼
docs/design-tokens.md  ──reference──▶  later phases
```

Data flow: tokens are compile-time only. No runtime data; no store changes. Logo is a React component returning inline `<svg>` for tree-shake and color-prop control.

## Related Code Files
**Modify**
- `apps/web/tailwind.config.js` — extend theme; add plugin
- `apps/web/src/styles.css` — add `@layer base` reset + `@layer components` `.fn-*` classes
- `apps/web/package.json` — add `tailwindcss-animate` to devDependencies
- `apps/web/index.html` — add `theme-color` meta + favicon link (favicon generated from logo)

**Create**
- `apps/web/src/ui/find-number-logo.tsx` — `<FindNumberLogo size={n} variant="full"|"mark"/>` (≤ 60 LOC)
- `apps/web/public/find-number-logo.svg` — static file (favicon source)
- `apps/web/public/favicon.svg` — derived
- `docs/design-tokens.md` — one-page reference (color palette, shadow scale, keyframe list, usage examples)

**Delete** — none

## Implementation Steps
1. `pnpm --filter @find-number/web add -D tailwindcss-animate`
2. Edit `tailwind.config.js`:
   - Add `fontFamily.display` (system stack with `-apple-system, BlinkMacSystemFont, ...`)
   - Add `colors.neon.{yellow,red,blue,green,purple}` (alias existing tw colors for semantic intent)
   - Add `colors.surface.{base:'#0a0a0f', raised:'#13131a', elev:'#1c1c26'}`
   - Add `boxShadow.glow-{yellow,red,blue}-{sm,md,lg}`
   - Add `keyframes`: `tile-pop`, `tile-claim`, `target-reveal`, `score-bump`, `fade-in-up`, `pulse-glow`, `stagger-in`
   - Add `animation` aliases for each keyframe with durations / easings
   - Register plugin: `require('tailwindcss-animate')`
3. Edit `src/styles.css`:
   - `@layer base`: `html { -webkit-tap-highlight-color: transparent; font-feature-settings: 'tnum'; }` + `body { @apply bg-surface-base text-gray-100; }`
   - `@layer components`: `.fn-card`, `.fn-modal-backdrop`, `.fn-modal-panel`, `.fn-btn-primary`, `.fn-btn-ghost`, `.fn-tile`, `.fn-glow-text-yellow`
4. Author SVG logo mark in Figma/Inkscape OR hand-write SVG: two overlapping number-bubble silhouettes with neon stroke, "FN" monogram inside. Export to `public/find-number-logo.svg`.
5. Create `find-number-logo.tsx` React component that returns the inline SVG with prop-driven `size`, `variant` (`'mark' | 'full'` — `'full'` adds wordmark "FIND NUMBER" beside mark), and `glow` prop.
6. Add `favicon.svg` (mark variant @ 64×64), update `index.html` `<link rel="icon">` + `<meta name="theme-color" content="#0a0a0f">`.
7. Write `docs/design-tokens.md`: paint chips, code snippets for each `.fn-*` class, do/don't.
8. Run `pnpm --filter @find-number/web build` → verify no errors, capture bundle delta.

## Todo List
- [x] Install `tailwindcss-animate` dev dependency
- [x] Extend `tailwind.config.js` with colors / shadows / keyframes / animations / font family / plugin
- [x] Rewrite `src/styles.css` with base reset + component layer
- [x] Author `public/find-number-logo.svg` (≤ 2 KB)
- [x] Create `<FindNumberLogo />` React component
- [x] Generate `favicon.svg`; update `index.html` head
- [x] Write `docs/design-tokens.md` reference
- [x] Run build; verify zero errors and bundle delta ≤ +4 KB gzip
- [x] Smoke test existing pages render unchanged (regression check)

## Success Criteria
- `pnpm --filter @find-number/web build` succeeds
- Bundle delta ≤ +4 KB gzip versus `main` baseline
- All existing screens visually unchanged (zero regressions — only additive tokens shipped here)
- `<FindNumberLogo />` renders crisply at 24 px and 96 px
- `docs/design-tokens.md` exists and lists every new token
- Favicon visible in browser tab

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| New plugin clashes with existing classes | Low | Low | `tailwindcss-animate` is additive; classes are namespaced (`animate-in`, `slide-in-from-*`) |
| Custom keyframe names collide with Tailwind defaults | Low | Med | Prefix custom keyframes with `fn-` if collision detected during build |
| SVG logo too big | Low | Low | Hand-optimize, run through SVGO; budget ≤ 2 KB |
| Bundle blows past +4 KB | Med | Low | Tailwind purge already on; only used classes shipped. Measure with `vite build` size report |
| Existing dark `bg-gray-950` and new `bg-surface-base` look different | Med | Low | Set `surface.base = #0a0a0f` (Tailwind `gray-950` = `#030712`) — accept the warmer tone OR alias `surface.base = colors.gray[950]` if regression rejected in review |

## Security Considerations
- No user input touched in this phase
- SVG is static, no embedded scripts — sanitize before adding (no `<script>`, no `on*` attrs, no `<foreignObject>`)
- No external font fetch → no CSP / privacy concerns

## Next Steps
- Unblocks phases 2, 3, 4, 5 — they may proceed in parallel after this merges
- Consider future phase: dark-mode-aware accents if light mode added (out of scope now)

## Unresolved questions
- Confirm whether to alias `surface.base` to existing `gray-950` (zero visual change) or use the warmer custom value (slight identity shift). Default: alias — preserve current vibe.
