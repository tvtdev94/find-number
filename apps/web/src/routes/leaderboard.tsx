import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'

type Window = 'week' | 'month' | 'year' | 'all'
type Row = {
  rank: number
  playerId: string
  nickname: string
  wins: number
  totalScore: number
  games: number
  winRate: number
}

const TABS: { id: Window; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All' },
]

export function Leaderboard() {
  const [, setLocation] = useLocation()
  const [tab, setTab] = useState<Window>('week')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/leaderboard?window=${tab}`)
      .then((r) => r.json())
      .then((j) => setRows(j.rows ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="mx-auto flex h-full w-[min(94vw,560px)] flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setLocation('/')}
          className="rounded-lg bg-white/10 px-3 py-1 text-sm ring-1 ring-white/15 hover:bg-white/15"
        >
          ← Home
        </button>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="w-16" />
      </div>

      <div className="mb-3 flex gap-1 rounded-xl bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-yellow-400 text-gray-900' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto rounded-xl bg-gray-900/60 ring-1 ring-white/10">
        {loading && <div className="p-6 text-center text-gray-400">Loading…</div>}
        {error && <div className="p-6 text-center text-red-400">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="p-6 text-center text-gray-500">No matches yet</div>
        )}
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900/95 text-xs uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-3 py-2 text-right">W</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2 text-right">WR%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.playerId} className="border-t border-white/5">
                  <td className="px-3 py-2 tabular-nums text-gray-400">{r.rank}</td>
                  <td className="px-3 py-2 font-medium">{r.nickname}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-yellow-300">{r.wins}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.totalScore}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-400">
                    {Math.round(r.winRate * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
