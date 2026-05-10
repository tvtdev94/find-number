import { useState } from 'react'
import { useGameStore } from '../store/game-store'

export function Lobby({ roomCode }: { roomCode: string }) {
  const players = useGameStore((s) => s.players)
  const youAre = useGameStore((s) => s.youAre)
  const setReady = useGameStore((s) => s.setLocalReady)
  const [copied, setCopied] = useState(false)

  const youReady = players.find((p) => p.slot === youAre)?.ready ?? false
  const link = `${window.location.origin}/r/${roomCode}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-[min(94vw,420px)] rounded-2xl bg-gray-900/90 p-6 ring-1 ring-white/10">
        <div className="mb-3 text-center">
          <div className="text-xs uppercase tracking-widest text-gray-400">Room Code</div>
          <div className="text-3xl font-black tabular-nums tracking-widest text-yellow-300">
            {roomCode}
          </div>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-2">
          <PlayerSlot slot="p1" players={players} youAre={youAre} />
          <PlayerSlot slot="p2" players={players} youAre={youAre} />
        </div>
        <button
          onClick={copy}
          className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-gray-200 ring-1 ring-white/15 hover:bg-white/15"
        >
          {copied ? 'Copied!' : 'Copy invite link'}
        </button>
        <button
          onClick={setReady}
          disabled={youReady}
          className="w-full rounded-xl bg-yellow-400 py-3 text-lg font-bold text-gray-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
        >
          {youReady ? 'Waiting for opponent…' : 'Ready'}
        </button>
      </div>
    </div>
  )
}

function PlayerSlot({
  slot,
  players,
  youAre,
}: {
  slot: 'p1' | 'p2'
  players: { slot: 'p1' | 'p2'; nickname: string; ready: boolean; connected: boolean }[]
  youAre: 'p1' | 'p2' | null
}) {
  const p = players.find((x) => x.slot === slot)
  const color = slot === 'p1' ? 'border-red-500/50 text-red-300' : 'border-blue-500/50 text-blue-300'
  return (
    <div className={`rounded-lg border-2 ${color} p-3 text-center`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">
        {slot.toUpperCase()} {youAre === slot && '(you)'}
      </div>
      <div className="text-base font-semibold text-gray-100">{p?.nickname ?? 'waiting…'}</div>
      <div className="mt-1 text-xs">
        {p ? (
          p.ready ? (
            <span className="text-green-400">ready</span>
          ) : (
            <span className="text-gray-400">not ready</span>
          )
        ) : (
          <span className="text-gray-500">empty</span>
        )}
      </div>
    </div>
  )
}
