# Phase 03: Local Game Logic + Scoring

## Context Links
- Brainstorm §4: Game Flow
- Depends: Phase 02

## Overview
- **Priority:** High
- **Status:** pending
- **Effort:** ~1-2 days
Implement single-player simulation of full match: 10 rounds, scoring, color circles, end screen. Acts as offline mode + foundation for multiplayer hookup.

## Key Insights
- Tách game state (Zustand) khỏi rendering — multiplayer chỉ cần thay state source
- Pre-design state shape compatible với server messages (Phase 04)

## Requirements
- Start match → 10 rounds × ~15s timeout
- Each round: pick random target (not yet found), countdown timer
- Click correct → +1 score (P1 by default), ring color, advance to next round
- Click wrong → no penalty, no advance
- Match end → result screen with scores, rematch button
- Local "fake P2" optional toggle for testing color rings

## Architecture

```
apps/web/src/
├── store/
│   ├── game-store.ts          # Zustand: phase, scores, round, target, foundNumbers
│   └── settings-store.ts      # nickname, soundOn, gpuTier
├── game/
│   ├── round-runner.ts        # Round loop, timer, target picker
│   ├── scoring.ts             # Pure functions
│   └── types.ts               # GameState, Round, FoundEntry
├── ui/
│   ├── HUD.tsx                # Scores P1/P2, round counter, timer
│   ├── ResultScreen.tsx       # End match summary
│   ├── FoundList.tsx          # Sidebar: found numbers + colors
│   └── StartLobby.tsx         # Local start button
```

## Related Code Files
**Create:**
- `apps/web/src/store/game-store.ts`
- `apps/web/src/store/settings-store.ts`
- `apps/web/src/game/round-runner.ts`
- `apps/web/src/game/scoring.ts`
- `apps/web/src/game/types.ts`
- `apps/web/src/ui/HUD.tsx`
- `apps/web/src/ui/ResultScreen.tsx`
- `apps/web/src/ui/FoundList.tsx`
- `apps/web/src/ui/StartLobby.tsx`

**Modify:**
- `apps/web/src/App.tsx`
- `apps/web/src/scenes/NumberField.tsx` (subscribe foundNumbers from store)
- `apps/web/src/scenes/ResultRing.tsx` (read color per number)

## Implementation Steps

1. Define types in `types.ts`:
   ```ts
   type Phase = 'idle' | 'lobby' | 'playing' | 'roundEnd' | 'matchEnd'
   type FoundEntry = { number: number; by: 'p1'|'p2'; round: number }
   type GameState = {
     phase: Phase
     round: number          // 1..10
     target: number | null
     scores: [number, number]
     found: FoundEntry[]
     timerEndsAt: number | null
   }
   ```
2. Zustand `game-store.ts` with actions: `startMatch`, `nextRound`, `clickNumber`, `endMatch`, `reset`
3. `round-runner.ts`: setInterval/setTimeout for 15s timer, on expire → `nextRound`
4. `scoring.ts`: pure `applyClick(state, number, by) → state'`
5. `HUD.tsx`: display scores (red P1 left, blue P2 right), round X/10, timer bar
6. `FoundList.tsx`: scrollable list of found entries with color dot
7. `ResultScreen.tsx`: winner banner, final scores, rematch + exit buttons
8. `NumberField.tsx`: read `found` from store, color instance by `by` (red/blue)
9. `App.tsx`: route by `phase` → idle/lobby → playing → matchEnd
10. Local test mode: settings toggle "alternate P1/P2" so testing show both colors

## Todo List
- [ ] Define game types
- [ ] Build Zustand game store with actions
- [ ] Implement round runner + timer
- [ ] Build HUD (scores, round, timer)
- [ ] Build FoundList sidebar
- [ ] Build ResultScreen with rematch
- [ ] Wire NumberField to render found colors
- [ ] Add StartLobby for local-mode entry
- [ ] Test full 10-round flow alone

## Success Criteria
- Click through 10 rounds locally, scores increment, ring colors persist
- Timer auto-advances on miss
- Result screen shows final scores
- Rematch resets state cleanly

## Risk Assessment
- **State coupling with rendering** — Mitigation: Zustand selectors, no re-render storms
- **Timer drift** — Mitigation: use `Date.now()` deadline, not interval count

## Security Considerations
- N/A (offline)

## Next Steps
- Phase 05: replace local round runner with server messages
