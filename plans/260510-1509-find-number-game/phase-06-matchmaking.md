# Phase 06: Matchmaking Queue

## Context Links
- Phase 04: GameRoom DO
- Brainstorm: Quick Match flow

## Overview
- **Priority:** Medium
- **Status:** pending
- **Effort:** ~1 day
Implement quick-match: pair 2 random players via queue, auto-create room.

## Key Insights
- Single MatchQueue DO = simplest centralized queue
- Pop 2 → create GameRoom DO → notify both via SSE/WS
- Queue empty → user waits with "Searching..." UI

## Requirements
- `POST /api/quickmatch` enqueue user → returns SSE/WS endpoint or polling token
- When 2 in queue → spawn room → return roomId to both
- Cancel: user navigates away → remove from queue
- Timeout: 60s no match → notify, allow retry

## Architecture

```
apps/worker/src/
├── do/
│   └── match-queue.ts         # MatchQueue DO (singleton)
├── routes/
│   └── quickmatch.ts          # SSE endpoint
```

```
apps/web/src/
├── ui/
│   └── QuickMatchModal.tsx    # Searching... + cancel
```

## Related Code Files
**Create:**
- `apps/worker/src/do/match-queue.ts`
- `apps/worker/src/routes/quickmatch.ts`
- `apps/web/src/ui/QuickMatchModal.tsx`

**Modify:**
- `apps/worker/wrangler.toml` (add MATCH_QUEUE binding)
- `apps/worker/src/index.ts` (mount route, export DO)
- `apps/web/src/routes/Landing.tsx` (Quick Match button → modal)

## Implementation Steps

1. `match-queue.ts` DO singleton (`idFromName('global')`):
   - `state.queue: Array<{deviceId, nickname, ws}>`
   - On WS connect: push, if length ≥ 2 → pop 2, create GameRoom code, send `{t: 'matched', code}` to both, close
   - On WS close: remove from queue
   - 60s alarm: timeout user → send `{t: 'timeout'}`
2. `quickmatch.ts` route: WS upgrade → forward to MatchQueue DO
3. `QuickMatchModal.tsx`: connect WS, show spinner + cancel button, on `matched` navigate to `/r/:code`, on `timeout` show retry
4. Landing button "Quick Match" → open modal
5. Test: 2 browsers click Quick Match simultaneously → both land in same room

## Todo List
- [ ] Implement MatchQueue DO
- [ ] Add quickmatch WS route
- [ ] Update wrangler.toml binding + migration
- [ ] Build QuickMatchModal UI
- [ ] Wire Landing button
- [ ] Test 2-browser match
- [ ] Test cancel + timeout

## Success Criteria
- 2 users hitting Quick Match within 60s pair into same room
- Cancel removes from queue (no orphan)
- Timeout shows retry UI

## Risk Assessment
- **Race condition queue.length check** — Mitigation: DO single-threaded, atomic
- **Stale queue entries on crash** — Mitigation: heartbeat ping, drop after 30s no pong

## Security Considerations
- Rate limit: 1 quickmatch enqueue / 5s per deviceId

## Next Steps
- Phase 07: leaderboard surfacing match results
