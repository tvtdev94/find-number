import type { FoundEntry, MatchMode, Phase, PlayerSlot } from '@find-number/shared'

export type LocalGameState = {
  phase: Phase
  round: number
  target: number | null
  layoutSeed: number
  numbers: number[]
  scores: [number, number]
  found: FoundEntry[]
  roundEndsAt: number | null
  matchWinner: PlayerSlot | null
  /** Match length preset (server-driven in multiplayer; user-pick in practice) */
  matchMode: MatchMode
  /** Total numbers in the pool — claim all = match end */
  matchSize: number
  /** Grid columns; rows = matchSize / cols */
  cols: number
  /** Phase 03 local-mode: alternate slot per click for visual testing */
  alternateSlots: boolean
  /** Which slot the next correct click belongs to (local mode) */
  nextSlot: PlayerSlot
}

export type FoundByMap = Record<number, PlayerSlot>
