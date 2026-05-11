import { describe, expect, it } from 'vitest'
import { GAME_CONFIG, MATCH_MODES, type MatchMode } from '@find-number/shared'
import {
  applyClick,
  decideMatchWinner,
  initialRoundState,
  nextRound,
  timeoutRound,
} from './round-controller'

describe('initialRoundState', () => {
  it('starts in lobby with classic 100-number pool by default', () => {
    const s = initialRoundState(123)
    expect(s.phase).toBe('lobby')
    expect(s.numbers).toHaveLength(MATCH_MODES.classic.size)
    expect(s.matchSize).toBe(100)
    expect(s.cols).toBe(10)
    expect(s.scores).toEqual([0, 0])
    expect(s.found).toEqual([])
  })

  it.each<MatchMode>(['sprint', 'quick', 'classic'])(
    '%s mode: numbers/matchSize/cols match preset',
    (mode) => {
      const m = MATCH_MODES[mode]
      const s = initialRoundState(7, mode)
      expect(s.numbers).toHaveLength(m.size)
      expect(s.matchSize).toBe(m.size)
      expect(s.cols).toBe(m.cols)
    },
  )
})

describe('nextRound', () => {
  it('advances to playing with target picked', () => {
    const s = nextRound(initialRoundState(7), 1000)
    expect(s.phase).toBe('playing')
    expect(s.round).toBe(1)
    expect(s.target).not.toBeNull()
    expect(s.roundEndsAt).toBe(1000 + GAME_CONFIG.ROUND_TIMEOUT_MS)
  })

  it.each<MatchMode>(['sprint', 'quick', 'classic'])(
    'matchEnd only when all numbers claimed (%s)',
    (mode) => {
      let s = initialRoundState(7, mode)
      const total = MATCH_MODES[mode].size
      for (let i = 0; i < total; i++) {
        s = nextRound(s, 0)
        expect(s.phase).toBe('playing')
        s = applyClick(s, s.target!, 'p1').state
      }
      s = nextRound(s, 0)
      expect(s.phase).toBe('matchEnd')
    },
  )

  it('reshuffles only unclaimed positions across rounds', () => {
    let s = nextRound(initialRoundState(11), 0)
    const firstNumbers = [...s.numbers]
    const firstTarget = s.target!
    s = applyClick(s, firstTarget, 'p1').state
    const targetSlot = firstNumbers.indexOf(firstTarget)
    s = nextRound(s, 0)
    // Claimed value still sits in its original slot
    expect(s.numbers[targetSlot]).toBe(firstTarget)
  })

  it('deterministic target for same seed+round+mode', () => {
    const a = nextRound(initialRoundState(42), 0)
    const b = nextRound(initialRoundState(42), 0)
    expect(a.target).toBe(b.target)
  })

  it('sprint mode targets only fall within [1..25]', () => {
    let s = initialRoundState(99, 'sprint')
    for (let i = 0; i < 25; i++) {
      s = nextRound(s, 0)
      expect(s.target).toBeGreaterThanOrEqual(1)
      expect(s.target).toBeLessThanOrEqual(25)
      s = applyClick(s, s.target!, 'p1').state
    }
  })
})

describe('applyClick', () => {
  it('hit on target advances scores and phase', () => {
    const s0 = nextRound(initialRoundState(99), 0)
    const t = s0.target!
    const { state, hit } = applyClick(s0, t, 'p1')
    expect(hit).toBe(true)
    expect(state.scores).toEqual([1, 0])
    expect(state.phase).toBe('roundEnd')
    expect(state.found).toHaveLength(1)
  })

  it('wrong number does not change state', () => {
    const s0 = nextRound(initialRoundState(99), 0)
    const wrong = s0.target! === 1 ? 2 : 1
    const { state, hit } = applyClick(s0, wrong, 'p1')
    expect(hit).toBe(false)
    expect(state).toBe(s0)
  })

  it('click outside playing phase ignored', () => {
    const s0 = initialRoundState(1) // lobby
    const r = applyClick(s0, 5, 'p1')
    expect(r.hit).toBe(false)
  })
})

describe('timeoutRound', () => {
  it('moves playing → roundEnd, no score change', () => {
    const s0 = nextRound(initialRoundState(5), 0)
    const t = timeoutRound(s0)
    expect(t.phase).toBe('roundEnd')
    expect(t.scores).toEqual([0, 0])
  })
})

describe('decideMatchWinner', () => {
  it('picks higher slot or null on tie', () => {
    expect(decideMatchWinner([5, 3])).toBe('p1')
    expect(decideMatchWinner([2, 7])).toBe('p2')
    expect(decideMatchWinner([4, 4])).toBeNull()
  })
})
