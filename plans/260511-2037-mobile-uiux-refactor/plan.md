---
title: "Mobile UI/UX Refactor — Neon-Arcade × Premium Dark"
description: "5-phase mobile-first redesign of Find Number with design tokens, animations, and identity layer"
status: pending
priority: P2
effort: 14h
branch: main
tags: [ui, ux, mobile, design-system, tailwind, animations, refactor]
created: 2026-05-11
---

# Mobile UI/UX Refactor — Find Number

Comprehensive mobile-first UI/UX refactor: lift visual identity to neon-arcade × premium-dark hybrid, fix tap-target / HUD sizing on small phones, add CSS-only motion language, memoize the 10×10 grid. **No framer-motion. No backend changes. No store/protocol changes.**

## Direction (locked)
- Visual: premium-dark base + neon accents on key elements + custom Find-Number logo mark
- Animation: Tailwind keyframes + `tailwindcss-animate` plugin (no JS animation lib)
- Touch targets: ≥44pt iOS / 48dp Android
- Bundle budget: ≤ +15 KB gzip total
- Each phase ships independently (small PR)

## Safe-area rules (apply to ALL phases — MANDATORY)
Mobile hides UI under notch / Dynamic Island / home indicator / Safari address bar.
- **Top inset**: HUD, top banners, modal headers → `.safe-top` utility (Phase 1 added)
- **Bottom inset**: primary CTAs, footers → `.safe-bottom` utility (Phase 1 added)
- **Full-height**: use `h-[100dvh]` / `min-h-[100dvh]` — NEVER `100vh` (Safari address bar bug)
- **Backdrop**: modal dark layer is full-bleed (no inset); only inset the **panel content**
- **Verify each phase** on: iPhone with notch, Android gesture nav, landscape, address-bar collapsed
- Reference: `docs/design-tokens.md` § Safe areas

## Phases

| # | File | Status | Depends on | Touch budget |
|---|------|--------|------------|--------------|
| 1 | [phase-01-design-tokens-and-identity.md](./phase-01-design-tokens-and-identity.md) | completed | — | +4 KB |
| 2 | [phase-02-in-game-grid-and-hud.md](./phase-02-in-game-grid-and-hud.md) | pending | 1 | +2 KB |
| 3 | [phase-03-landing-and-lobby.md](./phase-03-landing-and-lobby.md) | pending | 1 | +3 KB |
| 4 | [phase-04-result-and-leaderboard.md](./phase-04-result-and-leaderboard.md) | pending | 1 | +4 KB |
| 5 | [phase-05-modals-and-micro-interactions.md](./phase-05-modals-and-micro-interactions.md) | pending | 1 | +2 KB |

Phase 1 is foundation. Phases 2–5 are independent and may ship in any order after phase 1.

## Dependencies / Risks
- New npm dep: `tailwindcss-animate` (~1 KB gzip) — design-system aligned, widely used (shadcn ecosystem)
- No new runtime libs beyond plugin
- Risk: shared modal classes touched by multiple phases → each phase owns disjoint files (see per-phase File Ownership)
- Rollback: each phase is one commit; revert independently

## Success Criteria (whole refactor)
- iPhone SE (320×568) and 360×640 Android: HUD ≤ 72 px tall, grid tile ≥ 44 × 44 px tap area
- Lighthouse mobile perf ≥ 90 (was unknown — baseline measured in phase 1)
- Zero re-render of unowned tiles per click (verified by React Profiler in phase 2)
- Vietnamese copy preserved verbatim except where copy explicitly improved
- `pnpm --filter @find-number/web build` passes after each phase

## Out of scope
- Backend / worker / DO changes
- WebSocket protocol additions
- Store shape changes (`game-store`, `settings-store`)
- New screens / new features
- i18n / language toggle
