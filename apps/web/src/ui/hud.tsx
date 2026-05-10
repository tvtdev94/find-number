import { useEffect, useState } from 'react'
import { GAME_CONFIG } from '@find-number/shared'
import { useGameStore } from '../store/game-store'

export function HUD() {
  const scores = useGameStore((s) => s.scores)
  const round = useGameStore((s) => s.round)
  const phase = useGameStore((s) => s.phase)
  const roundEndsAt = useGameStore((s) => s.roundEndsAt)
  const [secondsLeft, setSecondsLeft] = useState<number>(0)

  useEffect(() => {
    if (phase !== 'playing' || roundEndsAt == null) {
      setSecondsLeft(0)
      return
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000))
      setSecondsLeft(left)
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => clearInterval(id)
  }, [phase, roundEndsAt])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
      <ScoreBadge slot="p1" score={scores[0]} />
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="rounded-full bg-black/60 px-3 py-1 text-xs ring-1 ring-white/10">
          Round {Math.max(1, round)} / {GAME_CONFIG.ROUNDS}
        </div>
        {phase === 'playing' && (
          <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-yellow-400 transition-[width] duration-200"
              style={{ width: `${(secondsLeft / (GAME_CONFIG.ROUND_TIMEOUT_MS / 1000)) * 100}%` }}
            />
          </div>
        )}
      </div>
      <ScoreBadge slot="p2" score={scores[1]} />
    </div>
  )
}

function ScoreBadge({ slot, score }: { slot: 'p1' | 'p2'; score: number }) {
  const color = slot === 'p1' ? 'text-red-400 ring-red-500/40' : 'text-blue-400 ring-blue-500/40'
  return (
    <div className={`rounded-xl bg-black/60 px-3 py-2 text-center ring-1 backdrop-blur ${color}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">{slot.toUpperCase()}</div>
      <div className="text-2xl font-black tabular-nums">{score}</div>
    </div>
  )
}
