---
type: code-review
date: 2026-05-11
slug: match-modes
status: DONE_WITH_CONCERNS
---

# Code Review — Match Length Modes

**Status:** DONE_WITH_CONCERNS
**Summary:** Feature is well-scoped and correctly wired end-to-end. Tests cover all 3 modes; bundle within budget. Two protocol back-compat nits and one minor UX gap noted, none block ship.

## Acceptance — met
- 3-mode round-trip: sprint/quick/classic flow shared → DO → snapshot → grid all wired (verified via `RoundState` carrying matchSize/cols, snapshot includes mode, store back-compat defaults).
- Quick Match locked: `match-queue.ts` hardcodes `QUICK_MATCH_MODE` in both `tryMatch` (line 149) and `fallBackToBot` (line 120). ✓
- Practice mode persist: `settings-store.ts` uses zustand `persist` middleware with merge — missing keys fall back to defaults via the initializer. ✓
- `isMatchMode` guards all 3 untrusted entry points: rooms body (rooms.ts:22), DO query param (game-room.ts:509 + storage load:81), settings setters. ✓
- Forfeit award `this.round.matchSize`: correct — awards the "max possible" final score, matches scale to mode.
- Tile size math on sprint at 360px viewport: ≈65px tiles, above 44px iOS minimum. ✓

## Concerns (non-blocking)

### 1. Protocol type vs back-compat handling (Medium)
`ServerMsg.snapshot` declares `matchSize`/`cols`/`mode` as **required** (protocol.ts:45-47), but `applyServerMsg` defensively defaults them (game-store.ts:247-249) for old servers. TypeScript will accept the `??` since the optional chain narrows correctly at runtime, but the static type lies — a pre-deploy worker sending old snapshot fails the declared contract.

**Fix:** Either mark the 3 fields as optional in `protocol.ts` (`matchSize?: number`), or accept the deploy-order constraint (deploy worker → web) and drop the defensive defaults.

### 2. DO mode reload — race with new `/init` (Low)
On constructor reload (game-room.ts:76-87), if `storedMode` exists and `round.phase === 'lobby'`, room re-inits with that mode. Fine. But `applyMode()` (line 507) only re-inits if phase is lobby — if a host calls `/init?mode=X` *after* match started somehow (shouldn't happen — `/init` is one-shot per room name), persisted mode would drift from active `RoundState.matchSize`. Current call sites are safe; worth a code comment that `/init` must precede any join.

### 3. Mode change visibility in lobby (Low / UX)
When room creator picks mode in landing then shares the code, the joiner has no visual confirmation of the mode in the lobby UI before "Ready". Lobby shows players but not the chosen match length. Not in scope per phase-04 description but flag for follow-up.

### 4. `ALL_NUMBERS` legacy export (Trivial)
`round-controller.ts:25` exports `ALL_NUMBERS` but `Grep` confirms zero consumers in `apps/`. Dead. Safe to delete in a follow-up cleanup.

## Security
No new attack surface. `mode` is whitelisted enum via `isMatchMode` at every boundary. Body parse in `readMode` (rooms.ts:19) swallows JSON errors and falls back to default — safe.

## Positives
- Defensive `applyMode` (idempotent, only re-inits when safe).
- Bot delay constants comment notes pacing — though comment still says "100 targets" (game-room.ts:42); update to "pool" for accuracy.
- `numbersForSize` extracted on both sides (DRY within each app, mirrored).
- Tests use `it.each` to cover all 3 modes — pattern is clean.

## Recommended actions
1. Decide: make snapshot fields optional in protocol (preferred) OR document deploy order.
2. Update bot comment in `game-room.ts:42` ("100 targets" → "pool-size targets").
3. Follow-up: surface chosen mode in lobby UI for joiners.
4. Cleanup pass: remove unused `ALL_NUMBERS` export.

## Unresolved
- Should Quick Match opportunistically pair players whose `createRoomMode` matches, or stay strictly locked? (Plan says strictly locked — confirmed correct for v1.)
