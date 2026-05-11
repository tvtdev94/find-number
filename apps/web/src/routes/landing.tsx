import { useState } from 'react'
import { useLocation } from 'wouter'
import { useSettingsStore } from '../store/settings-store'
import { createRoom } from '../net/room-api'
import { QuickMatchModal } from '../ui/quick-match-modal'
import { ModeSelector } from '../ui/mode-selector'

export function Landing() {
  const [, setLocation] = useLocation()
  const nickname = useSettingsStore((s) => s.nickname)
  const setNickname = useSettingsStore((s) => s.setNickname)
  const createRoomMode = useSettingsStore((s) => s.createRoomMode)
  const setCreateRoomMode = useSettingsStore((s) => s.setCreateRoomMode)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQuick, setShowQuick] = useState(false)

  const ensureNick = (): string | null => {
    const n = nickname.trim()
    if (n.length < 2) {
      setError('Nickname cần ≥ 2 ký tự')
      return null
    }
    return n
  }

  const handleCreate = async () => {
    if (!ensureNick()) return
    setBusy(true)
    setError(null)
    try {
      const r = await createRoom(createRoomMode)
      setLocation(`/r/${r.code}`)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const handleJoin = () => {
    if (!ensureNick()) return
    const c = code.trim().toUpperCase()
    if (c.length === 0) return setError('Nhập room code')
    setLocation(`/r/${c}`)
  }

  const handlePractice = () => {
    if (!ensureNick()) return
    setLocation('/practice')
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-950 p-4">
      {/* ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-yellow-400/15 blur-3xl" />
      </div>

      <div className="w-[min(94vw,420px)] rounded-3xl border border-white/10 bg-gray-900/80 p-6 shadow-2xl backdrop-blur-xl">
        {/* hero VS */}
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-lg font-black text-red-400 ring-2 ring-red-500/40">
            P1
          </div>
          <div className="text-2xl font-black text-yellow-300">VS</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-lg font-black text-blue-400 ring-2 ring-blue-500/40">
            P2
          </div>
        </div>

        <h1 className="text-center text-3xl font-black tracking-tight">Find Number</h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          Đua tốc độ — ai bấm số đúng trước thắng
        </p>

        <label htmlFor="nick" className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Nickname
        </label>
        <input
          id="nick"
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 20))}
          placeholder="Tên của bạn"
          maxLength={20}
          autoComplete="nickname"
          className="mb-4 w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/15 transition focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Độ dài trận
        </label>
        <ModeSelector
          value={createRoomMode}
          onChange={setCreateRoomMode}
          className="mb-4"
        />

        <button
          disabled={busy}
          onClick={handleCreate}
          className="mb-2 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 py-3.5 text-lg font-bold text-gray-900 shadow-lg shadow-yellow-400/30 transition hover:shadow-yellow-400/50 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Đang tạo phòng…' : '⚡ Create Room'}
        </button>

        <button
          onClick={() => ensureNick() && setShowQuick(true)}
          className="mb-3 w-full rounded-xl bg-white/10 py-3 text-base font-semibold text-gray-100 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98]"
        >
          🎯 Quick Match
        </button>

        <div className="mb-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 6).toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={6}
            className="flex-1 rounded-xl bg-white/5 px-3 py-2.5 text-center text-base font-mono tracking-widest ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleJoin}
            className="rounded-xl bg-white/10 px-5 text-sm font-semibold text-gray-100 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98]"
          >
            Join
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-xs">
          <button
            onClick={handlePractice}
            className="rounded-md px-3 py-1.5 text-gray-400 transition hover:text-gray-100 hover:underline underline-offset-4"
          >
            Practice
          </button>
          <span className="text-gray-700">·</span>
          <button
            onClick={() => setLocation('/leaderboard')}
            className="rounded-md px-3 py-1.5 text-gray-400 transition hover:text-gray-100 hover:underline underline-offset-4"
          >
            Leaderboard
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300 ring-1 ring-red-500/30">
            {error}
          </div>
        )}
      </div>
      {showQuick && <QuickMatchModal onClose={() => setShowQuick(false)} />}
    </div>
  )
}
