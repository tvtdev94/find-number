# Phase 05: Multiplayer Integration (Frontend ↔ DO)

## Context Links
- Phase 03: local game store
- Phase 04: GameRoom DO + protocol

## Overview
- **Priority:** Critical
- **Status:** pending
- **Effort:** ~2 days
Replace local game runner with WebSocket-driven state from GameRoom DO. Handle reconnect, lobby UI, opponent presence.

## Key Insights
- Game store đã được thiết kế shape compatible Phase 03 → chỉ swap source
- Layout seed từ server đảm bảo cả 2 cùng layout

## Requirements
- Landing → nickname → "Create Room" or "Join via link"
- `/r/:code` route → connect WS → lobby → game → result
- Layout positions seeded từ server, không tự sample local
- Click → send to server, wait for `roundEnd` server confirmation
- Show opponent online/offline state, reconnect indicator
- Rematch flow

## Architecture

```
apps/web/src/
├── routes/
│   ├── Landing.tsx            # Nickname + create/join
│   ├── Room.tsx               # /r/:code
│   └── router.tsx             # Wouter routes
├── net/
│   ├── ws-client.ts           # Reconnecting WebSocket wrapper
│   ├── room-api.ts            # POST /api/rooms wrapper
│   └── device-id.ts           # FingerprintJS + localStorage
├── store/
│   └── game-store.ts          # MODIFIED: server-driven actions
└── ui/
    ├── Lobby.tsx              # Wait for opponent, ready button
    └── ConnectionStatus.tsx   # Online/reconnecting badge
```

## Related Code Files
**Create:**
- `apps/web/src/routes/Landing.tsx`
- `apps/web/src/routes/Room.tsx`
- `apps/web/src/routes/router.tsx`
- `apps/web/src/net/ws-client.ts`
- `apps/web/src/net/room-api.ts`
- `apps/web/src/net/device-id.ts`
- `apps/web/src/ui/Lobby.tsx`
- `apps/web/src/ui/ConnectionStatus.tsx`

**Modify:**
- `apps/web/src/store/game-store.ts` (server-driven actions)
- `apps/web/src/scenes/NumberField.tsx` (use server layout seed)
- `apps/web/src/three/poisson-3d.ts` (accept seed param)
- `apps/web/src/App.tsx` (mount router)

**Install:** `wouter` (router), `@fingerprintjs/fingerprintjs` (device id)

## Implementation Steps

1. `device-id.ts`: load fingerprint, hash + persist localStorage `fn:deviceId`
2. `ws-client.ts`: wrapper with auto-reconnect (exp backoff 1s/2s/4s/8s), event emitter
3. `room-api.ts`: `createRoom()`, `getRoom(code)` fetch helpers
4. `Landing.tsx`: nickname input + "Create Room" / "Quick Match" / "Join Code" 3 buttons
5. `Room.tsx`: read `:code`, connect WS, render `<Lobby>` or `<GalaxyScene>` by store phase
6. `Lobby.tsx`: show 2 player slots, ready button, share link copy button
7. Modify `game-store.ts`:
   - Remove local timer
   - Add WS message handlers: on `roundStart` set target/seed/round, on `roundEnd` apply found, on `matchEnd` set scores
   - Click action sends `{t: 'click', number, clientTime}` instead of mutating
8. `poisson-3d.ts`: accept seed → deterministic output
9. `NumberField.tsx`: read `layoutSeed` from store, regen on roundStart
10. `ConnectionStatus.tsx`: badge top-left, color by connection state
11. Add router in App.tsx with routes `/`, `/r/:code`
12. Test 2 browsers (one mobile sim) → full match

## Todo List
- [ ] Install wouter + fingerprintjs
- [ ] Build device id helper
- [ ] Build reconnecting WS client
- [ ] Build room API client
- [ ] Build Landing page (nickname + 3 entry options)
- [ ] Build Room page with phase routing
- [ ] Build Lobby UI with share link
- [ ] Refactor game store to server-driven
- [ ] Refactor poisson sampler to seeded
- [ ] Add ConnectionStatus indicator
- [ ] Setup wouter router
- [ ] E2E test 2-browser match

## Success Criteria
- 2 browsers join same room via link → play full 10-round match
- Both see same layout (seed-deterministic)
- Click winner determined by server (test both winning scenarios)
- Network blip → auto-reconnect within 5s, game resumes

## Risk Assessment
- **WS reconnect during round** — Mitigation: server sends snapshot on reconnect
- **Layout mismatch between players** — Mitigation: deterministic seeded sampler, unit test
- **Click latency feels laggy** — Mitigation: optimistic UI ring (gray) until server confirms color

## Security Considerations
- Device fingerprint = anonymous ID, not PII; document in privacy
- WS message validation Zod on both ends

## Next Steps
- Phase 06: matchmaking flow on landing page
- Phase 07: leaderboard write on match end
