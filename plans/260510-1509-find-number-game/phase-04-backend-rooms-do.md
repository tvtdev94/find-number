# Phase 04: GameRoom Durable Object + WebSocket Protocol

## Context Links
- Brainstorm §4: Realtime Protocol, Anti-Cheat

## Overview
- **Priority:** Critical
- **Status:** pending
- **Effort:** ~2-3 days
Implement GameRoom DO, WebSocket protocol, lobby + round orchestration server-side. Persist match results to D1.

## Key Insights
- 1 DO instance = 1 room = strong consistency
- DO hibernation: use WebSocket Hibernation API (CF) for free-tier durability
- Server quyết winner per round bằng `serverReceiveTime`

## Requirements
- HTTP `POST /api/rooms` create room → returns `{roomId, code}`
- WS `/ws/:roomId?nickname=X&deviceId=Y` connect into DO
- Lobby: wait for 2 players, both `ready` → start
- 10 rounds: server broadcasts target + layout seed, accepts clicks, picks winner
- Match end: write to D1, broadcast result
- Disconnect grace 10s, reconnect resumes

## Architecture

```
apps/worker/src/
├── index.ts                   # Hono entry, routes
├── routes/
│   ├── rooms.ts               # POST /api/rooms, GET /api/rooms/:code
│   └── leaderboard.ts         # (Phase 07)
├── do/
│   ├── game-room.ts           # GameRoom Durable Object
│   └── match-queue.ts         # (Phase 06)
├── game/
│   ├── round-controller.ts    # Server-side round logic
│   ├── layout-seed.ts         # Deterministic layout from seed
│   ├── anti-cheat.ts          # Rate limit, validation
│   └── protocol.ts            # WS message types
└── db/
    ├── schema.ts              # D1 query helpers
    └── matches.ts             # insertMatch, upsertPlayer
```

**packages/shared/src/protocol.ts** (new — sync types web ↔ worker)

## Related Code Files
**Create:**
- `apps/worker/src/do/game-room.ts`
- `apps/worker/src/game/round-controller.ts`
- `apps/worker/src/game/layout-seed.ts`
- `apps/worker/src/game/anti-cheat.ts`
- `apps/worker/src/routes/rooms.ts`
- `apps/worker/src/db/matches.ts`
- `packages/shared/src/protocol.ts`

**Modify:**
- `apps/worker/src/index.ts` (mount routes, expose DO)
- `apps/worker/wrangler.toml` (DO migrations)

## Implementation Steps

1. Define protocol in `packages/shared/src/protocol.ts`:
   ```ts
   export type ClientMsg = ...  // join, ready, click, rematch
   export type ServerMsg = ...  // lobby, roundStart, roundEnd, matchEnd, opponentLeft
   ```
2. `game-room.ts` extends `DurableObject`:
   - `state` props: `players[2]`, `phase`, `round`, `target`, `scores`, `roundEndsAt`, `found[]`
   - `fetch(req)`: handle WS upgrade
   - `webSocketMessage(ws, msg)`: route by `t`
   - `webSocketClose(ws)`: mark player disconnected, 10s grace timer via `state.storage.setAlarm`
3. `round-controller.ts`: pure functions `startRound(state) → state'`, `applyClick(state, number, by, time) → state'`
4. `layout-seed.ts`: PRNG (mulberry32) seeded → list of 100 positions deterministic, pick target from 1-100 not yet found
5. `anti-cheat.ts`: max 10 clicks/sec per WS, drop excess
6. `rooms.ts` Hono routes:
   - `POST /api/rooms` → generate 6-char code, create DO via `idFromName(code)`, return code + roomId
   - `GET /api/rooms/:code` → check exists, return status (waiting/playing/full)
7. `matches.ts`: D1 insert match row + upsert players
8. On `matchEnd`, DO calls `env.DB` to write match
9. WS path `/ws/:roomCode` in `index.ts`: lookup DO via code, forward upgrade
10. DO migrations in `wrangler.toml`:
    ```toml
    [[migrations]]
    tag = "v1"
    new_classes = ["GameRoom"]
    ```
11. Test locally: 2 wscat clients into same room, simulate full match

## Todo List
- [ ] Define WS protocol in shared package
- [ ] Implement GameRoom DO skeleton with WS handler
- [ ] Implement round controller logic (pure)
- [ ] Implement layout seed PRNG
- [ ] Implement anti-cheat rate limiter
- [ ] Add Hono routes for room create/lookup
- [ ] Wire D1 match insert on match end
- [ ] Add DO migrations to wrangler.toml
- [ ] Test 2-client flow with wscat
- [ ] Validate disconnect grace + reconnect

## Success Criteria
- 2 wscat clients can create room, join, play 10 rounds
- D1 `matches` table has row after match
- Disconnect mid-match → 10s grace → reconnect resumes; timeout → forfeit
- Rate limit blocks >10 clicks/sec

## Risk Assessment
- **DO state lost on deploy** — Mitigation: `state.storage` for persistent fields
- **Race condition click resolution** — Mitigation: single-threaded DO + first-arrives-first
- **PRNG predictable** — OK for layout (not security-sensitive); target picked at server time, not from seed

## Security Considerations
- DeviceId trusted from client only for stats — never for auth decisions
- WS messages validated with Zod schema before processing
- Clients cannot send `target` or `score` — server-only

## Next Steps
- Phase 05: connect frontend
- Phase 06: matchmaking sit on top
