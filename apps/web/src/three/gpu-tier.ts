import { getGPUTier } from 'detect-gpu'

export type GpuTier = 'low' | 'mid' | 'high'

let cached: GpuTier | null = null

export async function detectTier(): Promise<GpuTier> {
  if (cached) return cached
  try {
    const result = await getGPUTier()
    // detect-gpu returns 0..3 (3 = high)
    if (result.tier >= 3) cached = 'high'
    else if (result.tier === 2) cached = 'mid'
    else cached = 'low'
  } catch {
    cached = 'mid'
  }
  return cached
}

export function getCachedTier(): GpuTier {
  return cached ?? 'mid'
}
