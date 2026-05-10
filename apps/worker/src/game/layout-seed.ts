// Mulberry32 PRNG — deterministic given seed.
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

/** Fisher-Yates shuffle. Pure: returns new array, doesn't mutate. */
export function shuffleSeeded<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

/**
 * Re-shuffle only unclaimed numbers; claimed stay in their existing positions.
 * `numbers[slot]` is the value at that grid slot. `found` is the set of claimed values.
 */
export function reshuffleUnclaimed(
  numbers: number[],
  found: Set<number>,
  rand: () => number,
): number[] {
  const next = [...numbers]
  const slots: number[] = []
  for (let i = 0; i < next.length; i++) {
    if (!found.has(next[i]!)) slots.push(i)
  }
  const values = slots.map((s) => next[s]!)
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = values[i]!
    values[i] = values[j]!
    values[j] = tmp
  }
  for (let i = 0; i < slots.length; i++) {
    next[slots[i]!] = values[i]!
  }
  return next
}
