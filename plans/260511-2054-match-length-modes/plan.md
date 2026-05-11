---
title: "Configurable match length modes (sprint/quick/classic)"
description: "Adds 3 match presets (25/50/100) with mode pickers in Practice + Create Room; Quick Match locked to quick (50)."
status: completed
priority: P2
effort: 6h
branch: main
tags: [feature, gameplay, protocol, ui]
created: 2026-05-11
---

## Overview

Replace hardcoded 100-number / 10x10 grid with 3 selectable presets:

| Mode    | Size | Grid  | Est.    |
|---------|------|-------|---------|
| sprint  | 25   | 5x5   | ~1 min  |
| quick   | 50   | 5x10  | ~2-3 m  |
| classic | 100  | 10x10 | ~5-8 m  |

Practice + Create Room expose picker. Quick Match locked to `quick`. Bot inherits room mode.

## Phases

| # | Phase | Status | Blocks |
|---|-------|--------|--------|
| 01 | [Shared config + protocol](./phase-01-shared-config-and-protocol.md) | completed | — |
| 02 | [Worker room + DO](./phase-02-worker-room-and-do.md) | completed | — |
| 03 | [Client store + grid + HUD](./phase-03-client-store-and-grid.md) | completed | — |
| 04 | [Client UI pickers](./phase-04-client-ui-pickers.md) | completed | — |
| 05 | [Tests + docs](./phase-05-tests-and-docs.md) | completed | — |

## Files affected (master list)

**Modify**
- `packages/shared/src/index.ts` — add `MATCH_MODES`, `MatchMode` type
- `packages/shared/src/protocol.ts` — extend `snapshot` (matchSize, cols)
- `apps/worker/src/routes/rooms.ts` — accept `mode` in create body
- `apps/worker/src/routes/quickmatch.ts` — pass locked `quick` to queue
- `apps/worker/src/do/game-room.ts` — store + use matchSize/cols; init from mode
- `apps/worker/src/do/match-queue.ts` — init rooms with mode=`quick`
- `apps/worker/src/game/round-controller.ts` — accept `matchSize` (drop ALL_NUMBERS const)
- `apps/worker/src/game/round-controller.test.ts` — assertions parameterized
- `apps/web/src/store/game-store.ts` — `matchSize`, `cols` state; dynamic ALL_NUMBERS
- `apps/web/src/store/settings-store.ts` — `practiceMode`, `createRoomMode` persisted
- `apps/web/src/ui/number-grid.tsx` — `cols` prop drives gridTemplateColumns
- `apps/web/src/ui/hud.tsx` — uses store `matchSize`
- `apps/web/src/ui/start-lobby.tsx` — render mode-selector
- `apps/web/src/net/room-api.ts` — `createRoom(mode)` arg
- `apps/web/src/routes/landing.tsx` — mode-selector before Create Room
- `README.md`, `docs/system-architecture.md` — feature doc

**Create**
- `apps/web/src/ui/mode-selector.tsx`

## Cross-cutting risks

- **Protocol back-compat:** old client receiving new snapshot OK (extra fields ignored). New client receiving snapshot from old DO (pre-deploy) must default `matchSize=100`, `cols=10`.
- **Quick Match queue fragmentation:** locked to `quick` only — non-negotiable.
- **Bundle delta:** target ≤+2KB. Mode selector is plain buttons, no new deps.

## Open decisions (resolved)

- Leaderboard per-mode: **No** — combined for now; track as follow-up.
- Persist last-used mode: **Yes** via settings-store (zustand persist already in use).
- Show est. duration in selector: **Yes** — UX hint helps new users.

## Acceptance (whole feature)

- All 3 modes round-trip cleanly host → server → client → result
- Existing Quick Match flow unchanged behavior, fixed at 50
- Practice persists last mode across reload
- All existing worker + web tests pass (8 web; worker tests updated)
- Bundle size delta ≤+2KB gzipped

## Completion Summary

Feature shipped 2026-05-11. 3 match modes (sprint/quick/classic at 25/50/100 numbers) now selectable in Practice + Create Room. Quick Match permanently locked to quick (50). Backend protocol extended (matchSize, cols); client defaults applied for back-compat. Mode persists across sessions. All tests pass (23/23 worker; 8/8 web). Bundle impact: +1KB gzip JS, +0.07KB CSS. Code review completed with 0 blockers.
