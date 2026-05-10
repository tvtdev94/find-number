import { GAME_CONFIG } from '@find-number/shared'
import { useGameStore } from '../store/game-store'

/**
 * Single-row top HUD:
 *   [P1 score] -- [Round X/N + target] -- [P2 score]
 * No timer bar (per UX feedback — too stressful).
 */
export function HUD() {
  const scores = useGameStore((s) => s.scores)
  const round = useGameStore((s) => s.round)
  const phase = useGameStore((s) => s.phase)
  const target = useGameStore((s) => s.target)
  const youAre = useGameStore((s) => s.youAre)

  const showTarget = phase === 'playing' && target != null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-3 pb-6 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2">
        <ScoreBadge slot="p1" score={scores[0]} you={youAre === 'p1'} />

        <div className="flex flex-col items-center justify-center text-center">
        <div className="text-[10px] uppercase tracking-widest text-gray-400">
          Round {Math.max(1, round)} / {GAME_CONFIG.ROUNDS}
        </div>
        {showTarget && (
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-widest text-gray-300">Find</span>
            <span className="text-3xl font-black tabular-nums text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]">
              {target}
            </span>
          </div>
        )}
        {!showTarget && phase !== 'lobby' && phase !== 'matchEnd' && (
          <div className="mt-0.5 text-xs text-gray-400">—</div>
        )}
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
