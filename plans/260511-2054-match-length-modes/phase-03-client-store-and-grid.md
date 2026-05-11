---
title: "Phase 03 — Client store + grid + HUD"
status: completed
priority: P2
effort: 1.5h
---

## Context Links

- `apps/web/src/store/game-store.ts`
- `apps/web/src/store/settings-store.ts`
- `apps/web/src/ui/number-grid.tsx`
- `apps/web/src/ui/hud.tsx`
- Depends on: phase 01 (types), phase 02 (server emits new fields)

## Overview

**Priority:** Critical (visual correctness).
**Status:** pending.
**Brief:** Game store carries `matchSize` + `cols`. Settings store persists `practiceMode` + `createRoomMode`. `NumberGrid` uses dynamic cols. `HUD` reads `matchSize` from store, not the legacy constant.

## Key Insights

- Local (Practice) mode bypasses server — store must initialize `matchSize`/`cols` from `practiceMode` in `startMatch`.
- Server mode: snapshot/roundStart from worker; client just mirrors. Snapshot back-compat: if `matchSize` missing (old worker), fallback `100`/`10`.
- `roundStart` does NOT include `matchSize` — fine, snapshot delivered first on connect carries it, and matchSize never changes mid-match.
- `NumberGrid` previously hardcoded `repeat(10, ...)`. Tile sizing (aspect-square + `repeat(N, minmax(0,1fr))`) auto-scales — sprint (5×5) gives larger tiles, classic stays current size.

## Requirements

**Functional**
- `useGameStore` exposes `matchSize: number`, `cols: number` (defaults: 100, 10).
- `startMatch(opts: { mode?: MatchMode, alternateSlots?: boolean })` sets matchSize/cols + ALL_NUMBERS pool for local mode.
- `applyServerMsg('snapshot')` reads `msg.matchSize ?? 100`, `msg.cols ?? 10`.
- `useSettingsStore` adds `practiceMode: MatchMode` (default `quick`), `createRoomMode: MatchMode` (default `quick`), plus setters; persisted under existing `fn:settings` key.
- `NumberGrid` accepts `cols: number` prop; renders `gridTemplateColumns: repeat(${cols}, minmax(0,1fr))`.
- `HUD` computes `remaining = matchSize - found.length` from store.

**Non-functional**
- 5×5 grid: tiles ≥60px on a 360px viewport (max-w-640px container scales down — verify).
- No bundle regression; remove the dead `TOTAL_NUMBERS` const + module-level `ALL_NUMBERS` duplication.
- Settings migration: existing localStorage entries (only `nickname`, `alternateSlotsLocal`) merge cleanly via `persist` middleware default-merging.

## Architecture

```
settings-store (persist)
  ├── practiceMode      ← StartLobby selector
  └── createRoomMode    ← Landing selector

game-store
  ├── matchSize, cols   ← from server (snapshot) OR local startMatch(mode)
  └── ALL_NUMBERS no longer module-const → derived per startMatch from matchSize

NumberGrid props now: { numbers, foundBy, onClickNumber, disabled, cols }
HUD reads: matchSize, found.length → "{remaining} left"
```

## Related Code Files

**Modify**
- `apps/web/src/store/game-store.ts`
- `apps/web/src/store/settings-store.ts`
- `apps/web/src/ui/number-grid.tsx`
- `apps/web/src/ui/hud.tsx`

**Create:** none.

## Implementation Steps

1. **settings-store.ts** — add fields + setters + import `MatchMode`:
   ```ts
   practiceMode: MatchMode      // default 'quick'
   createRoomMode: MatchMode    // default 'quick'
   setPracticeMode(m): void
   setCreateRoomMode(m): void
   ```
   Keep persist key `fn:settings`; zustand persist auto-merges new fields with defaults.
2. **game-store.ts**
   - Drop module-level `ALL_NUMBERS`. Replace with `buildPool(size)` helper.
   - Add `matchSize: number = 100`, `cols: number = 10` to `Extras`.
   - `startMatch({ mode = 'classic', alternateSlots } = {})`: set matchSize/cols from `MATCH_MODES[mode]`, init `numbers` to `buildPool(size)`.
   - `beginRound`: `pickTarget(s.numbers, s.found)` already operates on `s.numbers` — no change needed beyond shuffling source = `buildPool(s.matchSize)`.
   - In `applyServerMsg('snapshot')`: extract `matchSize`, `cols` with defaults; set in state.
   - In `setServerMode`: reset matchSize=100/cols=10 (snapshot will overwrite).
3. **number-grid.tsx** — add `cols: number` prop; use in inline style.
4. **hud.tsx** — read `matchSize` from store, remove `TOTAL_NUMBERS` constant + GAME_CONFIG import.
5. Run `pnpm --filter @find-number/web typecheck`.

## Todo List

- [ ] settings-store fields + persistence verified across reload
- [ ] game-store matchSize/cols state + dynamic pool
- [ ] NumberGrid cols prop
- [ ] HUD reads from store
- [ ] Snapshot fallback defaults to 100/10 if undefined
- [ ] typecheck clean

## Success Criteria

- DevTools: sprint match → `useGameStore.getState().matchSize === 25`, grid shows 5 columns.
- Practice → close tab → reopen → last selected practiceMode restored from localStorage.
- HUD "{N} left" decrements correctly across 25/50/100 modes.
- Old client + new worker: works (worker emits new fields, client reads them).
- New client + missing fields (defensive path): grid renders 10 cols, 100 left.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Persist middleware version conflict on existing users | Low | Low | New fields added with defaults; zustand persist merges cleanly |
| 5×5 tiles too big on tall viewports | Med | Low | Container already capped at max-w-640px; visual QA in phase 04 |
| Snapshot arrives before first roundStart with wrong matchSize | Low | Med | DO always sets matchSize in snapshot once `/init?mode=` ran |

## Security Considerations

None. Client mirrors server-authoritative state; mode is decorative on client.

## Next Steps

Unblocks phase 04 (UI pickers wire setters + pass mode to createRoom).
