import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '@find-number/shared'
import {
  applyClick,
  decideMatchWinner,
  initialRoundState,
  nextRound,
  timeoutRound,
} from './round-controller'

describe('initialRoundState', () => {
  it('starts in lobby with full number pool', () => {
    const s = initialRoundState(123)
    expect(s.phase).toBe('lobby')
    expect(s.numbers).toHaveLength(GAME_CONFIG.RANGE_MAX - GAME_CONFIG.RANGE_MIN + 1)
    expect(s.scores).toEqual([0, 0])
    expect(s.found).toEqual([])
  })
})

describe('nextRound', () => {
  it('advances to playing with target picked', () => {
    const s = nextRound(initialRoundState(7), 1000)
    expect(s.phase).toBe('playing')
    expect(s.round).toBe(1)
    expect(s.target).not.toBeNull()
    expect(s.roundEndsAt).toBe(1000 + GAME_CONFIG.ROUND_TIMEOUT_MS)
  })

  it('matchEnd only when all numbers claimed', () => {
    const totalNumbers = GAME_CONFIG.RANGE_MAX - GAME_CONFIG.RANGE_MIN + 1
    let s = initialRoundState(7)
    for (let i = 0; i < totalNumbers; i++) {
      s = nextRound(s, 0)
      expect(s.phase).toBe('playing')
      s = applyClick(s, s.target!, 'p1').state
    }
    s = nextRound(s, 0)
    expect(s.phase).toBe('matchEnd')
  })

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

  it('deterministic target for same seed+round', () => {
    const a = nextRound(initialRoundState(42), 0)
    const b = nextRound(initialRoundState(42), 0)
    expect(a.target).toBe(b.target)
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
