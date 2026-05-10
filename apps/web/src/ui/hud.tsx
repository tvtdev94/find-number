import { GAME_CONFIG } from '@find-number/shared'
import { useGameStore } from '../store/game-store'

const TOTAL_NUMBERS = GAME_CONFIG.RANGE_MAX - GAME_CONFIG.RANGE_MIN + 1

/**
 * Single-row top HUD:
 *   [P1 score] -- [FIND target + N left] -- [P2 score]
 * Match runs until all 100 numbers are claimed.
 */
export function HUD() {
  const scores = useGameStore((s) => s.scores)
  const phase = useGameStore((s) => s.phase)
  const target = useGameStore((s) => s.target)
  const found = useGameStore((s) => s.found)
  const youAre = useGameStore((s) => s.youAre)

  const showTarget = phase === 'playing' && target != null
  const remaining = TOTAL_NUMBERS - found.length

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-3 pb-6 sm:px-5"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
    >
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2">
        <ScoreBadge slot="p1" score={scores[0]} you={youAre === 'p1'} />

        <div className="flex flex-col items-center justify-center text-center">
          {showTarget && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-widest text-gray-300">Find</span>
              <span className="text-3xl font-black tabular-nums text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]">
                {target}
              </span>
            </div>
          )}
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-gray-400">
            {remaining} left
          </div>
        </div>

        <ScoreBadge slot="p2" score={scores[1]} you={youAre === 'p2'} />
      </div>
    </div>
  )
}

function ScoreBadge({
  slot,
  score,
  you,
}: {
  slot: 'p1' | 'p2'
  score: number
  you: boolean
}) {
  const color =
    slot === 'p1'
      ? 'bg-red-500/15 text-red-300 ring-red-500/40'
      : 'bg-blue-500/15 text-blue-300 ring-blue-500/40'
  return (
    <div className={`min-w-[64px] rounded-xl px-3 py-2 text-center ring-1 ${color}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-80">
        {slot.toUpperCase()}
        {you && <span className="ml-1 opacity-60">(you)</span>}
      </div>
      <div className="text-2xl font-black tabular-nums leading-none">{score}</div>
    </div>
  )
}
