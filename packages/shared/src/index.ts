export const GAME_CONFIG = {
  ROUNDS: 10,
  RANGE_MIN: 1,
  RANGE_MAX: 100,
  ROUND_TIMEOUT_MS: 15_000,
  RECONNECT_GRACE_MS: 10_000,
  MAX_CLICKS_PER_SEC: 10,
  ROOM_CODE_LENGTH: 6,
} as const

/**
 * Match length presets. `size` = total numbers in the pool / claimed-to-finish.
 * `cols` = grid columns (rows derived as size/cols).
 */
export const MATCH_MODES = {
  sprint: { size: 25, cols: 5, label: 'Sprint', durationHint: '~1 min' },
  quick: { size: 50, cols: 5, label: 'Quick', durationHint: '~2–3 min' },
  classic: { size: 100, cols: 10, label: 'Classic', durationHint: '~5–8 min' },
} as const

export type MatchMode = keyof typeof MATCH_MODES

export const DEFAULT_MATCH_MODE: MatchMode = 'classic'
export const QUICK_MATCH_MODE: MatchMode = 'quick'

export function isMatchMode(v: unknown): v is MatchMode {
  return typeof v === 'string' && v in MATCH_MODES
}

export type PlayerSlot = 'p1' | 'p2'
export type Phase = 'idle' | 'lobby' | 'playing' | 'roundEnd' | 'matchEnd'

export type Player = {
  deviceId: string
  nickname: string
  slot: PlayerSlot
  ready: boolean
  connected: boolean
}

export type FoundEntry = {
  number: number
  by: PlayerSlot
  round: number
}

export * from './protocol'
