export const GAME_CONFIG = {
  ROUNDS: 10,
  RANGE_MIN: 1,
  RANGE_MAX: 100,
  ROUND_TIMEOUT_MS: 15_000,
  RECONNECT_GRACE_MS: 10_000,
  MAX_CLICKS_PER_SEC: 10,
  ROOM_CODE_LENGTH: 6,
} as const

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
