---
phase: 3
title: "Landing & lobby — identity hero + refined hierarchy"
status: pending
effort: 2.5h
depends_on: [1]
owner: unassigned
---

# Phase 3 — Landing & Lobby

## Context Links
- Plan overview: [plan.md](./plan.md)
- Phase 1 (foundation): [phase-01-design-tokens-and-identity.md](./phase-01-design-tokens-and-identity.md)
- Files: `apps/web/src/routes/landing.tsx`, `apps/web/src/ui/lobby.tsx`, `apps/web/src/ui/start-lobby.tsx`

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Replace the generic "P1 vs P2 chips + Find Number text" landing hero with the new logo mark and a refined single-column flow. Polish the lobby room-code share UX. Refresh `start-lobby.tsx` (practice intro modal) using the new identity layer.

## Key Insights
- Current landing has three CTAs (Create / Quick Match / Join via Code) — keep this trio but improve hierarchy: Quick Match is the primary path (most users want to play *now*), Create Room is secondary (with friends), Join Code is tertiary (received an invite).
- Current ambient orbs are decent but feel un-branded — adding the logo + reducing chip-VS clutter elevates identity.
- Room code in `lobby.tsx` uses `tracking-[0.3em]` `text-4xl` — readable but the share affordance (copy link) is buried as a small line below the code. Native Web Share API would dramatically improve mobile sharing.
- `start-lobby.tsx` is the practice intro — keep "how to play" copy verbatim (Vietnamese) but reskin container with `.fn-modal-panel`.
- Nickname input lacks a "recent nicknames" affordance — out of scope (would need new persistence). Keep as-is.

## Requirements
**Functional**
- Landing: replace VS-chip hero with `<FindNumberLogo variant="full" size={56} glow />` (from phase 1)
- Reorder CTAs visually: **Quick Match** primary (yellow gradient), **Create Room** secondary, **Join code** as compact inline form
- Add subtle entrance staggers via Tailwind `animate-fade-in-up` with delay utilities
- Lobby: add Web Share API integration when available (`navigator.share`) → fall back to clipboard copy
- Lobby: add visual indicator when opponent is connecting (skeleton player card pulse) — leveraging `players[].connected`
- `start-lobby.tsx`: same `.fn-modal-*` treatment for consistency

**Non-functional**
- Bundle delta ≤ +3 KB gzip (mostly logo SVG inline)
- Lighthouse mobile accessibility ≥ 95 (color contrast on yellow CTAs verified)
- Tab order preserves keyboard accessibility
- All buttons ≥ 44 px tap height (audit existing — Create Room button is `py-3.5` ≈ 56 px ✓; Join button is `px-5` no explicit height → fix)

## Architecture
```
Landing
  ├─ <FindNumberLogo variant="full" glow />   ← phase-1 component
  ├─ Nickname input  (unchanged data flow → settings-store)
  ├─ Primary CTA: Quick Match → <QuickMatchModal />
  ├─ Secondary CTA: Create Room → POST /api/rooms (existing room-api.ts)
  ├─ Tertiary: Join code form (existing)
  └─ Footer links: Practice · Leaderboard

Lobby (overlay on /r/:code when phase === 'lobby')
  ├─ Room code share card
  │    ├─ tap → navigator.share() if available, else clipboard
  │    └─ visual feedback: 'Đã copy!' / 'Đã share!'
  ├─ Player cards × 2  (P1, P2)
  │    └─ skeleton when opponent absent
  └─ Ready CTA
```

No store/protocol changes. Web Share API is feature-detected at call time.

## Related Code Files
**Modify**
- `apps/web/src/routes/landing.tsx` — new hero, reordered CTAs, entrance staggers
- `apps/web/src/ui/lobby.tsx` — share-sheet integration, skeleton when waiting, `.fn-*` classes
- `apps/web/src/ui/start-lobby.tsx` — `.fn-modal-*` classes, optional logo mark in header

**Create**
- `apps/web/src/ui/skeleton-player-card.tsx` — pulsing skeleton placeholder when opponent slot empty (≤ 20 LOC; or inline if simpler — apply YAGNI)

**Delete** — none

## Implementation Steps
1. `landing.tsx`:
   - Replace VS-chips block with `<FindNumberLogo variant="full" size={64} glow />` centered
   - Reorder buttons: Quick Match (primary yellow gradient), Create Room (secondary white/10), Join code stays inline form
   - Apply `animate-fade-in-up` with delay utilities (`[animation-delay:80ms]`, `[animation-delay:160ms]`, `[animation-delay:240ms]`) for stagger
   - Audit Join button → add `min-h-[44px]`
   - Ensure error toast uses new `.fn-card` warning variant
2. `lobby.tsx`:
   - Wrap copy handler in helper: try `navigator.share({title, url})` → fall back to clipboard
   - Show button label "📤 Share / Copy" instead of `tap to copy` when share API present
   - Show skeleton card on opponent side when `!opponent`
   - Apply `.fn-modal-backdrop` + `.fn-modal-panel` classes
   - Wrap content in `animate-fade-in-up`
3. `start-lobby.tsx`:
   - Reskin with `.fn-modal-*` classes
   - Optionally swap the 🎯 emoji bubble for `<FindNumberLogo variant="mark" size={48} />`
   - Keep Vietnamese copy verbatim
4. Verify keyboard tab order on landing (nickname → Create → Quick Match → Code input → Join → Practice → Leaderboard)
5. Test Web Share API on iOS Safari + Android Chrome; verify clipboard fallback on desktop Firefox
6. Run build; capture bundle delta

## Todo List
- [ ] Embed `<FindNumberLogo>` in landing hero
- [ ] Reorder + restyle CTAs (Quick Match primary)
- [ ] Apply staggered entrance animations
- [ ] Add `min-h-[44px]` to Join button
- [ ] Wire `navigator.share` with clipboard fallback in lobby
- [ ] Add waiting skeleton for empty opponent slot
- [ ] Reskin `start-lobby.tsx` with `.fn-modal-*`
- [ ] Audit keyboard tab order
- [ ] Test share sheet on iOS + Android
- [ ] Build + bundle delta ≤ +3 KB gzip

## Visual Changes
- Landing leads with the new logo + wordmark — instantly identifiable
- Single clear primary action (Quick Match) reduces decision fatigue
- Subtle entrance cascade on first paint signals polish
- Lobby's room code card now offers native share sheet on mobile — one tap to send the link
- Empty opponent slot pulses with a skeleton placeholder instead of static empty card
- Practice intro modal feels part of the same family

## Success Criteria
- Landing renders new logo without layout shift (preload SVG)
- Quick Match CTA is visually the dominant choice (size + color contrast)
- `navigator.share` invoked on iOS / Android (manual verify); clipboard fallback works on desktop
- All buttons ≥ 44 px tap height
- Tab order matches DOM order
- Bundle delta ≤ +3 KB gzip
- Vietnamese copy unchanged

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `navigator.share` rejects on insecure context (http://) | Med | Low | Feature-detect `navigator.share && navigator.canShare?.(...)` ; fall back gracefully |
| Logo SVG bundled inline inflates landing JS chunk | Low | Low | Phase-1 budget already accounts; verify via build report |
| Stagger animation delay attribute fails in older Safari | Low | Low | Use Tailwind arbitrary `[animation-delay:Xms]` — supported back to Safari 14 |
| Skeleton looks busy next to real player card | Med | Low | Use very subtle `bg-white/5 animate-pulse` only; no glow |
| Reordering CTAs disorients existing users | Med | Low | Keep all CTAs present; only re-emphasize via styling |

## Security Considerations
- Web Share API requires HTTPS — already enforced in production
- `navigator.share` payload contains only public room URL — no PII
- Nickname input still capped at 20 chars and trimmed by `settings-store` (no change)

## Next Steps
- After phase 3 + phase 4 merge, audit landing → leaderboard navigation for consistent back-button placement
- Future: persist last-used room code in localStorage for one-tap rejoin (out of scope)

## Unresolved questions
- Should Web Share also include a custom og:image? Requires backend meta-tag work — defer to a separate "share preview" effort
- Final wordmark text: "FIND NUMBER" all-caps vs "Find Number" title-case — decide during logo design in phase 1
