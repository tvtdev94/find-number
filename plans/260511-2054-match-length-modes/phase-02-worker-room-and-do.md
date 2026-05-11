---
title: "Phase 02 — Worker room + DO"
status: completed
priority: P2
effort: 1.5h
---

## Context Links

- `apps/worker/src/routes/rooms.ts`
- `apps/worker/src/routes/quickmatch.ts`
- `apps/worker/src/do/game-room.ts`
- `apps/worker/src/do/match-queue.ts`
- `apps/worker/src/game/round-controller.ts`
- Depends on: phase 01 (`MATCH_MODES`, snapshot fields)

## Overview

**Priority:** Critical (server-authoritative size).
**Status:** pending.
**Brief:** Wire mode into room lifecycle. `POST /api/rooms` accepts `mode`. DO stores mode → derives `matchSize` + `cols` → generates `numbers[]` of `[1..matchSize]`. Quick Match queue hardcodes `quick`. Bot rooms accept mode. `round-controller` becomes size-parameterized (drop hardcoded `ALL_NUMBERS`).

## Key Insights

- DO restart-safe: mode MUST be persisted to `state.storage` (alongside `code`, `botSlot`).
- `round-controller` exports `ALL_NUMBERS` constant — must be replaced by `buildNumberPool(size)` to keep purity.
- `RoundState` already carries `numbers[]`; length = matchSize. Keep `matchSize` as separate field on `RoundState` so `nextRound` can compute pool without re-deriving from `numbers.length` (clearer + matches snapshot).
- Forfeit logic uses `GAME_CONFIG.ROUNDS=10` to award final score (`finalScores = winner has ROUNDS, loser has current`). Replace with `Math.ceil(matchSize/2)` or simpler: award `matchSize - loserScore` to winner so winner > loser. Use `matchSize` (winner gets full size) — simple, observable.

## Requirements

**Functional**
- `POST /api/rooms` body: `{ mode?: 'sprint'|'quick'|'classic' }` (default `classic` for back-compat — but UI passes `quick`).
- `POST /api/rooms/bot` body: same `mode` (default `quick`).
- Quick Match queue: ALWAYS init rooms with `mode: 'quick'`.
- DO `/init` and `/init-bot` accept `mode` query/body, persist it.
- `/status` returns `mode` (for room-status UX, optional now).
- `RoundState.matchSize` exists; `nextRound`, `initialRoundState` accept matchSize.
- `roundStart.numbers.length === matchSize`. `snapshot.matchSize` + `snapshot.cols` populated.
- Forfeit final scores reflect new size.

**Non-functional**
- DO storage migration safe: existing in-flight rooms (none expected post-deploy, but legacy) default to `classic`/100.
- All `applyClick` semantics preserved.

## Architecture

```
Client POST /api/rooms {mode}
  → rooms.ts forwards mode to DO /init?code=X&mode=quick
  → DO persists mode → derives matchSize, cols
  → DO initialRoundState(seed, matchSize)
  → On roundStart broadcast: numbers[]=variable length
  → On snapshot send: {matchSize, cols, ...}

Client WS /api/quickmatch
  → MatchQueue tryMatch → init room with mode=quick

Client POST /api/rooms/bot {mode}
  → DO /init-bot?code=X&mode=Y
```

## Related Code Files

**Modify**
- `apps/worker/src/routes/rooms.ts` — parse JSON body, validate mode, forward to DO
- `apps/worker/src/do/match-queue.ts` — append `&mode=quick` to init URL
- `apps/worker/src/do/game-room.ts` — store mode, derive matchSize/cols, pass to round-controller, include in snapshot
- `apps/worker/src/game/round-controller.ts` — drop module-level `ALL_NUMBERS`; replace with `buildPool(size)`; accept `matchSize` in `initialRoundState` + thread through `RoundState`

**Create:** none.

## Implementation Steps

1. **round-controller.ts**
   - Add `matchSize: number` to `RoundState`.
   - Replace `export const ALL_NUMBERS = ...` with `export function buildPool(size: number): number[]`.
   - `initialRoundState(layoutSeed, matchSize = 100)` defaults to 100 for back-compat with existing test.
   - In `nextRound`, build `pool = buildPool(s.matchSize).filter(n => !taken.has(n))`; first shuffle uses `buildPool(s.matchSize)`.
2. **game-room.ts**
   - Add `private matchSize = 100`, `private cols = 10`, `private mode: MatchMode = 'classic'` fields.
   - Restore mode from storage in constructor's `blockConcurrencyWhile`.
   - `/init`, `/init-bot`: read `mode` from URL; `MATCH_MODES[mode]` → set fields + persist; pass `matchSize` to `initialRoundState`.
   - In `sendSnapshot`: include `matchSize: this.matchSize, cols: this.cols`.
   - In forfeit branch: replace `GAME_CONFIG.ROUNDS` with `this.matchSize` (winner gets matchSize, loser keeps current).
3. **routes/rooms.ts**
   - In `POST /`: parse optional JSON body, validate `mode` against `MATCH_MODES` keys (fallback `classic`). Append `&mode=X` to DO init URL.
   - In `POST /bot`: same, default `quick`.
4. **do/match-queue.ts**
   - In `tryMatch` + `fallBackToBot`: append `&mode=quick`.
5. **routes/rooms.ts `GET /:code`** — passthrough already returns DO response; include `mode` in DO `/status` JSON.
6. Run `pnpm --filter @find-number/worker typecheck` (or equivalent).

## Todo List

- [ ] `round-controller.ts` parameterized by matchSize
- [ ] `game-room.ts` fields + persistence + snapshot fields + forfeit fix
- [ ] `rooms.ts` POST accepts mode, validates, forwards
- [ ] `match-queue.ts` locks to `quick`
- [ ] `/status` returns mode
- [ ] worker typechecks clean

## Success Criteria

- Create room with `mode=sprint` → DO `/status` shows `mode: 'sprint'`; first `roundStart.numbers.length === 25`.
- Quick Match always produces rooms where `snapshot.matchSize === 50`.
- Bot match with `mode=classic` → 100 targets.
- Forfeit awards winner final score `=== matchSize`.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DO storage drift (old room missing mode) | Med | Med | `mode = (stored as MatchMode) ?? 'classic'` in constructor |
| Invalid mode in body | Med | Low | Validate against `Object.keys(MATCH_MODES)`; default `classic` |
| Forfeit score calc bug | Low | Med | Add test asserting `winner score === matchSize` after forfeit |
| Existing tests assert RANGE_MAX=100 | High | Low | `initialRoundState` defaults matchSize=100; tests pass unchanged |

## Security Considerations

- Validate `mode` server-side (don't trust client to send arbitrary string into DO state).
- Rate-limit unchanged — mode doesn't affect anti-cheat.

## Next Steps

Unblocks phase 03 (client consumes snapshot.matchSize/cols) and phase 04 (UI sends mode to API).
