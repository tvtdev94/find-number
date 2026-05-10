import { useState } from 'react'
import { useGameStore } from '../store/game-store'

export function Lobby({ roomCode }: { roomCode: string }) {
  const players = useGameStore((s) => s.players)
  const youAre = useGameStore((s) => s.youAre)
  const setReady = useGameStore((s) => s.setLocalReady)
  const [copied, setCopied] = useState(false)

  const youReady = players.find((p) => p.slot === youAre)?.ready ?? false
  const opponent = players.find((p) => p.slot !== youAre)
  const link = `${window.location.origin}/r/${roomCode}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/90 p-4 backdrop-blur">
      <div className="w-[min(94vw,440px)] rounded-3xl border border-white/10 bg-gray-900/90 p-6 shadow-2xl">
        {/* room code with copy */}
        <button
          onClick={copy}
          className="group mb-5 flex w-full flex-col items-center rounded-2xl bg-yellow-400/10 px-4 py-4 ring-1 ring-yellow-400/30 transition hover:bg-yellow-400/15 active:scale-[0.99]"
          aria-label="Copy room code and link"
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest text-yellow-300/80">
            Room Code · tap to copy
          </div>
          <div className="font-mono text-4xl font-black tracking-[0.3em] text-yellow-300">
            {roomCode}
          </div>
          <div className="mt-1 text-xs text-gray-400 transition group-hover:text-gray-200">
            {copied ? '✓ Đã copy link!' : link.replace(/^https?:\/\//, '')}
          </div>
        </button>

        {/* player slots */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <PlayerCard slot="p1" players={players} youAre={youAre} />
          <PlayerCard slot="p2" players={players} youAre={youAre} />
        </div>

        {/* status / CTA */}
        {!opponent ? (
          <div className="flex items-center justify-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-sm text-gray-300 ring-1 ring-white/10">
            <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-400" />
            Đang chờ đối thủ vào phòng…
          </div>
        ) : (
          <button
            onClick={setReady}
            disabled={youReady}
            className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 py-3.5 text-lg font-bold text-gray-900 shadow-lg shadow-yellow-400/30 transition active:scale-[0.98] disabled:bg-gray-700 disabled:bg-none disabled:text-gray-400 disabled:shadow-none"
          >
            {youReady ? '⏳ Đang chờ đối thủ ready…' : '✓ Sẵn sàng!'}
          </button>
        )}
      </div>
    </div>
  )
}

function PlayerCard({
  slot,
  players,
  youAre,
}: {
  slot: 'p1' | 'p2'
  players: { slot: 'p1' | 'p2'; nickname: string; ready: boolean; connected: boolean }[]
  youAre: 'p1' | 'p2' | null
}) {
  const p = players.find((x) => x.slot === slot)
  const isP1 = slot === 'p1'
  const ringColor = isP1 ? 'ring-red-500/50' : 'ring-blue-500/50'
  const textColor = isP1 ? 'text-red-300' : 'text-blue-300'
  const bgColor = isP1 ? 'bg-red-500/10' : 'bg-blue-500/10'
  const initials = p ? p.nickname.slice(0, 2).toUpperCase() : '?'

  return (
    <div className={`rounded-2xl ${bgColor} p-3 ring-1 ${ringColor}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className={`text-[10px] font-semibold uppercase tracking-widest ${textColor}`}>
          {slot.toUpperCase()}{youAre === slot && <span className="ml-1 opacity-60">(you)</span>}
        </div>
        {p?.ready && <span className="text-xs text-green-400">✓</span>}
      </div>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${textColor} bg-black/30`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-100">
            {p?.nickname ?? '—'}
          </div>
          <div className="text-[11px] text-gray-400">
            {p ? (p.ready ? 'ready' : 'chưa sẵn sàng') : 'trống'}
          </div>
        </div>
      </div>
    </div>
  )
}
