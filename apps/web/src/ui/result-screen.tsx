import { useGameStore } from '../store/game-store'

export function ResultScreen() {
  const scores = useGameStore((s) => s.scores)
  const winner = useGameStore((s) => s.matchWinner)
  const rematch = useGameStore((s) => s.rematch)
  const reset = useGameStore((s) => s.reset)

  const title =
    winner === 'p1' ? 'P1 Wins!' : winner === 'p2' ? 'P2 Wins!' : 'Draw'
  const titleColor =
    winner === 'p1' ? 'text-red-400' : winner === 'p2' ? 'text-blue-400' : 'text-gray-200'

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="rounded-2xl bg-gray-900/90 p-8 text-center ring-1 ring-white/10">
        <div className={`mb-3 text-4xl font-black ${titleColor}`}>{title}</div>
        <div className="mb-6 flex items-center justify-center gap-6 text-3xl tabular-nums">
          <span className="text-red-400">{scores[0]}</span>
          <span className="text-gray-500">—</span>
          <span className="text-blue-400">{scores[1]}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={rematch}
            className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-900 hover:bg-yellow-300"
          >
            Rematch
          </button>
          <button
            onClick={reset}
            className="rounded-lg bg-white/10 px-4 py-2 font-medium text-gray-200 ring-1 ring-white/20 hover:bg-white/20"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
