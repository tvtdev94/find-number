import { create } from 'zustand'
import {
  GAME_CONFIG,
  type Player,
  type PlayerSlot,
  type ServerMsg,
} from '@find-number/shared'
import type { LocalGameState } from '../game/types'
import { applyHit, decideMatchWinner, pickTarget } from '../game/scoring'

const ALL_NUMBERS = Array.from(
  { length: GAME_CONFIG.RANGE_MAX - GAME_CONFIG.RANGE_MIN + 1 },
  (_, i) => GAME_CONFIG.RANGE_MIN + i,
)

/** Fisher-Yates shuffle. Returns a new array. */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

export type GameMode = 'local' | 'server'

type Extras = {
  mode: GameMode
  players: Player[]
  youAre: PlayerSlot | null
  /** Optional WS sender — set by Room route in server mode */
  send: ((msg: import('@find-number/shared').ClientMsg) => void) | null
  opponentLeft: boolean
}

type Actions = {
  startMatch: (opts?: { alternateSlots?: boolean }) => void
  beginRound: () => void
  clickNumber: (n: number, by?: PlayerSlot) => void
  endRoundOnTimeout: () => void
  rematch: () => void
  reset: () => void
  // server mode
  setServerMode: (sender: NonNullable<Extras['send']>) => void
  setLocalMode: () => void
  applyServerMsg: (msg: ServerMsg) => void
  setLocalReady: () => void
}

type Store = LocalGameState & Extras & Actions

const baseState: LocalGameState & Extras = {
  phase: 'idle',
  round: 0,
  target: null,
  layoutSeed: 1,
  numbers: ALL_NUMBERS,
  scores: [0, 0],
  found: [],
  roundEndsAt: null,
  matchWinner: null,
  alternateSlots: true,
  nextSlot: 'p1',
  mode: 'local',
  players: [],
  youAre: null,
  send: null,
  opponentLeft: false,
}

export const useGameStore = create<Store>((set, get) => ({
  ...baseState,

  // ───── shared ─────
  reset: () => set({ ...baseState, mode: get().mode }),

  // ───── LOCAL MODE ─────
  startMatch: (opts) =>
    set(() => ({
      ...baseState,
      mode: 'local',
      phase: 'lobby',
      layoutSeed: Math.floor(Math.random() * 2 ** 31),
      alternateSlots: opts?.alternateSlots ?? true,
    })),

  beginRound: () => {
    const s = get()
    if (s.mode !== 'local') return
    const target = pickTarget(s.numbers, s.found)
    if (target == null || s.round >= GAME_CONFIG.ROUNDS) {
      const winner = decideMatchWinner(s.scores)
      set({ phase: 'matchEnd', matchWinner: winner, target: null, roundEndsAt: null })
      return
    }
    set({
      phase: 'playing',
      round: s.round + 1,
      target,
      // Reshuffle each round so user must scan, can't memorize positions
      numbers: shuffleArray(ALL_NUMBERS),
      roundEndsAt: Date.now() + GAME_CONFIG.ROUND_TIMEOUT_MS,
    })
  },

  endRoundOnTimeout: () => {
    const s = get()
    if (s.mode !== 'local' || s.phase !== 'playing') return
    set({ phase: 'roundEnd', target: null, roundEndsAt: null })
  },

  rematch: () => {
    const s = get()
    if (s.mode === 'server') {
      s.send?.({ t: 'rematch' })
      return
    }
    set({
      ...baseState,
      mode: 'local',
      phase: 'lobby',
      layoutSeed: s.layoutSeed,
      alternateSlots: s.alternateSlots,
    })
  },

  // Click handler routes based on mode
  clickNumber: (n, by) => {
    const s = get()
    if (s.phase !== 'playing' || s.target == null) return
    if (s.mode === 'server') {
      s.send?.({ t: 'click', number: n, clientTime: Date.now() })
      return
    }
    if (n !== s.target) return
    const slot = by ?? (s.alternateSlots ? s.nextSlot : 'p1')
    const { found, scores } = applyHit(s.found, s.scores, n, slot, s.round)
    set({
      found,
      scores,
      phase: 'roundEnd',
      target: null,
      roundEndsAt: null,
      nextSlot: slot === 'p1' ? 'p2' : 'p1',
    })
  },

  // ───── SERVER MODE ─────
  setServerMode: (sender) => {
    set({ ...baseState, mode: 'server', send: sender, phase: 'lobby' })
  },

  setLocalMode: () => set({ mode: 'local' }),

  setLocalReady: () => {
    const s = get()
    s.send?.({ t: 'ready' })
  },

  applyServerMsg: (msg) => {
    switch (msg.t) {
      case 'lobby':
        set({ phase: 'lobby', players: msg.players, youAre: msg.youAre })
        return
      case 'roundStart':
        set({
          phase: 'playing',
          round: msg.round,
          target: msg.target,
          layoutSeed: msg.layoutSeed,
          numbers: msg.numbers,
          roundEndsAt: msg.roundEndsAt,
        })
        return
      case 'roundEnd':
        set({
          phase: 'roundEnd',
          target: null,
          roundEndsAt: null,
          scores: msg.scores,
          found: msg.found,
        })
        return
      case 'matchEnd':
        set({
          phase: 'matchEnd',
          target: null,
          roundEndsAt: null,
          scores: msg.finalScores,
          matchWinner: msg.winnerSlot,
        })
        return
      case 'opponentLeft':
        set({ opponentLeft: true })
        return
      case 'opponentReconnected':
        set({ opponentLeft: false })
        return
      case 'snapshot':
        set({
          phase: msg.phase === 'matchEnd' ? 'matchEnd' : msg.phase === 'lobby' ? 'lobby' : 'playing',
          round: msg.round,
          target: msg.target,
          layoutSeed: msg.layoutSeed ?? get().layoutSeed,
          numbers: msg.numbers.length > 0 ? msg.numbers : ALL_NUMBERS,
          scores: msg.scores,
          found: msg.found,
          players: msg.players,
          youAre: msg.youAre,
          roundEndsAt: msg.roundEndsAt,
        })
        return
      default:
        return
    }
  },
}))
