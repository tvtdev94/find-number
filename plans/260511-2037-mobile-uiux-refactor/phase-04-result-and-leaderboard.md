---
phase: 4
title: "Result screen & leaderboard — podium identity + mobile card list"
status: pending
effort: 3h
depends_on: [1]
owner: unassigned
---

# Phase 4 — Result Screen & Leaderboard

## Context Links
- Plan overview: [plan.md](./plan.md)
- Phase 1 (foundation): [phase-01-design-tokens-and-identity.md](./phase-01-design-tokens-and-identity.md)
- Files: `apps/web/src/ui/result-screen.tsx`, `apps/web/src/routes/leaderboard.tsx`, `apps/web/src/routes/router.tsx`

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Rework the result screen into a celebration-worthy podium with crisp identity. Restructure the leaderboard mobile layout (already card-style, but needs polish, period switcher refinement, and lazy-loading). Add an outbound "share my result" CTA.

## Key Insights
- Result screen already integrates `canvas-confetti` (good) and has a basic 3-col pillar layout. Pain points: trophy emoji feels generic, no per-round breakdown (data not available in current store — confirmed), winner pillar visual weight equals loser pillar.
- Leaderboard top-3 podium is already implemented (good). Period tabs are functional but `text-xs sm:text-sm` is on the small side for tap targets — bump padding.
- Both `result-screen.tsx` and `leaderboard.tsx` are imported **eagerly** in `router.tsx` (`import { ... }` at top). The original plan claimed lazy-load is already done — it is NOT. Adding `lazy(() => import(...))` for `leaderboard.tsx` is a quick win since it's a separate route; `result-screen.tsx` is harder (rendered inside `Room`/`Practice` based on phase) and code-splitting it via `lazy` + `<Suspense fallback={<LoadingScreen/>}/>` saves ~3 KB on the initial gameplay chunk.
- Share-result CTA: use `navigator.share` if available — share text `"Tớ thắng Find Number {score}-{opponentScore}! Chơi cùng tớ: {origin}/r/{code}"`. Room code is no longer present after `reset()`, so capture it at the time the user lands on result.
- Round-by-round breakdown: store keeps `scores: [number, number]` only — per-round history not retained. Out of scope unless store extended (constraint forbids store changes).

## Requirements
**Functional**
- **Result screen**:
  - Replace trophy emoji with a vector trophy SVG (could be part of phase-1 logo asset family) when user wins; loser/draw retains semantic emoji or simple SVG
  - Winner pillar is visually dominant (bigger, glow, ring); loser is subdued
  - Add "Share kết quả" CTA next to Rematch / Exit (3-button row OR icon-only share)
  - Animate score numbers counting up from 0 → final on mount (CSS-only via `@property --score` if supported, else snap)
  - Maintain confetti behavior (do NOT change)
- **Leaderboard**:
  - Lazy-load via `React.lazy` in `router.tsx`
  - Bump period-tab padding to `py-3` (≥ 44 px tap)
  - Add empty-state illustration variant per period (e.g., "Chưa có trận tuần này — chơi để khai trương!")
  - Polish podium: gold/silver/bronze ring colors via phase-1 tokens
  - RankRow: tap-feedback on rows (currently static)
- **Result screen lazy-load**: wrap import in `lazy()` inside `room.tsx` and `practice.tsx`, gate with `<Suspense fallback={null}>`

**Non-functional**
- Bundle delta ≤ +4 KB gzip (net — gain from lazy-load may offset)
- Result screen mount → confetti within 250 ms (no regression)
- Leaderboard initial paint < 1 s on 4G

## Architecture
```
Router
  ├─ / → Landing (eager)
  ├─ /practice → Practice (eager — gameplay needs to start fast)
  ├─ /leaderboard → lazy(Leaderboard) + <Suspense fallback={LoadingScreen}/>
  └─ /r/:code → Room (eager)

Room / Practice (when phase === 'matchEnd')
  └─ lazy(ResultScreen) + <Suspense fallback={null}>

ResultScreen
  ├─ Title + trophy SVG
  ├─ ScorePillars (winner emphasized via .fn-glow ring)
  ├─ Confetti (existing — unchanged)
  └─ Actions: Rematch / Share / Exit
```

Share data flow:
- Capture `roomCode` from route or store at ResultScreen mount; build URL.
- On share click: `navigator.share?.({ title, text, url })` → fallback clipboard → toast feedback.

## Related Code Files
**Modify**
- `apps/web/src/ui/result-screen.tsx` — vector trophy, winner emphasis, share CTA, count-up animation
- `apps/web/src/routes/leaderboard.tsx` — lazy-load wiring (consumer side), tab padding, polish
- `apps/web/src/routes/router.tsx` — `lazy(() => import('./leaderboard'))` + `<Suspense>`
- `apps/web/src/routes/room.tsx` — `lazy(() => import('../ui/result-screen'))` for matchEnd
- `apps/web/src/routes/practice.tsx` — same lazy treatment as room

**Create**
- `apps/web/src/ui/trophy-mark.tsx` — vector trophy SVG component (≤ 30 LOC); could live alongside `find-number-logo.tsx`
- (Optional) `apps/web/src/ui/share-result-button.tsx` — extracts share logic if both lobby + result use it (DRY with phase 3)

**Delete** — none

## Implementation Steps
1. `router.tsx`: convert `Leaderboard` to `lazy(() => import('./leaderboard').then(m => ({ default: m.Leaderboard })))`; wrap route in `<Suspense fallback={<LoadingScreen />}>`
2. `room.tsx` + `practice.tsx`: same pattern for `ResultScreen` — guard with phase check so `<Suspense>` only renders when needed
3. `trophy-mark.tsx`: author vector trophy in same neon-arcade style as logo (consistent stroke width / glow)
4. `result-screen.tsx`:
   - Replace `titleEmoji` block with `<TrophyMark variant={youWin ? 'gold' : 'silver'} />`
   - Bump winner pillar `text-5xl` (was 4xl), add `shadow-glow-yellow-md`; loser pillar stays `text-4xl` `opacity-80`
   - Add 3-button row: Rematch (primary), Share (icon-only secondary), Exit (ghost)
   - Implement count-up:
     - simplest: CSS `@keyframes count-up` ramping `opacity 0 → 1` + `translateY 8px → 0` — read-cheap
     - true count-up via `@property --score` is gated on browser support; fall back to instant
   - Capture `roomCode` from URL via `wouter` `useRoute` or from `window.location.pathname`
   - Wire `handleShare` → `navigator.share` → clipboard
5. `leaderboard.tsx`:
   - Period tabs: `py-2 sm:py-2` → `py-3` for both states; tap area now ≥ 44 px
   - Period-aware empty state copy: switch on `tab`
   - Podium rings via phase-1 tokens: gold `ring-yellow-400`, silver `ring-gray-300`, bronze `ring-amber-700`
   - RankRow: add `active:bg-white/5` tap feedback
6. Verify Suspense fallback doesn't flash on fast networks (set `fallback={null}` for ResultScreen since the gap is < 100 ms)
7. Run build; verify lazy chunks created in `dist/assets/`
8. Manually trigger matchEnd in practice mode; verify share CTA + confetti behavior unchanged

## Todo List
- [ ] Lazy-load `Leaderboard` in `router.tsx`
- [ ] Lazy-load `ResultScreen` in `room.tsx` and `practice.tsx`
- [ ] Author `trophy-mark.tsx`
- [ ] Replace trophy emoji in `result-screen.tsx`
- [ ] Emphasize winner pillar (size + glow)
- [ ] Add Share CTA with `navigator.share` + clipboard fallback
- [ ] Add count-up animation (or graceful fallback)
- [ ] Bump period-tab padding for ≥ 44 px tap
- [ ] Period-aware empty state
- [ ] Polish podium rings via phase-1 tokens
- [ ] Tap feedback on RankRow
- [ ] Verify lazy chunks in build output
- [ ] Bundle delta ≤ +4 KB gzip (after lazy-load offset)

## Visual Changes
- Result screen reads as a celebration: vector trophy with glow, winner pillar visually larger and golden, loser pillar quietly framed
- Share button gives users a one-tap brag flow on iOS / Android
- Score numbers slide-up + count in instead of snapping
- Leaderboard period tabs feel chunkier; podium glints in gold/silver/bronze
- Empty leaderboard pulls a friendlier copy that matches the period

## Success Criteria
- `dist/assets/leaderboard-*.js` exists (lazy chunk created)
- `dist/assets/result-screen-*.js` exists (lazy chunk created)
- Initial JS chunk reduced (track size before/after)
- `navigator.share` works on iOS / Android; clipboard fallback verified on desktop
- Confetti continues to fire on win (no regression)
- Period tabs ≥ 44 px tap height
- Bundle net delta ≤ +4 KB gzip
- Vietnamese copy preserved

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lazy ResultScreen flash on fast networks | Med | Low | Use `fallback={null}`; chunk is small (< 8 KB) — loads in < 100 ms on 4G |
| Confetti import races with lazy ResultScreen import | Low | Low | Both are async; ResultScreen `useEffect` triggers confetti import after mount — order-independent |
| `@property --score` unsupported on older iOS | Med | Low | Feature-detect via `CSS.registerProperty` or `@supports`; fall back to instant render |
| Share text contains stale room code after reset | High | Med | Capture `roomCode` from URL path (`/r/:code`) at mount; do NOT read from store post-`reset()` |
| RankRow tap feedback fires accidentally during scroll | Low | Low | Use `active:` not `:hover` — touch already debounces |
| Lazy-load breaks initial route hydration / SSR | None | — | App is pure CSR (no SSR) — N/A |

## Security Considerations
- `navigator.share` payload contains only public room URL + score numbers (no nickname / PII beyond what user chose)
- Lazy chunks served from same origin — no new CSP rules needed
- Trophy SVG static, no scripts

## Next Steps
- Future: persist last 10 match results in IndexedDB for a "recent matches" history view (out of scope)
- Future: add `og:image` with score for richer Web Share previews — backend work needed

## Unresolved questions
- Should the share CTA also be available on result screen for *losers*? Default: **yes** — community / replay value > vanity. Confirm with product
- Should we capture `opponentNickname` for share text? Available in store at matchEnd — confirm not wiped before `reset()`
