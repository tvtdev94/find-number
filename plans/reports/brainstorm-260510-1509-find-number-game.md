---
type: brainstorm
date: 2026-05-10
slug: find-number-game
status: approved
---

# Brainstorm: Find-Number Game (3D Multiplayer)

## 1. Problem Statement

Game tìm số online 1v1, mobile-first, render 3D galaxy. 100 số rải rác, target ngẫu nhiên, ai bấm trước thắng round. Có leaderboard tuần/tháng/năm, mời chơi qua link hoặc matchmaking ngẫu nhiên, không yêu cầu login.

## 2. Requirements (đã chốt)

### Functional
- 100 số (1-100 hoặc range cấu hình) rải rác trong 3D scene
- Target = số ngẫu nhiên server pick mỗi round
- 1v1 race: ai click đúng trước được điểm + số bị khoanh màu người đó (P1 đỏ, P2 xanh)
- Best of N rounds (mặc định 10), không penalty khi sai
- Highlight target: banner top + pulse glow nhẹ trên target trong scene
- Mời qua link `/r/{roomId}` + room code 6 ký tự
- Quick match (matchmaking ngẫu nhiên)
- Leaderboard: tuần / tháng / năm
- Identity: device fingerprint + nickname (no auth)
- Mobile PWA, touch-optimized

### Non-functional
- 60fps trên mid-range mobile (Android 4GB RAM)
- Latency < 150ms cho race click
- Anti-cheat cơ bản: server arbitration, không trust client
- Reconnect grace 10s

## 3. Approaches Evaluated

### A. Cloudflare Workers + Durable Objects + D1 ✅ CHỌN
**Pros:** Free tier rộng, WebSocket native qua DO, edge gần user, D1 SQLite cho leaderboard, deploy đơn giản.
**Cons:** DO learning curve, D1 còn beta một số feature.

### B. Vercel + Supabase Realtime ❌
**Pros:** Quen thuộc, Postgres mạnh.
**Cons:** Latency cao hơn (proxy qua Supabase), Realtime channels không tối ưu cho race click.

### C. Self-host Node + Socket.io ❌
**Pros:** Full control.
**Cons:** Tốn ops, không serverless, scope lớn hơn.

### Render: Three.js + R3F ✅ vs Babylon.js ❌
Three.js cộng đồng lớn, R3F (React Three Fiber) hợp Stack React, performance tương đương cho scope này.

## 4. Final Architecture

### Stack
```
Frontend:  Vite + React 18 + TypeScript
           React Three Fiber + drei + troika-three-text
           Zustand (state) + Tailwind CSS
           PWA (vite-plugin-pwa)

Backend:   Cloudflare Workers + Hono (HTTP API)
           Durable Objects (1 DO per room, WebSocket)
           D1 (SQLite) - players, matches, leaderboard
           KV - matchmaking queue, session cache

Shared:    TypeScript types (game protocol, events)
```

### Folder Structure
```
find-number/
├── apps/
│   ├── web/                    # Vite + R3F PWA
│   │   ├── src/
│   │   │   ├── scenes/         # Galaxy3DScene, NumberField
│   │   │   ├── game/           # GameClient, ws-handler
│   │   │   ├── ui/             # Lobby, HUD, Leaderboard
│   │   │   └── store/          # Zustand stores
│   │   └── public/manifest.json
│   └── worker/                 # CF Worker
│       ├── src/
│       │   ├── routes/         # Hono routes (REST)
│       │   ├── do/             # GameRoom DO, MatchQueue DO
│       │   ├── db/             # D1 queries
│       │   └── game/           # Game logic, anti-cheat
│       └── wrangler.toml
├── packages/
│   └── shared/                 # Protocol types
├── docs/
└── plans/
```

### Game Flow
```
Landing → Nickname → [Create Room | Quick Match]
                        │              │
                        ▼              ▼
                  Share /r/CODE   MatchQueue DO (KV)
                        │              │
                        └──────┬───────┘
                               ▼
                        GameRoom DO (WS)
                               │
                        Lobby (both ready) → Start
                               │
                  ┌────────────┴────────────┐
                  │  10 rounds × ~15s each  │
                  │  Server picks target    │
                  │  Broadcasts seed/layout │
                  │  First click → score    │
                  └────────────┬────────────┘
                               ▼
                  Result → Submit to D1 leaderboard
                               │
                  Rematch / Exit / Share
```

### 3D Scene Strategy (Galaxy/Space)
- **InstancedMesh** 100 numbers (1 draw call) → mobile 60fps
- **troika-three-text** SDF text (sharp at any zoom)
- **Distribution**: Poisson disk sampling 3D để số không đè
- **Target FX**: emissive material + selective Bloom (off on low-end)
- **Background**: starfield particles (Points + custom shader) + nebula gradient
- **Camera**: gentle auto-orbit 5°/s; tap to focus; pinch zoom on mobile
- **Performance gate**: detect GPU tier (`detect-gpu` lib), fallback no-bloom mode

### Realtime Protocol
```ts
// Client → Server
type ClientMsg =
  | { t: 'join'; roomId: string; nickname: string; deviceId: string }
  | { t: 'ready' }
  | { t: 'click'; number: number; clientTime: number }
  | { t: 'rematch' }

// Server → Client
type ServerMsg =
  | { t: 'lobby'; players: Player[] }
  | { t: 'roundStart'; round: number; target: number; layoutSeed: number; numbers: number[] }
  | { t: 'roundEnd'; winner: 'p1'|'p2'|null; correctClicker: string; scores: [number,number] }
  | { t: 'matchEnd'; finalScores: [number,number]; winnerId: string }
  | { t: 'opponentLeft' }
```

### Anti-Cheat
- Target chỉ tồn tại trong DO server, gửi sau `roundStart` mới broadcast
- Click validation: `serverReceiveTime` quyết định ai trước, không trust client time
- Layout seed từ server → cả 2 cùng layout, fair
- Score ghi từ DO sang D1 server-side, client không submit điểm
- Rate limit: max 10 clicks/s per WS

### D1 Schema
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,           -- device fingerprint hash
  nickname TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  p1_id TEXT NOT NULL,
  p2_id TEXT NOT NULL,
  p1_nickname TEXT NOT NULL,
  p2_nickname TEXT NOT NULL,
  p1_score INTEGER NOT NULL,
  p2_score INTEGER NOT NULL,
  winner_id TEXT,
  ended_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL
);

CREATE INDEX idx_matches_ended_at ON matches(ended_at);
CREATE INDEX idx_matches_winner ON matches(winner_id, ended_at);

-- Leaderboard queries: aggregate winner_id COUNT + score SUM
-- by ended_at >= start_of_week / month / year
```

## 5. Risks & Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| Mobile 3D lag | High | InstancedMesh, conditional bloom, GPU tier detect, fallback 2D mode |
| WS disconnect mid-round | Medium | Auto-reconnect 10s grace, DO holds state |
| Cheat leaderboard | Medium | Server-side score write, device fp + rate limit |
| Number overlap in 3D | Medium | Poisson disk sampling, depth offset |
| Matchmaking empty queue | Low | Show "waiting" + retry, fallback create-link mode |
| D1 cold start latency | Low | Read replicas, KV cache for top leaderboard |

## 6. Success Metrics

- Match start-to-end < 3 phút (10 rounds × ~15s)
- Mobile (Snapdragon 7xx) sustains ≥ 50fps
- Click-to-server roundtrip p95 < 200ms
- Reconnect success rate > 95%
- Leaderboard query < 100ms

## 7. MVP Scope (Full per user choice)

**In:**
- Create room + share link
- Quick match
- 10-round race game with 3D galaxy scene
- Score, target highlight, color circles
- Leaderboard week/month/year
- Device fingerprint identity
- Mobile PWA

**Out (post-MVP):**
- Friends list, chat, emotes
- Custom rounds count/timer
- Tournaments, brackets
- Sound effects (có thể add nhanh nếu thời gian cho phép)
- Native mobile app

## 8. Implementation Phases (preview)

1. **Setup**: Monorepo (pnpm workspaces), Vite app, Worker, D1 schema, deploy hello-world
2. **3D Scene**: Galaxy background, 100 numbers InstancedMesh, target glow, click detection
3. **Game logic local**: Round flow, scoring, color circles (single player simulation)
4. **Backend rooms**: GameRoom DO, WS protocol, lobby, round orchestration
5. **Multiplayer integration**: Hook frontend to DO, sync layout seed, race arbitration
6. **Matchmaking**: MatchQueue DO + KV, quick-match UI
7. **Leaderboard**: D1 queries, weekly/monthly/yearly views, UI
8. **Polish**: PWA, mobile UX, GPU tier fallback, reconnect, error states
9. **Test + Deploy**: E2E with Playwright, deploy CF Pages + Worker

## 9. Next Steps

→ Chạy `/ck:plan` với context của brainstorm này để tạo phase plan chi tiết.

## 10. Unresolved Questions

- Range số: 1-100 hay cho phép custom (vd 1-50, 1-200)?
- Số rounds mặc định: 10 đủ không hay cần option (5/10/15)?
- Có cần sound effects trong MVP không (tăng polish nhưng thêm asset)?
- Mobile gyroscope rotate camera: optional feature post-MVP hay scope MVP?
- Reconnect URL khi share link: deep link tới room hay landing trước?
