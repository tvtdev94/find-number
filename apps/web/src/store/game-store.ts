import { create } from 'zustand'
import {
  DEFAULT_MATCH_MODE,
  GAME_CONFIG,
  MATCH_MODES,
  type MatchMode,
  type Player,
  type PlayerSlot,
  type ServerMsg,
} from '@find-number/shared'
import type { LocalGameState } from '../game/types'
import { applyHit, decideMatchWinner, pickTarget } from '../game/scoring'

/** Generate [1..size] number pool. */
function numbersForSize(size: number): number[] {
  return Array.from({ length: size }, (_, i) => GAME_CONFIG.RANGE_MIN + i)
}

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

/** Reshuffle only unclaimed numbers; claimed stay in their grid position. */
function reshuffleUnclaimed(numbers: number[], claimed: Set<number>): number[] {
  const next = [...numbers]
  const slots: number[] = []
  for (let i = 0; i < next.length; i++) {
    if (!claimed.has(next[i]!)) slots.push(i)
  }
  const values = slots.map((s) => next[s]!)
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = values[i]!
    values[i] = values[j]!
    values[j] = tmp
  }
  for (let i = 0; i < slots.length; i++) {
    next[slots[i]!] = values[i]!
  }
  return next
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
  startMatch: (opts?: { alternateSlots?: boolean; matchMode?: MatchMode }) => void
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

const defaultPreset = MATCH_MODES[DEFAULT_MATCH_MODE]

const baseState: LocalGameState & Extras = {
  phase: 'idle',
  round: 0,
  target: null,
  layoutSeed: 1,
  numbers: numbersForSize(defaultPreset.size),
  scores: [0, 0],
  found: [],
  roundEndsAt: null,
  matchWinner: null,
  matchMode: DEFAULT_MATCH_MODE,
  matchSize: defaultPreset.size,
  cols: defaultPreset.cols,
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
  startMatch: (opts) => {
    const matchMode = opts?.matchMode ?? DEFAULT_MATCH_MODE
    const preset = MATCH_MODES[matchMode]
    set(() => ({
      ...baseState,
      mode: 'local',
      phase: 'lobby',
      layoutSeed: Math.floor(Math.random() * 2 ** 31),
      alternateSlots: opts?.alternateSlots ?? true,
      matchMode,
      matchSize: preset.size,
      cols: preset.cols,
      numbers: numbersForSize(preset.size),
    }))
  },

  beginRound: () => {
    const s = get()
    if (s.mode !== 'local') return
    const target = pickTarget(s.numbers, s.found)
    if (target == null) {
      const winner = decideMatchWinner(s.scores)
      set({ phase: 'matchEnd', matchWinner: winner, target: null, roundEndsAt: null })
      return
    }
    const claimed = new Set(s.found.map((f) => f.number))
    const sortedPool = numbersForSize(s.matchSize)
    const nextNumbers =
      s.round === 0 ? shuffleArray(sortedPool) : reshuffleUnclaimed(s.numbers, claimed)
    set({
      phase: 'playing',
      round: s.round + 1,
      target,
      numbers: nextNumbers,
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
    const preset = MATCH_MODES[s.matchMode]
    set({
      ...baseState,
      mode: 'local',
      phase: 'lobby',
      layoutSeed: s.layoutSeed,
      alternateSlots: s.alternateSlots,
      matchMode: s.matchMode,
      matchSize: preset.size,
      cols: preset.cols,
      numbers: numbersForSize(preset.size),
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
      case 'snapshot': {
        // Back-compat: older server may omit these fields → default to classic
        const matchSize = msg.matchSize ?? MATCH_MODES.classic.size
        const cols = msg.cols ?? MATCH_MODES.classic.cols
        const matchMode = msg.mode ?? DEFAULT_MATCH_MODE
        set({
          phase: msg.phase === 'matchEnd' ? 'matchEnd' : msg.phase === 'lobby' ? 'lobby' : 'playing',
          round: msg.round,
          target: msg.target,
          layoutSeed: msg.layoutSeed ?? get().layoutSeed,
          numbers: msg.numbers.length > 0 ? msg.numbers : numbersForSize(matchSize),
          scores: msg.scores,
          found: msg.found,
          players: msg.players,
          youAre: msg.youAre,
          roundEndsAt: msg.roundEndsAt,
          matchMode,
          matchSize,
          cols,
        })
        return
      }
      default:
        return
    }
  },
}))
