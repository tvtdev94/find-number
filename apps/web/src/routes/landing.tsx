import { useState } from 'react'
import { useLocation } from 'wouter'
import { useSettingsStore } from '../store/settings-store'
import { useGameStore } from '../store/game-store'
import { createRoom } from '../net/room-api'
import { QuickMatchModal } from '../ui/quick-match-modal'

export function Landing() {
  const [, setLocation] = useLocation()
  const nickname = useSettingsStore((s) => s.nickname)
  const setNickname = useSettingsStore((s) => s.setNickname)
  // startMatch handled by Practice page now
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQuick, setShowQuick] = useState(false)

  const ensureNick = (): string | null => {
    const n = nickname.trim()
    if (n.length < 2) {
      setError('Nickname needs at least 2 characters')
      return null
    }
    return n
  }

  const handleCreate = async () => {
    if (!ensureNick()) return
    setBusy(true)
    setError(null)
    try {
      const r = await createRoom()
      setLocation(`/r/${r.code}`)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const handleJoin = () => {
    if (!ensureNick()) return
    const c = code.trim().toUpperCase()
    if (c.length === 0) return setError('Enter a room code')
    setLocation(`/r/${c}`)
  }

  const handlePractice = () => {
    if (!ensureNick()) return
    setLocation('/practice')
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-[min(94vw,420px)] rounded-2xl bg-gray-900/90 p-6 ring-1 ring-white/10">
        <h1 className="mb-1 text-center text-3xl font-black">Find Number</h1>
        <p className="mb-5 text-center text-sm text-gray-400">1v1 · 3D · race the target</p>

        <label className="mb-1 block text-xs uppercase tracking-widest text-gray-400">
          Nickname
        </label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 20))}
          placeholder="Enter your name"
          className="mb-4 w-full rounded-lg bg-white/5 px-3 py-2 text-base ring-1 ring-white/15 focus:outline-none focus:ring-yellow-400"
        />

        <button
          disabled={busy}
          onClick={handleCreate}
          className="mb-2 w-full rounded-xl bg-yellow-400 py-3 text-lg font-bold text-gray-900 hover:bg-yellow-300 disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create Room'}
        </button>

        <button
          onClick={() => {
            if (ensureNick()) setShowQuick(true)
          }}
          className="mb-2 w-full rounded-xl bg-white/10 py-3 text-base font-semibold text-gray-100 ring-1 ring-white/15 hover:bg-white/15"
        >
          Quick Match
        </button>

        <div className="mb-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 6).toUpperCase())}
            placeholder="ROOM CODE"
            className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center text-base tracking-widest ring-1 ring-white/15 focus:outline-none focus:ring-yellow-400"
          />
          <button
            onClick={handleJoin}
            className="rounded-lg bg-white/10 px-4 text-sm font-semibold text-gray-200 ring-1 ring-white/15 hover:bg-white/15"
          >
            Join
          </button>
        </div>

        <div className="mt-3 flex gap-3">
          <button
            onClick={handlePractice}
            className="flex-1 rounded-lg bg-transparent py-2 text-sm text-gray-400 underline-offset-4 hover:text-gray-200 hover:underline"
          >
            Practice offline
          </button>
          <button
            onClick={() => setLocation('/leaderboard')}
            className="flex-1 rounded-lg bg-transparent py-2 text-sm text-gray-400 underline-offset-4 hover:text-gray-200 hover:underline"
          >
            Leaderboard
          </button>
        </div>

        {error && <div className="mt-3 text-center text-sm text-red-400">{error}</div>}
      </div>
      {showQuick && <QuickMatchModal onClose={() => setShowQuick(false)} />}
    </div>
  )
}
