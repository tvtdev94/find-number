import type { FoundEntry, PlayerSlot } from '@find-number/shared'
import type { FoundByMap } from './types'

/** Pure: pick a target from numbers not yet in `found`. */
export function pickTarget(
  numbers: number[],
  found: FoundEntry[],
  rand: () => number = Math.random,
): number | null {
  const taken = new Set(found.map((f) => f.number))
  const pool = numbers.filter((n) => !taken.has(n))
  if (pool.length === 0) return null
  return pool[Math.floor(rand() * pool.length)]!
}

/** Pure: apply a successful click. Returns new found list + new scores. */
export function applyHit(
  found: FoundEntry[],
  scores: [number, number],
  number: number,
  by: PlayerSlot,
  round: number,
): { found: FoundEntry[]; scores: [number, number] } {
  const entry: FoundEntry = { number, by, round }
  const next: [number, number] = [scores[0], scores[1]]
  if (by === 'p1') next[0] += 1
  else next[1] += 1
  return { found: [...found, entry], scores: next }
}

export function foundToMap(found: FoundEntry[]): FoundByMap {
  const m: FoundByMap = {}
  for (const f of found) m[f.number] = f.by
  return m
}

export function decideMatchWinner(scores: [number, number]): PlayerSlot | null {
  if (scores[0] > scores[1]) return 'p1'
  if (scores[1] > scores[0]) return 'p2'
  return null
}
