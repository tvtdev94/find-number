import { useEffect, useRef } from 'react'
import { GAME_CONFIG } from '@find-number/shared'
import { useGameStore } from '../store/game-store'

/**
 * Drives round transitions in local mode:
 * - lobby → beginRound (after short delay so user sees lobby)
 * - playing: timeout via deadline check
 * - roundEnd → next round (or matchEnd handled by beginRound)
 */
export function useLocalRoundRunner() {
  const phase = useGameStore((s) => s.phase)
  const beginRound = useGameStore((s) => s.beginRound)
  const endRoundOnTimeout = useGameStore((s) => s.endRoundOnTimeout)
  const roundEndsAt = useGameStore((s) => s.roundEndsAt)
  const round = useGameStore((s) => s.round)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    if (phase === 'lobby') {
      const id = window.setTimeout(() => beginRound(), 600)
      return () => clearTimeout(id)
    }
    if (phase === 'roundEnd' && round < GAME_CONFIG.ROUNDS) {
      const id = window.setTimeout(() => beginRound(), 1200)
      return () => clearTimeout(id)
    }
    if (phase === 'roundEnd' && round >= GAME_CONFIG.ROUNDS) {
      const id = window.setTimeout(() => beginRound(), 600) // beginRound triggers matchEnd
      return () => clearTimeout(id)
    }
    return undefined
  }, [phase, round, beginRound])

  useEffect(() => {
    if (phase !== 'playing' || roundEndsAt == null) return
    const tick = () => {
      if (Date.now() >= roundEndsAt) endRoundOnTimeout()
      else tickRef.current = window.setTimeout(tick, 200)
    }
    tickRef.current = window.setTimeout(tick, 200)
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current)
    }
  }, [phase, roundEndsAt, endRoundOnTimeout])
}
