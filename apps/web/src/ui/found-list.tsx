import { useGameStore } from '../store/game-store'

export function FoundList() {
  const found = useGameStore((s) => s.found)
  if (found.length === 0) return null
  const recent = found.slice(-8).reverse()

  return (
    <div className="pointer-events-none absolute right-3 top-20 z-10 hidden w-32 flex-col gap-1 rounded-lg bg-black/50 p-2 text-xs ring-1 ring-white/10 backdrop-blur sm:flex">
      <div className="text-[10px] uppercase tracking-widest text-gray-400">Recent</div>
      {recent.map((f) => (
        <div key={`${f.round}-${f.number}`} className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              f.by === 'p1' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          />
          <span className="tabular-nums">{f.number}</span>
          <span className="ml-auto text-[10px] text-gray-500">r{f.round}</span>
        </div>
      ))}
    </div>
  )
}
