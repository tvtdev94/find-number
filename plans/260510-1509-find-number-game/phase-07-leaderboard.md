# Phase 07: Leaderboard (Week / Month / Year)

## Context Links
- Phase 04: D1 matches table
- User requirement: time-windowed leaderboard

## Overview
- **Priority:** High
- **Status:** pending
- **Effort:** ~1 day
Aggregate matches into win-count + total-score leaderboards by time window. UI tabs for week/month/year/all-time.

## Key Insights
- Aggregate at query time (D1 fast for ≤100K rows)
- KV cache top-50 per window, refresh on match insert
- Time windows in Asia/Bangkok timezone (user locale)

## Requirements
- 4 tabs: This Week / This Month / This Year / All Time
- Top 50 per tab with rank, nickname, wins, total score, win rate
- Update within 60s of match end
- Mobile-friendly table

## Architecture

```
apps/worker/src/
├── routes/
│   └── leaderboard.ts         # GET /api/leaderboard?window=week
├── db/
│   └── leaderboard-queries.ts # Aggregation SQL
├── cache/
│   └── leaderboard-cache.ts   # KV read/write
```

```
apps/web/src/
├── routes/
│   └── Leaderboard.tsx        # /leaderboard
├── ui/
│   ├── LeaderboardTabs.tsx
│   └── LeaderboardTable.tsx
```

## Related Code Files
**Create:**
- `apps/worker/src/routes/leaderboard.ts`
- `apps/worker/src/db/leaderboard-queries.ts`
- `apps/worker/src/cache/leaderboard-cache.ts`
- `apps/web/src/routes/Leaderboard.tsx`
- `apps/web/src/ui/LeaderboardTabs.tsx`
- `apps/web/src/ui/LeaderboardTable.tsx`

**Modify:**
- `apps/worker/src/do/game-room.ts` (invalidate cache after match insert)
- `apps/web/src/routes/router.tsx` (add `/leaderboard` route)
- `apps/web/src/routes/Landing.tsx` (link to leaderboard)

## Implementation Steps

1. `leaderboard-queries.ts`:
   ```sql
   SELECT
     p.id, p.nickname,
     SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) AS wins,
     SUM(CASE WHEN m.p1_id = p.id THEN m.p1_score ELSE m.p2_score END) AS total_score,
     COUNT(*) AS games
   FROM players p
   JOIN matches m ON m.p1_id = p.id OR m.p2_id = p.id
   WHERE m.ended_at >= ?
   GROUP BY p.id
   ORDER BY wins DESC, total_score DESC
   LIMIT 50
   ```
2. Time window calculator: `startOfWeek(now, 'Asia/Bangkok')`, etc.
3. KV cache: key `lb:week`, `lb:month`, `lb:year`, `lb:all` ; TTL 60s
4. `leaderboard.ts` Hono route: parse `window`, check KV, fallback D1 query, write KV
5. On match end (in `game-room.ts`): `env.SESSIONS.delete(['lb:week','lb:month','lb:year','lb:all'])` to invalidate
6. `Leaderboard.tsx`: fetch with TanStack Query, render tabs
7. `LeaderboardTable.tsx`: rank, avatar (initials), nickname, W / Score / WR%, highlight current user

## Todo List
- [ ] Build leaderboard SQL queries
- [ ] Build time window calculator (Asia/Bangkok)
- [ ] Build KV cache wrapper
- [ ] Add leaderboard Hono route
- [ ] Invalidate cache on match end
- [ ] Build Leaderboard route + tabs UI
- [ ] Build LeaderboardTable component
- [ ] Add link from Landing
- [ ] Test with seed data

## Success Criteria
- 4 tabs render correct top 50 per window
- New match shows up within 60s
- Mobile UI readable, scrollable
- Query <100ms (KV hit) / <200ms (cache miss)

## Risk Assessment
- **D1 slow with large match table** — Mitigation: index `(ended_at, winner_id)`, KV cache
- **Timezone bugs at week boundary** — Mitigation: unit test boundary cases

## Security Considerations
- No PII shown beyond nickname
- Rate limit GET /api/leaderboard 30/min/IP

## Next Steps
- Phase 08: polish UX, add to PWA shell
