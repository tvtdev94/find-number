import { describe, expect, it } from 'vitest'
import { mulberry32, poissonPoints3D } from './poisson-3d'

describe('mulberry32', () => {
  it('is deterministic for same seed', () => {
    const a = mulberry32(123)
    const b = mulberry32(123)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
  })

  it('differs across seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect(a()).not.toBe(b())
  })
})

describe('poissonPoints3D', () => {
  it('returns exactly count points', () => {
    const pts = poissonPoints3D(100, 7, 1.5, 42)
    expect(pts).toHaveLength(100)
  })

  it('is deterministic for same seed', () => {
    const a = poissonPoints3D(50, 7, 1.5, 99)
    const b = poissonPoints3D(50, 7, 1.5, 99)
    expect(a).toEqual(b)
  })

  it('produces points within bounds (allowing fallback)', () => {
    const pts = poissonPoints3D(100, 7, 1.5, 7)
    for (const p of pts) {
      expect(Math.abs(p[0])).toBeLessThanOrEqual(7)
      expect(Math.abs(p[1])).toBeLessThanOrEqual(7)
      expect(Math.abs(p[2])).toBeLessThanOrEqual(7)
    }
  })
})
