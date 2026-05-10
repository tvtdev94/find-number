import type { Env } from '../env'
import type { LeaderboardRow, LeaderboardWindow } from '../db/leaderboard-queries'

const TTL_SECONDS = 60

const key = (w: LeaderboardWindow) => `lb:${w}`

export async function readCached(
  env: Env,
  window: LeaderboardWindow,
): Promise<LeaderboardRow[] | null> {
  try {
    const raw = await env.SESSIONS.get(key(window))
    if (!raw) return null
    return JSON.parse(raw) as LeaderboardRow[]
  } catch {
    return null
  }
}

export async function writeCached(
  env: Env,
  window: LeaderboardWindow,
  rows: LeaderboardRow[],
): Promise<void> {
  try {
    await env.SESSIONS.put(key(window), JSON.stringify(rows), {
      expirationTtl: TTL_SECONDS,
    })
  } catch {
    /* ignore */
  }
}

export async function invalidateAll(env: Env): Promise<void> {
  await Promise.all([
    env.SESSIONS.delete('lb:week'),
    env.SESSIONS.delete('lb:month'),
    env.SESSIONS.delete('lb:year'),
    env.SESSIONS.delete('lb:all'),
  ])
}
