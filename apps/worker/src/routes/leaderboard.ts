import { Hono } from 'hono'
import type { Env } from '../env'
import {
  fetchLeaderboard,
  type LeaderboardWindow,
} from '../db/leaderboard-queries'
import { readCached, writeCached } from '../cache/leaderboard-cache'

export const leaderboardRoute = new Hono<{ Bindings: Env }>()

const VALID: LeaderboardWindow[] = ['week', 'month', 'year', 'all']

leaderboardRoute.get('/', async (c) => {
  const w = (c.req.query('window') || 'week') as LeaderboardWindow
  if (!VALID.includes(w)) return c.json({ error: 'invalid window' }, 400)

  const cached = await readCached(c.env, w)
  if (cached) {
    return c.json({ window: w, rows: cached, cached: true })
  }
  const rows = await fetchLeaderboard(c.env, w, 50)
  await writeCached(c.env, w, rows)
  return c.json({ window: w, rows, cached: false })
})
