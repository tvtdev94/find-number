import type { Env } from '../env'

export type MatchRow = {
  id: string
  p1Id: string
  p2Id: string
  p1Nickname: string
  p2Nickname: string
  p1Score: number
  p2Score: number
  winnerId: string | null
  endedAt: number
  durationMs: number
}

export async function upsertPlayer(env: Env, id: string, nickname: string, now: number) {
  await env.DB.prepare(
    `INSERT INTO players (id, nickname, created_at, last_seen)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET nickname = excluded.nickname, last_seen = excluded.last_seen`,
  )
    .bind(id, nickname, now, now)
    .run()
}

export async function insertMatch(env: Env, m: MatchRow): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO matches (id, p1_id, p2_id, p1_nickname, p2_nickname, p1_score, p2_score, winner_id, ended_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      m.id,
      m.p1Id,
      m.p2Id,
      m.p1Nickname,
      m.p2Nickname,
      m.p1Score,
      m.p2Score,
      m.winnerId,
      m.endedAt,
      m.durationMs,
    )
    .run()
}

export function newMatchId(): string {
  return crypto.randomUUID()
}
