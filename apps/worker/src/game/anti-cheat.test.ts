import { describe, expect, it } from 'vitest'
import { RateLimiter } from './anti-cheat'

describe('RateLimiter', () => {
  it('allows up to limit per window', () => {
    const r = new RateLimiter(5)
    let ok = 0
    for (let i = 0; i < 5; i++) if (r.allow(1000 + i)) ok++
    expect(ok).toBe(5)
    expect(r.allow(1004)).toBe(false)
  })

  it('frees slots after window slides', () => {
    const r = new RateLimiter(3)
    for (let i = 0; i < 3; i++) r.allow(1000 + i)
    expect(r.allow(1010)).toBe(false)
    expect(r.allow(2500)).toBe(true)
  })
})
