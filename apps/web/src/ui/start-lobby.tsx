import { useGameStore } from '../store/game-store'
import { useSettingsStore } from '../store/settings-store'

export function StartLobby() {
  const startMatch = useGameStore((s) => s.startMatch)
  const alternate = useSettingsStore((s) => s.alternateSlotsLocal)
  const setAlternate = useSettingsStore((s) => s.setAlternateSlots)

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-[min(92vw,360px)] rounded-2xl bg-gray-900/90 p-6 text-center ring-1 ring-white/10">
        <h1 className="mb-1 text-3xl font-black tracking-tight">Find Number</h1>
        <p className="mb-5 text-sm text-gray-400">
          Local practice — multiplayer in next phase
        </p>
        <label className="mb-5 flex items-center justify-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={alternate}
            onChange={(e) => setAlternate(e.target.checked)}
          />
          Alternate P1/P2 (visual test)
        </label>
        <button
          onClick={() => startMatch({ alternateSlots: alternate })}
          className="w-full rounded-xl bg-yellow-400 py-3 text-lg font-bold text-gray-900 hover:bg-yellow-300"
        >
          Start Match
        </button>
      </div>
    </div>
  )
}
