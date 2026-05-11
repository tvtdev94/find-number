---
title: "Phase 01 — Shared config + protocol"
status: completed
priority: P2
effort: 30m
---

## Context Links

- Existing: `packages/shared/src/index.ts`, `packages/shared/src/protocol.ts`
- Consumers: worker DO, web store/grid/hud

## Overview

**Priority:** Foundation (blocks all other phases).
**Status:** pending.
**Brief:** Introduce `MATCH_MODES` constant + `MatchMode` type in shared package; extend `ServerMsg.snapshot` with `matchSize` + `cols` fields. No runtime logic — purely types/constants.

## Key Insights

- `numbers[]` in `roundStart` is already variable-length — no protocol change needed there. Length implies size.
- `snapshot` is the only message a fresh client uses to recover layout; must carry `cols` so grid renders correctly on reconnect.
- Existing `GAME_CONFIG.RANGE_MAX = 100` stays as legacy constant but is no longer referenced by game logic.

## Requirements

**Functional**
- `MATCH_MODES.sprint = { size: 25, cols: 5 }`
- `MATCH_MODES.quick = { size: 50, cols: 5 }`
- `MATCH_MODES.classic = { size: 100, cols: 10 }`
- `type MatchMode = 'sprint' | 'quick' | 'classic'`
- `snapshot` gains `matchSize: number` and `cols: number` (both required on new messages).

**Non-functional**
- Zero bundle cost on web (constants tree-shake to consumed entries).
- TypeScript strict mode preserved — no `any`.

## Architecture

```
@find-number/shared
├── MATCH_MODES (const, frozen)
├── MatchMode (string union)
└── ServerMsg.snapshot { ..., matchSize, cols }
```

Data flow: shared → worker (server-authoritative) → snapshot/roundStart → client store.

## Related Code Files

**Modify**
- `packages/shared/src/index.ts`
- `packages/shared/src/protocol.ts`

**Create:** none.

## Implementation Steps

1. In `index.ts`, add:
   ```ts
   export const MATCH_MODES = {
     sprint:  { size: 25,  cols: 5 },
     quick:   { size: 50,  cols: 5 },
     classic: { size: 100, cols: 10 },
   } as const
   export type MatchMode = keyof typeof MATCH_MODES
   ```
2. Keep `GAME_CONFIG.RANGE_MAX = 100` (used only as default fallback now).
3. In `protocol.ts`, extend `snapshot` payload to include `matchSize: number` and `cols: number`. Do NOT remove or rename existing fields.
4. Run `pnpm -w build` (or `tsc --noEmit` in shared) to verify no TS errors propagate.

## Todo List

- [ ] Add `MATCH_MODES` const + `MatchMode` type
- [ ] Extend `ServerMsg.snapshot` with `matchSize`, `cols`
- [ ] Verify shared package builds clean
- [ ] Verify worker + web still typecheck (will surface missing fields in DO snapshot builder — expected, fixed in phase 02/03)

## Success Criteria

- `import { MATCH_MODES, MatchMode } from '@find-number/shared'` resolves.
- `MATCH_MODES.quick.size === 50`.
- TS errors only appear in DO `sendSnapshot` + client store snapshot handler (intentional — drives next phases).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Breaking change to `snapshot` propagates errors | High | Low | Errors are the point — they pin next phases |
| Old deployed clients miss new fields | Low | Low | Phase 03 client defaults `matchSize=100, cols=10` if undefined |

## Security Considerations

None. Pure type/const additions.

## Next Steps

Unblocks phase 02 (DO consumes config) and phase 03 (client reads snapshot fields).
