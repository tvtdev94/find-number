import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { useSettingsStore } from '../store/settings-store'
import { getDeviceId } from '../net/device-id'
import { wsUrl } from '../net/api-base'
import { createBotRoom } from '../net/room-api'

type Status = 'connecting' | 'searching' | 'matched' | 'bot' | 'timeout' | 'error'

const SHOW_BOT_BUTTON_AFTER_MS = 5000

export function QuickMatchModal({ onClose }: { onClose: () => void }) {
  const [, setLocation] = useLocation()
  const nickname = useSettingsStore((s) => s.nickname)
  const [status, setStatus] = useState<Status>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [showBotCta, setShowBotCta] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const deviceId = await getDeviceId()
      if (cancelled) return
      const url = wsUrl(
        `/api/quickmatch?nickname=${encodeURIComponent(nickname)}&deviceId=${deviceId}`,
      )
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setStatus('searching')
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data)
          if (m.t === 'matched') {
            setStatus('matched')
            setLocation(`/r/${m.code}`)
          } else if (m.t === 'bot-match') {
            setStatus('bot')
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
        setError('Lỗi kết nối')
      }
    })()

    const id = setTimeout(() => setShowBotCta(true), SHOW_BOT_BUTTON_AFTER_MS)

    return () => {
      cancelled = true
      clearTimeout(id)
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

  const playBotNow = async () => {
    try {
      // Cancel queue first
      if (wsRef.current) {
        try { wsRef.current.send(JSON.stringify({ t: 'cancel' })) } catch {}
        wsRef.current.close()
      }
      const r = await createBotRoom()
      setStatus('bot')
      setLocation(`/r/${r.code}`)
    } catch (e) {
      setStatus('error')
      setError((e as Error).message)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-950/90 p-4 backdrop-blur">
      <div className="w-[min(94vw,400px)] rounded-3xl border border-white/10 bg-gray-900/90 p-6 text-center shadow-2xl">
        <div className="mb-3 text-2xl font-bold">Quick Match</div>

        {status === 'connecting' && (
          <p className="text-sm text-gray-400">Đang kết nối…</p>
        )}

        {status === 'searching' && (
          <>
            <div className="my-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-yellow-400" />
            </div>
            <p className="text-sm text-gray-300">Đang tìm đối thủ…</p>
            <p className="mt-1 text-xs text-gray-500">Tự động vào trận với bot sau 60s</p>

            {showBotCta && (
              <button
                onClick={playBotNow}
                className="mt-5 w-full rounded-xl bg-yellow-400/15 py-2.5 text-sm font-semibold text-yellow-300 ring-1 ring-yellow-400/40 transition hover:bg-yellow-400/20 active:scale-[0.98]"
              >
                🤖 Chơi với máy ngay
              </button>
            )}
          </>
        )}

        {(status === 'matched' || status === 'bot') && (
          <p className="my-4 text-base text-green-400">
            {status === 'bot' ? '🤖 Vào trận với bot…' : 'Matched! Đang vào phòng…'}
          </p>
        )}

        {status === 'timeout' && (
          <>
            <p className="mb-4 text-sm text-gray-300">Hết giờ, thử lại?</p>
            <button
              onClick={onClose}
              className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-gray-900"
            >
              Đóng
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="mb-4 text-sm text-red-400">{error}</p>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15"
            >
              Đóng
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 block w-full text-xs text-gray-500 hover:text-gray-300"
        >
          Hủy
        </button>
      </div>
    </div>
  )
}
