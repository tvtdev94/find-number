import { describe, expect, it } from 'vitest'
import { applyHit, decideMatchWinner, foundToMap, pickTarget } from './scoring'
import type { FoundEntry } from '@find-number/shared'

describe('pickTarget', () => {
  it('picks from numbers not in found', () => {
    const found: FoundEntry[] = [
      { number: 1, by: 'p1', round: 1 },
      { number: 2, by: 'p2', round: 2 },
    ]
    const t = pickTarget([1, 2, 3, 4], found, () => 0)
    expect([3, 4]).toContain(t)
  })

  it('returns null when all taken', () => {
    const found: FoundEntry[] = [
      { number: 1, by: 'p1', round: 1 },
      { number: 2, by: 'p2', round: 2 },
    ]
    expect(pickTarget([1, 2], found)).toBeNull()
  })
})

describe('applyHit', () => {
  it('appends entry and increments correct slot', () => {
    const r = applyHit([], [0, 0], 5, 'p1', 1)
    expect(r.found).toEqual([{ number: 5, by: 'p1', round: 1 }])
    expect(r.scores).toEqual([1, 0])
  })

  it('p2 click increments p2 only', () => {
    const r = applyHit([], [3, 1], 7, 'p2', 4)
    expect(r.scores).toEqual([3, 2])
  })
})

describe('foundToMap', () => {
  it('builds number→slot map', () => {
    const m = foundToMap([
      { number: 5, by: 'p1', round: 1 },
      { number: 9, by: 'p2', round: 2 },
    ])
    expect(m).toEqual({ 5: 'p1', 9: 'p2' })
  })
})

describe('decideMatchWinner', () => {
  it('p1 wins on higher score', () => {
    expect(decideMatchWinner([6, 4])).toBe('p1')
  })
  it('p2 wins on higher score', () => {
    expect(decideMatchWinner([3, 7])).toBe('p2')
  })
  it('null on draw', () => {
    expect(decideMatchWinner([5, 5])).toBeNull()
  })
})
