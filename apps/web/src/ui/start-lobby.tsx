import { useGameStore } from '../store/game-store'
import { useSettingsStore } from '../store/settings-store'
import { ModeSelector } from './mode-selector'

export function StartLobby() {
  const startMatch = useGameStore((s) => s.startMatch)
  const alternate = useSettingsStore((s) => s.alternateSlotsLocal)
  const setAlternate = useSettingsStore((s) => s.setAlternateSlots)
  const practiceMode = useSettingsStore((s) => s.practiceMode)
  const setPracticeMode = useSettingsStore((s) => s.setPracticeMode)

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/90 p-4 backdrop-blur">
      <div className="w-[min(94vw,400px)] rounded-3xl border border-white/10 bg-gray-900/90 p-6 shadow-2xl">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/15 text-3xl ring-1 ring-yellow-400/30">
            🎯
          </div>
        </div>
        <h1 className="text-center text-2xl font-black">Practice Mode</h1>
        <p className="mb-5 mt-1 text-center text-sm text-gray-400">
          Chơi offline — luyện phản xạ
        </p>

        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Độ dài trận
        </div>
        <ModeSelector value={practiceMode} onChange={setPracticeMode} className="mb-4" />

        <div className="mb-4 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Cách chơi
          </div>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>• Banner trên cùng hiện <span className="text-yellow-300 font-semibold">số mục tiêu</span></li>
            <li>• Tap đúng quả số đó → ghi điểm</li>
            <li>• Tìm hết các số trong pool → kết thúc</li>
          </ul>
        </div>

        <label className="mb-5 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <span className="text-sm text-gray-200">Luân phiên P1/P2</span>
          <input
            type="checkbox"
            checked={alternate}
            onChange={(e) => setAlternate(e.target.checked)}
            className="h-4 w-4 accent-yellow-400"
          />
        </label>

        <button
          onClick={() => startMatch({ alternateSlots: alternate, matchMode: practiceMode })}
          className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 py-3.5 text-lg font-bold text-gray-900 shadow-lg shadow-yellow-400/30 transition active:scale-[0.98]"
        >
          ▶ Start Match
        </button>
      </div>
    </div>
  )
}
