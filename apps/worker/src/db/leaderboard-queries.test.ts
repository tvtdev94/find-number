import { describe, expect, it } from 'vitest'
import { startOfWindow } from './leaderboard-queries'

const BANGKOK_OFFSET = 7 * 60 * 60 * 1000

function bangkokDate(s: string): number {
  // Treat input as Bangkok local date and convert to UTC ms
  return Date.parse(s + 'Z') - BANGKOK_OFFSET
}

describe('startOfWindow', () => {
  it('all-time returns 0', () => {
    expect(startOfWindow('all')).toBe(0)
  })

  it('year start = Jan 1 Bangkok local', () => {
    const now = bangkokDate('2026-05-10T12:00:00')
    const y = startOfWindow('year', now)
    // Jan 1 2026 00:00 Bangkok = Dec 31 2025 17:00 UTC
    expect(y).toBe(Date.UTC(2026, 0, 1) - BANGKOK_OFFSET)
  })

  it('month start = day 1 Bangkok local', () => {
    const now = bangkokDate('2026-05-10T12:00:00')
    const m = startOfWindow('month', now)
    expect(m).toBe(Date.UTC(2026, 4, 1) - BANGKOK_OFFSET)
  })

  it('week start = Monday Bangkok local', () => {
    // 2026-05-10 is a Sunday — Monday is May 4
    const now = bangkokDate('2026-05-10T12:00:00')
    const w = startOfWindow('week', now)
    expect(w).toBe(Date.UTC(2026, 4, 4) - BANGKOK_OFFSET)
  })

  it('week start handles Monday edge', () => {
    // 2026-05-04 is Monday — start should be itself
    const now = bangkokDate('2026-05-04T12:00:00')
    const w = startOfWindow('week', now)
    expect(w).toBe(Date.UTC(2026, 4, 4) - BANGKOK_OFFSET)
  })
})
