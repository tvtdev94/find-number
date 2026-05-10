import type { Env } from '../env'

export type LeaderboardWindow = 'week' | 'month' | 'year' | 'all'

export type LeaderboardRow = {
  rank: number
  playerId: string
  nickname: string
  wins: number
  totalScore: number
  games: number
  winRate: number
}

/** Returns the millisecond timestamp at the start of the given window in Asia/Bangkok. */
export function startOfWindow(window: LeaderboardWindow, now: number = Date.now()): number {
  if (window === 'all') return 0
  // Asia/Bangkok = UTC+7, no DST
  const tzOffsetMs = 7 * 60 * 60 * 1000
  const local = new Date(now + tzOffsetMs)
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth()
  const d = local.getUTCDate()
  const dow = local.getUTCDay() // 0 = Sun … 6 = Sat
  if (window === 'year') {
    return Date.UTC(y, 0, 1) - tzOffsetMs
  }
  if (window === 'month') {
    return Date.UTC(y, m, 1) - tzOffsetMs
  }
  // week — Monday as start of week (ISO style)
  const daysFromMonday = (dow + 6) % 7
  return Date.UTC(y, m, d - daysFromMonday) - tzOffsetMs
}

export async function fetchLeaderboard(
  env: Env,
  window: LeaderboardWindow,
  limit: number = 50,
): Promise<LeaderboardRow[]> {
  const since = startOfWindow(window)
  const sql = `
    SELECT
      p.id        AS player_id,
      p.nickname  AS nickname,
      SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN m.p1_id = p.id THEN m.p1_score ELSE m.p2_score END) AS total_score,
      COUNT(*)    AS games
    FROM players p
    JOIN matches m ON m.p1_id = p.id OR m.p2_id = p.id
    WHERE m.ended_at >= ?
    GROUP BY p.id
    ORDER BY wins DESC, total_score DESC, games ASC
    LIMIT ?
  `
  const r = await env.DB.prepare(sql).bind(since, limit).all<{
    player_id: string
    nickname: string
    wins: number
    total_score: number
    games: number
  }>()
  const rows = r.results ?? []
  return rows.map((row, idx) => ({
    rank: idx + 1,
    playerId: row.player_id,
    nickname: row.nickname,
    wins: row.wins,
    totalScore: row.total_score,
    games: row.games,
    winRate: row.games > 0 ? row.wins / row.games : 0,
  }))
}
