import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { useSettingsStore } from '../store/settings-store'
import { getDeviceId } from '../net/device-id'
import { wsUrl } from '../net/api-base'

type Status = 'connecting' | 'searching' | 'matched' | 'timeout' | 'error'

export function QuickMatchModal({ onClose }: { onClose: () => void }) {
  const [, setLocation] = useLocation()
  const nickname = useSettingsStore((s) => s.nickname)
  const [status, setStatus] = useState<Status>('connecting')
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const deviceId = await getDeviceId()
      if (cancelled) return
      const url = wsUrl(`/api/quickmatch?nickname=${encodeURIComponent(nickname)}&deviceId=${deviceId}`)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setStatus('searching')
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data)
          if (m.t === 'matched') {
            setStatus('matched')
            setLocation(`/r/${m.code}`)
          } else if (m.t === 'timeout') {
            setStatus('timeout')
          }
        } catch {
          /* ignore */
        }
      }
      ws.onerror = () => {
        setStatus('error')
        setError('Connection error')
      }
      ws.onclose = () => {
        if (status === 'searching') setStatus('timeout')
      }
    })()

    return () => {
      cancelled = true
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ t: 'cancel' }))
          wsRef.current.close()
        } catch {
          /* ignore */
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-[min(92vw,360px)] rounded-2xl bg-gray-900/90 p-6 text-center ring-1 ring-white/10">
        <div className="mb-3 text-2xl font-bold">Quick Match</div>
        {status === 'connecting' && <p className="text-gray-400">Connecting…</p>}
        {status === 'searching' && (
          <>
            <div className="my-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-yellow-400" />
            </div>
            <p className="text-gray-300">Searching for opponent…</p>
            <p className="mt-1 text-xs text-gray-500">Up to 60s</p>
          </>
        )}
        {status === 'matched' && <p className="text-green-400">Matched! Joining room…</p>}
        {status === 'timeout' && (
          <>
            <p className="mb-4 text-gray-300">No opponent found.</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 hover:bg-yellow-300"
            >
              Try again
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 px-4 py-2 ring-1 ring-white/15 hover:bg-white/15"
            >
              Close
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="mt-4 block w-full text-xs text-gray-500 hover:text-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
