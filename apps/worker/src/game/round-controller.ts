import { GAME_CONFIG, MATCH_MODES, type FoundEntry, type MatchMode, type PlayerSlot } from '@find-number/shared'
import { mulberry32, reshuffleUnclaimed, shuffleSeeded } from './layout-seed'

export type RoomPhase = 'lobby' | 'playing' | 'roundEnd' | 'matchEnd'

export type RoundState = {
  phase: RoomPhase
  round: number
  target: number | null
  layoutSeed: number
  numbers: number[]
  scores: [number, number]
  found: FoundEntry[]
  roundEndsAt: number | null
  matchSize: number
  cols: number
}

/** Generate [1..size] number pool. */
export function numbersForSize(size: number): number[] {
  return Array.from({ length: size }, (_, i) => GAME_CONFIG.RANGE_MIN + i)
}

export function initialRoundState(layoutSeed: number, mode: MatchMode = 'classic'): RoundState {
  const m = MATCH_MODES[mode]
  return {
    phase: 'lobby',
    round: 0,
    target: null,
    layoutSeed,
    numbers: numbersForSize(m.size),
    scores: [0, 0],
    found: [],
    roundEndsAt: null,
    matchSize: m.size,
    cols: m.cols,
  }
}

/**
 * Pure: pick the next target. Match ends only when all numbers are claimed.
 * The grid is reshuffled but claimed-tile positions stay locked.
 * On the very first call (s.round == 0), the full grid is shuffled from sorted.
 */
export function nextRound(s: RoundState, now: number): RoundState {
  const pool = numbersForSize(s.matchSize)
  const taken = new Set(s.found.map((f) => f.number))
  const available = pool.filter((n) => !taken.has(n))
  if (available.length === 0) {
    return { ...s, phase: 'matchEnd', target: null, roundEndsAt: null }
  }
  const nextRoundN = s.round + 1
  const targetRand = mulberry32(s.layoutSeed ^ (nextRoundN * 0x9e3779b1))
  const shuffleRand = mulberry32((s.layoutSeed + nextRoundN) ^ 0x85ebca6b)
  const target = available[Math.floor(targetRand() * available.length)]!
  // First call: full shuffle from sorted source. Subsequent: only unclaimed positions move.
  const shuffledNumbers =
    s.round === 0
      ? shuffleSeeded(pool, shuffleRand)
      : reshuffleUnclaimed(s.numbers, taken, shuffleRand)
  return {
    ...s,
    phase: 'playing',
    round: nextRoundN,
    target,
    numbers: shuffledNumbers,
    roundEndsAt: now + GAME_CONFIG.ROUND_TIMEOUT_MS,
  }
}

/** Pure: apply a click attempt. Returns new state + whether it was a hit. */
export function applyClick(
  s: RoundState,
  number: number,
  by: PlayerSlot,
): { state: RoundState; hit: boolean } {
  if (s.phase !== 'playing' || s.target == null) return { state: s, hit: false }
  if (number !== s.target) return { state: s, hit: false }
  const entry: FoundEntry = { number, by, round: s.round }
  const scores: [number, number] =
    by === 'p1' ? [s.scores[0] + 1, s.scores[1]] : [s.scores[0], s.scores[1] + 1]
  return {
    state: {
      ...s,
      phase: 'roundEnd',
      target: null,
      roundEndsAt: null,
      found: [...s.found, entry],
      scores,
    },
    hit: true,
  }
}

/** Pure: timeout on round (no winner). */
export function timeoutRound(s: RoundState): RoundState {
  if (s.phase !== 'playing') return s
  return { ...s, phase: 'roundEnd', target: null, roundEndsAt: null }
}

export function decideMatchWinner(scores: [number, number]): PlayerSlot | null {
  if (scores[0] > scores[1]) return 'p1'
  if (scores[1] > scores[0]) return 'p2'
  return null
}
