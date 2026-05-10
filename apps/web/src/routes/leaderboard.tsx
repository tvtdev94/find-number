import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { apiUrl } from '../net/api-base'

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
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'year', label: 'Năm' },
  { id: 'all', label: 'All time' },
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
    fetch(apiUrl(`/api/leaderboard?window=${tab}`))
      .then((r) => r.json())
      .then((j) => setRows(j.rows ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab])

  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <div className="relative h-full w-full overflow-y-auto bg-gray-950">
      {/* ambient bg */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent" />

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 p-4 pb-10">
        {/* header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            aria-label="Back to home"
            className="flex h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-sm text-gray-200 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98]"
          >
            ← Home
          </button>
          <h1 className="text-xl font-black sm:text-2xl">🏆 Leaderboard</h1>
          <div className="w-16" />
        </div>

        {/* tabs */}
        <div className="flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition sm:text-sm ${
                tab === t.id
                  ? 'bg-yellow-400 text-gray-900 shadow'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-2xl bg-white/5 p-8 text-center text-gray-400 ring-1 ring-white/10">
            Đang tải…
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-500/10 p-4 text-center text-sm text-red-300 ring-1 ring-red-500/30">
            {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
            <div className="mb-2 text-4xl opacity-50">🎮</div>
            <div className="text-sm text-gray-400">Chưa có trận nào trong khoảng này</div>
            <div className="mt-1 text-xs text-gray-500">Chơi 1 trận để lên bảng!</div>
          </div>
        )}

        {/* podium top 3 — order 2nd, 1st, 3rd */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
            <PodiumCard row={top3[1]} medal="🥈" height="min-h-[120px]" />
            <PodiumCard row={top3[0]} medal="🥇" height="min-h-[140px]" highlight />
            <PodiumCard row={top3[2]} medal="🥉" height="min-h-[110px]" />
          </div>
        )}

        {/* rest */}
        {rest.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
            {rest.map((r) => (
              <RankRow key={r.playerId} row={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PodiumCard({
  row,
  medal,
  height,
  highlight,
}: {
  row: Row | undefined
  medal: string
  height: string
  highlight?: boolean
}) {
  if (!row)
    return (
      <div className="flex flex-col items-center">
        <div className={`${height} w-full rounded-xl bg-white/5 ring-1 ring-white/10`} />
      </div>
    )
  const ringClass = highlight
    ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20'
    : 'ring-1 ring-white/10'
  const initials = row.nickname.slice(0, 2).toUpperCase()
  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-2xl">{medal}</div>
      <div
        className={`flex w-full ${height} flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-2 ${ringClass}`}
      >
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-[11px] font-bold text-yellow-300">
          {initials}
        </div>
        <div className="w-full truncate text-center text-xs font-semibold text-gray-100">
          {row.nickname}
        </div>
        <div className="mt-0.5 text-base font-black tabular-nums text-yellow-300">
          {row.wins}W
        </div>
      </div>
    </div>
  )
}

function RankRow({ row }: { row: Row }) {
  const initials = row.nickname.slice(0, 2).toUpperCase()
  const wr = Math.round(row.winRate * 100)
  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5 last:border-b-0">
      <div className="w-6 text-center text-sm font-bold tabular-nums text-gray-500">
        {row.rank}
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-xs font-bold text-gray-300">
        {initials}
      </div>
      <div className="min-w-0 flex-1 truncate text-sm font-medium text-gray-100">
        {row.nickname}
      </div>
      <div className="text-right">
        <div className="text-sm font-bold tabular-nums text-yellow-300">{row.wins}W</div>
        <div className="text-[10px] text-gray-500">{wr}% · {row.games}g</div>
      </div>
    </div>
  )
}
