---
phase: 5
title: "Modals & micro-interactions — entrance/exit motion and loading states"
status: pending
effort: 2.5h
depends_on: [1]
owner: unassigned
---

# Phase 5 — Modals & Micro-Interactions

## Context Links
- Plan overview: [plan.md](./plan.md)
- Phase 1 (foundation): [phase-01-design-tokens-and-identity.md](./phase-01-design-tokens-and-identity.md)
- Files: `apps/web/src/ui/quick-match-modal.tsx`, `apps/web/src/ui/reconnect-modal.tsx`, `apps/web/src/ui/opponent-left-banner.tsx`, `apps/web/src/ui/loading-screen.tsx`, `apps/web/src/ui/connection-status.tsx`, `apps/web/src/ui/error-boundary.tsx`

## Overview
- **Priority:** P3 (polish layer — least user-visible per session, but cumulative impact on perceived quality)
- **Status:** pending
- **Description:** Apply the phase-1 motion language and `.fn-modal-*` classes to the remaining modals and overlays. Add subtle entrance animations, polish the connection-status dot, replace the generic spinner with a brand-aligned loader, and upgrade the error boundary fallback.

## Key Insights
- Five modal-style files share the identical backdrop/panel pattern. They look "stamped" today because of literal class duplication. Phase 1 introduces `.fn-modal-backdrop` + `.fn-modal-panel` — phase 5 consolidates consumers.
- `OpponentLeftBanner` is a transient toast — would benefit from slide-down entrance and auto-dismiss after N seconds (currently sticky until manual dismiss; design decision needed).
- `ConnectionStatus` is a tiny status dot bottom-right — already unobtrusive. Polish: pulse the dot when `reconnecting`, fade between states instead of snap.
- `LoadingScreen` is generic. Replace with a brand-aligned mark: tiny `<FindNumberLogo variant="mark" />` with `animate-pulse-glow`.
- `ErrorBoundary` fallback is currently barebones. Add identity layer + helpful guidance: "Lỗi rồi — báo cho team biết". Optionally add `console.error → POST /api/client-error` (out of scope: requires backend route).
- `QuickMatchModal` spinner can adopt the same brand mark loader; status text already changes with state (`connecting / searching / matched / bot / timeout / error`).

## Requirements
**Functional**
- All modals adopt `.fn-modal-backdrop` + `.fn-modal-panel` classes (DRY consumer side)
- Modal entrance: `animate-fade-in-up` (150–200 ms); backdrop fade
- Modal exit: not strictly required (most unmount instantly via React) — accept snap-out for KISS; revisit only if jarring
- `OpponentLeftBanner`: slide-down entrance via `animate-stagger-in`; auto-dismiss after 8s with manual ✕ still available
- `ConnectionStatus`: pulse glow when `reconnecting`; smooth color transition between states
- `LoadingScreen`: replace spinner with brand mark pulsing
- `ErrorBoundary`: brand-aligned panel, helpful copy, "Reload" + "Home" buttons (currently only one), surface error details in collapsible `<details>` block
- `QuickMatchModal`: use brand loader; tighten "searching" copy hierarchy

**Non-functional**
- Bundle delta ≤ +2 KB gzip
- All modals reach interactive within 100 ms of mount
- No layout shift during entrance animations
- Reduced-motion respected (instant appear)

## Architecture
```
.fn-modal-backdrop (from phase 1)
   └─ animate-fade-in (~150ms)
       └─ .fn-modal-panel
           └─ animate-fade-in-up

Loading patterns
  ├─ <LoadingScreen> (full-bleed)
  │    └─ <FindNumberLogo mark animate-pulse-glow />
  ├─ <BrandSpinner> (modal-embedded)  ← optional new component
  │    └─ same mark, smaller, used in QuickMatchModal + ReconnectModal
  └─ legacy spinner removed

ErrorBoundary
  ├─ panel with .fn-card
  ├─ collapsed error details
  ├─ Reload (window.location.reload)
  └─ Home (window.location.href = '/')
```

## Related Code Files
**Modify**
- `apps/web/src/ui/quick-match-modal.tsx` — `.fn-modal-*` classes + brand loader
- `apps/web/src/ui/reconnect-modal.tsx` — `.fn-modal-*` classes + brand loader
- `apps/web/src/ui/opponent-left-banner.tsx` — slide-down entrance + auto-dismiss timer
- `apps/web/src/ui/loading-screen.tsx` — brand mark loader
- `apps/web/src/ui/connection-status.tsx` — pulse when reconnecting + smooth transition
- `apps/web/src/ui/error-boundary.tsx` — brand-aligned panel + extra CTA + collapsible details

**Create**
- `apps/web/src/ui/brand-spinner.tsx` — small reusable brand-mark loader (≤ 25 LOC). Created only if reused in 2+ places; otherwise inline (YAGNI guard)

**Delete** — none

## Implementation Steps
1. `quick-match-modal.tsx`:
   - Replace `absolute inset-0 z-30 ... backdrop-blur` with `.fn-modal-backdrop`
   - Replace panel `w-[min(94vw,400px)] ...` with `.fn-modal-panel`
   - Replace 12×12 spinner with `<BrandSpinner size={48} />` (or inline equivalent)
   - Add `animate-fade-in-up` on panel
2. `reconnect-modal.tsx`: same treatment; keep grace-timer logic untouched
3. `opponent-left-banner.tsx`:
   - Replace static positioning + colors with phase-1 warning token
   - Add `animate-stagger-in` entrance
   - Add `useEffect` timer: auto-dismiss after 8000 ms
   - Keep manual ✕ button
4. `loading-screen.tsx`:
   - Replace spinner with `<FindNumberLogo variant="mark" size={32} />` wrapped in `animate-pulse-glow`
   - Keep `label` prop API unchanged
5. `connection-status.tsx`:
   - Add `transition-colors duration-300` on the dot
   - Add `animate-pulse-glow` when `state === 'reconnecting'`
6. `error-boundary.tsx`:
   - Reskin panel with `.fn-card` red-ring variant
   - Add Vietnamese helper copy: "Có lỗi xảy ra. Thử reload hoặc về trang chủ."
   - Wrap error details in `<details>` (collapsed by default)
   - Two CTAs: Reload (`window.location.reload`), Home (existing)
7. Audit `prefers-reduced-motion` — confirm all new entrance animations short-circuit to opacity-only fades
8. Build + bundle delta + smoke test each modal state

## Todo List
- [ ] Adopt `.fn-modal-*` in `quick-match-modal.tsx`
- [ ] Adopt `.fn-modal-*` in `reconnect-modal.tsx`
- [ ] Slide-down + auto-dismiss in `opponent-left-banner.tsx`
- [ ] Brand-mark loader in `loading-screen.tsx`
- [ ] Pulse + smooth transitions in `connection-status.tsx`
- [ ] Reskin + dual CTA in `error-boundary.tsx`
- [ ] Conditionally extract `<BrandSpinner>` if used twice (else inline)
- [ ] Verify reduced-motion fallback
- [ ] Build + bundle delta ≤ +2 KB gzip
- [ ] Manual smoke: simulate each modal state (quick-match timeout, reconnect grace, opponent-left, error throw)

## Visual Changes
- Modals now appear with a soft fade + lift instead of snapping in
- All loading states share the same identity (brand mark pulsing) — no more generic spinner
- Connection status dot has personality during reconnects (pulsing glow)
- Opponent-left banner slides in cleanly and dismisses itself after a beat
- Error boundary feels like part of the app rather than a 90s stack-trace dump

## Success Criteria
- All 6 listed files use phase-1 tokens / classes — no inline duplication of `bg-gray-950/90 backdrop-blur` etc.
- Each modal entrance animation completes ≤ 200 ms
- Reduced-motion users see no scale / translate animations
- Bundle delta ≤ +2 KB gzip
- Error boundary recovery path tested by intentionally throwing in a route
- Vietnamese copy preserved except where new helpful copy added

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auto-dismiss banner hides important opponent-left info before user reads | Med | Med | 8-second window gives 2-3 readings; manual ✕ still available; banner re-shows on opponent return events if any |
| Brand loader (SVG) heavier than `animate-spin` div | Low | Low | Mark variant is ≤ 1 KB; renders once cached |
| `.fn-modal-*` class refactor causes z-index regression | Med | Med | Audit z-index per modal: lobby (z-20), quick-match (z-30), result (z-30), reconnect (z-40), opponent-left (z-30). Encode tiered z values inside `.fn-modal-backdrop-{20,30,40}` or keep z explicit at call site |
| ErrorBoundary copy in Vietnamese clashes with English console logs | Low | Low | Keep details panel as raw text — devs read; users see Vietnamese helper |
| Reduced-motion check leaves some animations active | Med | Low | Centralize via `@media (prefers-reduced-motion: reduce) { .animate-* { animation: none !important } }` in `styles.css` |

## Security Considerations
- ErrorBoundary surfaces `error.message` only — never `error.stack` to users (already the case in `componentDidCatch`)
- No remote error reporting added (avoid PII leak risk without explicit consent)
- Auto-dismiss timer cleared on unmount — no leak

## Next Steps
- Optional follow-up: opt-in client error reporting (POST /api/client-error) — backend phase
- Future: skeleton screens for leaderboard / room while loading (out of scope)

## Unresolved questions
- Confirm 8-second auto-dismiss for opponent-left banner is acceptable (vs sticky-until-action)
- Should reconnect modal also show a "Give up & exit" button after, say, 15 s? Currently no escape during grace period
