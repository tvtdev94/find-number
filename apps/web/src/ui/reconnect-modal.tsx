import { useEffect, useState } from 'react'
import { GAME_CONFIG } from '@find-number/shared'

export function ReconnectModal({ visible }: { visible: boolean }) {
  const [secondsLeft, setSecondsLeft] = useState(GAME_CONFIG.RECONNECT_GRACE_MS / 1000)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!visible) {
      setStartedAt(null)
      return
    }
    const start = Date.now()
    setStartedAt(start)
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      setSecondsLeft(Math.max(0, GAME_CONFIG.RECONNECT_GRACE_MS / 1000 - elapsed))
    }, 200)
    return () => clearInterval(id)
  }, [visible])

  if (!visible || startedAt == null) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="w-[min(92vw,360px)] rounded-2xl bg-gray-900/90 p-6 text-center ring-1 ring-white/10">
        <div className="my-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-orange-400" />
        </div>
        <div className="text-lg font-semibold">Connection lost</div>
        <div className="mt-1 text-sm text-gray-400">
          Reconnecting… ({secondsLeft}s grace)
        </div>
      </div>
    </div>
  )
}
