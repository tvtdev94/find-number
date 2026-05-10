import type { Player, FoundEntry, PlayerSlot } from './index'

export type ClientMsg =
  | { t: 'join'; roomCode: string; nickname: string; deviceId: string }
  | { t: 'ready' }
  | { t: 'click'; number: number; clientTime: number }
  | { t: 'rematch' }
  | { t: 'ping' }

export type ServerMsg =
  | { t: 'lobby'; players: Player[]; youAre: PlayerSlot }
  | {
      t: 'roundStart'
      round: number
      target: number
      layoutSeed: number
      numbers: number[]
      roundEndsAt: number
    }
  | {
      t: 'roundEnd'
      round: number
      winner: PlayerSlot | null
      correctNumber: number | null
      scores: [number, number]
      found: FoundEntry[]
    }
  | { t: 'matchEnd'; finalScores: [number, number]; winnerSlot: PlayerSlot | null }
  | { t: 'opponentLeft' }
  | { t: 'opponentReconnected' }
  | { t: 'error'; message: string }
  | { t: 'pong' }
  | {
      t: 'snapshot'
      phase: import('./index').Phase
      round: number
      target: number | null
      layoutSeed: number | null
      numbers: number[]
      scores: [number, number]
      found: FoundEntry[]
      players: Player[]
      youAre: PlayerSlot
      roundEndsAt: number | null
    }
