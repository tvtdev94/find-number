---
title: "Phase 05 — Tests + docs"
status: completed
priority: P2
effort: 1h
---

## Context Links

- `apps/worker/src/game/round-controller.test.ts`
- `apps/web/src/game/scoring.test.ts`
- `README.md`
- `docs/system-architecture.md`
- Depends on: phases 01–04

## Overview

**Priority:** Verify + document.
**Status:** pending.
**Brief:** Update worker tests for size parameterization; add new size-edge-case tests (sprint=25 reaches matchEnd in 25 clicks; classic still passes existing 100-iteration test). Smoke test mode round-trip via DO fetch. Update README feature list + architecture doc.

## Key Insights

- Existing test "matchEnd only when all numbers claimed" iterates 100 times — must remain green with `initialRoundState` defaulting matchSize=100.
- Add parallel test asserting sprint mode reaches matchEnd in exactly 25 clicks.
- No new e2e Playwright spec required; manual smoke covers all 3 modes round-trip.
- Existing 8 web tests live in `apps/web/src/game/scoring.test.ts` (verify path with Glob if needed) — none reference `RANGE_MAX` directly; should pass unchanged.

## Requirements

**Functional**
- Worker tests pass with parameterized matchSize.
- New unit tests:
  - `initialRoundState(seed, 25).numbers.length === 25`.
  - sprint match completes (matchEnd) after 25 hits.
  - `buildPool(50).at(-1) === 50`.
- Existing tests untouched where they use defaults.
- README "Features" section mentions 3 modes.
- `docs/system-architecture.md` updated: protocol snapshot fields + room create body.

**Non-functional**
- No flaky tests introduced.
- Documentation accurate vs. shipped code.

## Architecture

```
Tests
├── round-controller.test.ts  (extended: matchSize param cases)
└── scoring.test.ts           (verify still passes)

Docs
├── README.md                  (Features bullet)
└── docs/system-architecture.md (Protocol + API section)
```

## Related Code Files

**Modify**
- `apps/worker/src/game/round-controller.test.ts`
- `README.md`
- `docs/system-architecture.md`

**Create:** none.

## Implementation Steps

1. Add to `round-controller.test.ts`:
   - `describe('matchSize parameterization', () => { ... })`
   - Test 1: `initialRoundState(1, 25).numbers.length === 25`.
   - Test 2: sprint matchEnd after 25 hits (loop bounded by matchSize, not constant).
   - Test 3: `buildPool(50)` returns `[1..50]`.
2. Run `pnpm -w test` — verify all green.
3. **README.md** — add bullet under Features: "3 match modes: Sprint (25), Quick (50), Classic (100)".
4. **docs/system-architecture.md** — note `MATCH_MODES`, `POST /api/rooms` body, snapshot `matchSize/cols` fields.
5. Manual smoke matrix:
   | Path | Mode | Expected |
   |---|---|---|
   | Practice | sprint | 5×5, 25 numbers, ~1 min |
   | Practice | classic | 10×10, 100 numbers |
   | Create Room | quick | 5×10, 50 numbers |
   | Quick Match | (locked) | always 50, no selector visible |
   | Bot match | inherits room | matches host pick |

## Todo List

- [ ] Add 3 new unit tests for matchSize
- [ ] All worker tests pass
- [ ] All 8 web tests still pass
- [ ] README updated
- [ ] system-architecture.md updated
- [ ] Manual smoke matrix executed

## Success Criteria

- `pnpm -w test` exits 0 with ≥3 new tests.
- README + architecture doc mention modes accurately.
- Manual smoke: all 5 matrix rows pass.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| New test runtime extends CI | Low | Low | 25-iteration test is fast (<10ms) |
| Doc drift if implementation changes mid-PR | Med | Low | Update docs in same PR as code |

## Security Considerations

None.

## Next Steps / Follow-ups

- **Leaderboard per-mode segmentation** — NOT in scope. If desired later, add `mode` column to `matches` table and filter on read. Tracked as separate ticket.
- **Tournament / best-of-N** — out of scope.
- **Custom match sizes** (arbitrary number) — out of scope; presets only.
