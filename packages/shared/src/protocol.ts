import type { Player, FoundEntry, PlayerSlot, MatchMode } from './index'

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
      // Match-length mode (added 2026-05). Optional for graceful degradation
      // when a new client connects to a pre-deploy server. Defaults: classic.
      matchSize?: number
      cols?: number
      mode?: MatchMode
    }
