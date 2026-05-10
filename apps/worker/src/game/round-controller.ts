import { GAME_CONFIG, type FoundEntry, type PlayerSlot } from '@find-number/shared'
import { mulberry32 } from './layout-seed'

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
}

export const ALL_NUMBERS = Array.from(
  { length: GAME_CONFIG.RANGE_MAX - GAME_CONFIG.RANGE_MIN + 1 },
  (_, i) => GAME_CONFIG.RANGE_MIN + i,
)

export function initialRoundState(layoutSeed: number): RoundState {
  return {
    phase: 'lobby',
    round: 0,
    target: null,
    layoutSeed,
    numbers: ALL_NUMBERS,
    scores: [0, 0],
    found: [],
    roundEndsAt: null,
  }
}

/** Pure: advance to next round; if no rounds left → matchEnd */
export function nextRound(s: RoundState, now: number): RoundState {
  if (s.round >= GAME_CONFIG.ROUNDS) {
    return { ...s, phase: 'matchEnd', target: null, roundEndsAt: null }
  }
  const taken = new Set(s.found.map((f) => f.number))
  const pool = s.numbers.filter((n) => !taken.has(n))
  if (pool.length === 0) {
    return { ...s, phase: 'matchEnd', target: null, roundEndsAt: null }
  }
  // Use a fresh PRNG seeded by layoutSeed + round so target picks are deterministic but vary per round
  const rand = mulberry32(s.layoutSeed ^ ((s.round + 1) * 0x9e3779b1))
  const target = pool[Math.floor(rand() * pool.length)]!
  return {
    ...s,
    phase: 'playing',
    round: s.round + 1,
    target,
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
