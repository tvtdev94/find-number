import { useLocation } from 'wouter'
import { useGameStore } from '../store/game-store'

export function ResultScreen() {
  const [, setLocation] = useLocation()
  const scores = useGameStore((s) => s.scores)
  const winner = useGameStore((s) => s.matchWinner)
  const youAre = useGameStore((s) => s.youAre)
  const rematch = useGameStore((s) => s.rematch)
  const reset = useGameStore((s) => s.reset)

  const handleExit = () => {
    reset()
    setLocation('/')
  }

  const youWin = winner != null && winner === youAre
  const isDraw = winner == null

  const titleEmoji = youWin ? '🏆' : isDraw ? '🤝' : '👏'
  const titleText = isDraw
    ? 'Hòa rồi!'
    : youAre == null
      ? winner === 'p1'
        ? 'P1 thắng!'
        : 'P2 thắng!'
      : youWin
        ? 'Bạn thắng!'
        : 'Bạn thua'
  const titleColor = youWin
    ? 'text-yellow-300'
    : isDraw
      ? 'text-gray-200'
      : 'text-gray-300'

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-950/90 p-4 backdrop-blur">
      <div className="w-[min(94vw,420px)] rounded-3xl border border-white/10 bg-gray-900/90 p-6 shadow-2xl">
        {/* trophy */}
        <div className="mb-4 flex justify-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full text-5xl ${youWin ? 'animate-bounce bg-yellow-400/15 ring-2 ring-yellow-400/40' : 'bg-white/5 ring-1 ring-white/10'}`}>
            {titleEmoji}
          </div>
        </div>

        <h2 className={`text-center text-3xl font-black ${titleColor}`}>{titleText}</h2>

        {/* score comparison */}
        <div className="mb-6 mt-5 grid grid-cols-3 items-center gap-2">
          <ScorePillar slot="p1" score={scores[0]} winner={winner} />
          <div className="text-center text-2xl font-bold text-gray-600">vs</div>
          <ScorePillar slot="p2" score={scores[1]} winner={winner} />
        </div>

        {/* CTAs */}
        <div className="flex gap-2.5">
          <button
            onClick={rematch}
            className="flex-1 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 py-3 text-base font-bold text-gray-900 shadow-lg shadow-yellow-400/30 transition active:scale-[0.98]"
          >
            🔄 Rematch
          </button>
          <button
            onClick={handleExit}
            className="flex-1 rounded-xl bg-white/10 py-3 text-base font-medium text-gray-200 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98]"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}

function ScorePillar({
  slot,
  score,
  winner,
}: {
  slot: 'p1' | 'p2'
  score: number
  winner: 'p1' | 'p2' | null
}) {
  const isP1 = slot === 'p1'
  const isWinner = winner === slot
  const color = isP1
    ? 'text-red-400 ring-red-500/40'
    : 'text-blue-400 ring-blue-500/40'
  const bg = isWinner
    ? isP1
      ? 'bg-red-500/20'
      : 'bg-blue-500/20'
    : 'bg-white/5'

  return (
    <div className={`flex flex-col items-center rounded-2xl ${bg} px-2 py-4 ring-2 ${isWinner ? color : 'ring-white/10'}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-widest ${isP1 ? 'text-red-400' : 'text-blue-400'}`}>
        {slot.toUpperCase()}
      </div>
      <div className={`my-1 text-4xl font-black tabular-nums ${isP1 ? 'text-red-300' : 'text-blue-300'}`}>
        {score}
      </div>
      {isWinner && <div className="text-xs text-yellow-300">🏆 Winner</div>}
    </div>
  )
}
