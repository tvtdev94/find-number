import { useState } from 'react'

export function OpponentLeftBanner({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  if (!visible || dismissed) return null
  return (
    <div className="pointer-events-auto absolute left-1/2 top-16 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-orange-500/90 px-4 py-2 text-sm text-white shadow-lg">
      <span>⚠ Opponent disconnected</span>
      <button
        onClick={() => setDismissed(true)}
        className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
      >
        ✕
      </button>
    </div>
  )
}
