import { GAME_CONFIG } from '@find-number/shared'

/** Token-bucket rate limiter per WebSocket. */
export class RateLimiter {
  private timestamps: number[] = []
  private readonly windowMs = 1000
  private readonly limit: number

  constructor(perSec: number = GAME_CONFIG.MAX_CLICKS_PER_SEC) {
    this.limit = perSec
  }

  /** Returns true if allowed, false if rate-limited. */
  allow(now: number = Date.now()): boolean {
    const cutoff = now - this.windowMs
    this.timestamps = this.timestamps.filter((t) => t > cutoff)
    if (this.timestamps.length >= this.limit) return false
    this.timestamps.push(now)
    return true
  }
}
