// Seedable PRNG (mulberry32) so server seed produces identical layouts on both clients.
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

export type Vec3 = [number, number, number]

/**
 * Bridson-style Poisson disk sampling in 3D box [-half, half]^3.
 * Falls back to jittered grid if budget exhausted (always returns `count` points).
 * Deterministic given the same seed.
 */
export function poissonPoints3D(
  count: number,
  half: number,
  minDist: number,
  seed: number,
): Vec3[] {
  const rand = mulberry32(seed)
  const points: Vec3[] = []
  const minDistSq = minDist * minDist
  const maxAttemptsPerPoint = 30
  let attempts = 0
  const maxTotalAttempts = count * 200

  while (points.length < count && attempts < maxTotalAttempts) {
    let placed = false
    for (let a = 0; a < maxAttemptsPerPoint; a++) {
      attempts++
      const p: Vec3 = [
        (rand() * 2 - 1) * half,
        (rand() * 2 - 1) * half,
        (rand() * 2 - 1) * half,
      ]
      let ok = true
      for (let i = 0; i < points.length; i++) {
        const q = points[i]!
        const dx = p[0] - q[0]
        const dy = p[1] - q[1]
        const dz = p[2] - q[2]
        if (dx * dx + dy * dy + dz * dz < minDistSq) {
          ok = false
          break
        }
      }
      if (ok) {
        points.push(p)
        placed = true
        break
      }
    }
    if (!placed && attempts >= maxTotalAttempts) break
  }

  // Fallback: fill remaining with jittered grid so we always return `count`
  while (points.length < count) {
    const t = points.length / count
    points.push([
      (rand() * 2 - 1) * half,
      (rand() * 2 - 1) * half,
      (t * 2 - 1) * half * 0.9,
    ])
  }

  return points
}
