---
phase: 2
title: "In-game grid & HUD — tap targets, memoization, motion"
status: pending
effort: 3h
depends_on: [1]
owner: unassigned
---

# Phase 2 — In-Game Grid & HUD

## Context Links
- Plan overview: [plan.md](./plan.md)
- Phase 1 (foundation): [phase-01-design-tokens-and-identity.md](./phase-01-design-tokens-and-identity.md)
- Files: `apps/web/src/ui/number-grid.tsx`, `apps/web/src/ui/hud.tsx`, `apps/web/src/routes/room.tsx`, `apps/web/src/routes/practice.tsx`

## Overview
- **Priority:** P1 (highest user-facing impact — the core game loop)
- **Status:** pending
- **Description:** Make tiles actually tappable on small phones (≥ 44 × 44 px), memoize them so 100 tiles do not all re-render on every click, slim the HUD so it stops eating grid real-estate on iPhone SE, and add the first motion layer — tap feedback, target reveal, score increment.

## Key Insights
- Current tile on 360 px viewport: ~`(360-16) / 10 - 4` ≈ 30 px. Below tap-target minimum.
- Grid uses `gap-1 sm:gap-1.5` (4 px / 6 px) → reducing gap to 2 px on mobile reclaims width.
- `Tile` is **not** memoized → `useGameStore` selector on `found` triggers full 100-tile re-render every click; React reconciles all 100 elements.
- HUD is `~90 px tall` due to `pb-6` + stacked `Find` row + `N left` row + score badges. On 568 px-tall iPhone SE, that's 16% of viewport.
- HUD uses absolute positioning over grid; `NumberGrid` already pads `paddingTop: calc(... + 5rem)` to compensate. Reducing HUD height must update that pad too.
- Target number reveal currently has zero animation — the `target` value in store changes instantly. Adding `key={target}` on the target span triggers React remount → CSS keyframe runs each round.
- Score increment: zero feedback today. Add `key={score}` + `animate-score-bump` on the score number.
- `active:scale-95` is the only tap feedback. We'll layer a `tile-pop` keyframe and a color claim-flash when tile is claimed (owner transitions from undefined → 'p1'|'p2').

## Requirements
**Functional**
- Tile tap area ≥ 44 × 44 px on 360 px viewport (`(360 - 18) / 10 = 34.2 px` visual + invisible padding wrapper to expand hit-zone if needed)
- Tile component wrapped in `React.memo` with stable owner/disabled/onClick refs
- HUD ≤ 72 px tall on mobile (currently ~90 px) — compact layout
- Target number plays `target-reveal` animation when changes (slide-up + glow burst)
- Score number plays `score-bump` when increments
- Tap on tile plays `tile-pop` (scale 1 → 1.08 → 1, 180 ms)
- Tile claim (owner set) plays `tile-claim-{p1|p2}` (color saturation flash + ring pulse, 320 ms)
- `room.tsx` and `practice.tsx` background gets subtle radial neon-tint backdrop (premium-dark layer)

**Non-functional**
- Bundle delta ≤ +2 KB gzip
- Zero unowned-tile re-renders per click (verified by React DevTools profiler)
- 60 fps tap feedback on mid-tier Android (Pixel 4a baseline) — confirmed via DevTools perf trace
- Animations respect `prefers-reduced-motion` → fall back to `opacity` only

## Architecture
```
game-store (unchanged)
   │ subscribes via fine-grained selectors
   ▼
NumberGrid (parent)
   │ useGameStore((s) => s.foundBy[n]) — per-tile selector via useStableHandler
   ▼
Tile (memo)
   │ props: number, owner, disabled, onClick
   ▼
   ├─ on click: animate-tile-pop
   └─ on owner change: animate-tile-claim-p1|p2
```

Selector strategy: keep current `foundToMap(found)` memo in `room.tsx` — it produces a stable map. Add per-tile selector: `Tile` reads its own `owner` via `useGameStore((s) => s.foundBy[n])` if we lift `foundBy` into the store; OR keep the prop-drilled approach and memo. Decision: **stick with prop-drilled + `React.memo`** — store shape is locked per constraints; the `foundBy` map identity changes once per click (acceptable — only one tile's owner prop actually differs), and React.memo's shallow equality on `owner|disabled` skips the 99 unchanged tiles. KISS over store surgery.

HUD restructure: one row, three columns: `[P1 score-badge] [center: small "FIND" label + big target + tiny "N left"] [P2 score-badge]`. Reduce padding-bottom from `pb-6` to `pb-2`. Drop the secondary `mt-0.5` line; merge "N left" into a 10 px subscript under the target. Update grid `paddingTop` from `calc(... + 5rem)` to `calc(... + 4.5rem)`.

## Related Code Files
**Modify**
- `apps/web/src/ui/number-grid.tsx` — memoize Tile, expand hit-zone, animation classes, gap tightening, use `.fn-tile` base class
- `apps/web/src/ui/hud.tsx` — compact layout, target reveal anim via `key={target}`, score-bump via `key={score}`
- `apps/web/src/routes/room.tsx` — add background ambient gradient layer (`pointer-events-none absolute inset-0 -z-10`)
- `apps/web/src/routes/practice.tsx` — same background layer pattern (extract into shared helper if both consume it)

**Create**
- `apps/web/src/ui/game-backdrop.tsx` — shared subtle radial-gradient backdrop component (DRY for room + practice). ≤ 30 LOC.

**Delete** — none

## Implementation Steps
1. In `number-grid.tsx`:
   - Extract `Tile` to `const Tile = React.memo(function Tile(...) {...})`. Define `arePropsEqual` if `onClick` identity churn observed (use `useCallback` upstream in `Room`/`Practice` if necessary).
   - Replace `gap-1 sm:gap-1.5` with `gap-[2px] sm:gap-1.5` (or `gap-0.5`)
   - Replace tile className with `.fn-tile` base + owner-state modifiers
   - Add `data-owner={owner ?? 'none'}` attr for CSS-driven claim animation, OR conditional `animate-tile-claim-p1` class on owner transition using a `usePrevious` hook in tile
   - Add invisible inner span if tile rendered visual < 40 px — use `min-h-[44px] min-w-[44px]` on wrapper while keeping `aspect-square` visual cell via inner div (only if measurement confirms shortfall)
2. In `hud.tsx`:
   - Restructure center cluster: drop the `mt-0.5` row; render "N left" as `text-[9px]` below target
   - Reduce wrapper padding: `pb-6` → `pb-2`
   - Add `key={target}` on target `<span>` and class `animate-target-reveal`
   - Add `key={score}` on score number `<div>` and class `animate-score-bump`
   - Audit final height on iPhone SE viewport via Chrome DevTools device toolbar
3. Update grid `paddingTop` in `number-grid.tsx` to match new HUD height (`+ 4.5rem` instead of `+ 5rem`)
4. Create `game-backdrop.tsx` — radial gradients at top-left red, bottom-right blue, faint yellow center, all `opacity-20`, `blur-3xl`. Position `pointer-events-none absolute inset-0 -z-10`.
5. Mount `<GameBackdrop />` in `room.tsx` and `practice.tsx` inside the root `<div>`.
6. Wrap `onClickNumber` in `useCallback` in `room.tsx` and `practice.tsx` (callsite passes a fresh arrow today — break memo).
7. Add `@media (prefers-reduced-motion: reduce)` rules in `styles.css` (phase 1 may have added base; phase 2 verifies/extends).
8. Run build + profile with React DevTools.

## Todo List
- [ ] Memoize `Tile` with `React.memo`
- [ ] Stabilize `onClickNumber` with `useCallback` in `Room` + `Practice`
- [ ] Tighten grid gap to 2 px on mobile
- [ ] Ensure ≥ 44 × 44 px tap area on 360 px viewport
- [ ] Apply `animate-tile-pop` on press
- [ ] Apply `animate-tile-claim-{p1|p2}` on owner transition
- [ ] Slim HUD ≤ 72 px (verify on iPhone SE 320×568)
- [ ] Target reveal animation via `key={target}`
- [ ] Score-bump animation via `key={score}`
- [ ] Create `game-backdrop.tsx` and mount in both Room and Practice
- [ ] Reduce-motion fallback in `styles.css`
- [ ] React DevTools profile: only owner-changed tile re-renders per click
- [ ] Build + bundle delta ≤ +2 KB gzip

## Visual Changes
- Tiles look chunkier and feel tactile — pop on tap, color-flash on claim
- HUD becomes a single tight row; target number is the visual anchor with a soft glow burst each round
- Score badges pulse subtly on increment
- Subtle radial neon backdrop replaces flat gray-950 — adds depth without competing with grid
- Reduced-motion users get instant transitions with no shake/scale

## Success Criteria
- React DevTools profiler: clicking tile #42 re-renders only Tile #42 (not the other 99)
- HUD height ≤ 72 px measured via DevTools
- Tap area ≥ 44 × 44 px measured via DevTools box model on a 360-px-wide viewport
- All animations under 320 ms
- Bundle delta ≤ +2 KB gzip
- Game plays end-to-end in practice mode without regression
- `prefers-reduced-motion: reduce` disables `tile-pop`/`tile-claim`/`target-reveal`/`score-bump`

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `React.memo` doesn't help because `onClick` identity changes | High | Med | Wrap `onClickNumber` with `useCallback`; pass stable click handler that captures `n` via closure inside Tile using event delegation if still churning |
| `key={target}` causes unwanted remounts elsewhere | Low | Low | Apply only to target `<span>`, not parent |
| Tap-area enforcement breaks 10-col grid layout | Med | Med | Test on 320 px iPhone SE; if cells overflow, use invisible padding wrapper (`relative` outer `min-h-[44px]`, inner `aspect-square` absolute-centered) |
| Animation jank on low-end Android | Med | Med | Stick to `transform`/`opacity`-only keyframes; no `width`/`top` animation. Profile on Pixel 4a |
| Backdrop competes with grid colors | Low | Low | Cap opacity at 20%, `blur-3xl` |
| `tile-claim` animation triggers on initial mount for already-claimed tiles | Med | Low | Track previous owner with `useRef`; only animate on `prev === undefined && next !== undefined` |

## Security Considerations
- No new data inputs; `onClickNumber` already validated by store
- No XSS surface — all rendered values are numbers from store

## Next Steps
- Phase 3 (landing/lobby) consumes the same `.fn-card` / `.fn-btn-primary` tokens — coordinate so HUD/grid component-class names are stable before phase 3 lands
- Future: explore Web Vibration API for `navigator.vibrate(10)` on tap (out of scope — opt-in setting)

## Unresolved questions
- Does the team want haptic feedback on tile tap (Vibration API)? Defaulting to **no** — adds settings surface
- Should `tile-claim` fire for opponent's tiles too, or only your own? Default: **both** (game-feel) — flag for product review
