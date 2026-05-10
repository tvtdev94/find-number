// Mulberry32 PRNG (kept identical to web's poisson-3d.ts so seeded layouts match).
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function newLayoutSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

/**
 * Pick a target from `pool` using the seeded PRNG.
 * `pickIndex` advances independently of seed-derived sequence so caller can vary.
 */
export function pickTargetSeeded(pool: number[], rand: () => number): number | null {
  if (pool.length === 0) return null
  return pool[Math.floor(rand() * pool.length)]!
}
