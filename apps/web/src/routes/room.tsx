import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { NumberGrid } from '../ui/number-grid'
import { HUD } from '../ui/hud'
import { ResultScreen } from '../ui/result-screen'
import { Lobby } from '../ui/lobby'
import { ConnectionStatus } from '../ui/connection-status'
import { ReconnectModal } from '../ui/reconnect-modal'
import { OpponentLeftBanner } from '../ui/opponent-left-banner'
import { useGameStore } from '../store/game-store'
import { useSettingsStore } from '../store/settings-store'
import { GameSocket, buildWsUrl, type ConnState } from '../net/ws-client'
import { getDeviceId } from '../net/device-id'
import { foundToMap } from '../game/scoring'

export function Room({ code }: { code: string }) {
  const [, setLocation] = useLocation()
  const nickname = useSettingsStore((s) => s.nickname)
  const setServerMode = useGameStore((s) => s.setServerMode)
  const applyServerMsg = useGameStore((s) => s.applyServerMsg)
  const reset = useGameStore((s) => s.reset)

  const phase = useGameStore((s) => s.phase)
  const numbers = useGameStore((s) => s.numbers)
  const target = useGameStore((s) => s.target)
  const found = useGameStore((s) => s.found)
  const click = useGameStore((s) => s.clickNumber)
  const opponentLeft = useGameStore((s) => s.opponentLeft)

  const [connState, setConnState] = useState<ConnState>('idle')
  const sockRef = useRef<GameSocket | null>(null)

  useEffect(() => {
    if (nickname.trim().length < 2) {
      setLocation('/')
    }
  }, [nickname, setLocation])

  useEffect(() => {
    if (nickname.trim().length < 2) return
    let cancelled = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const deviceId = await getDeviceId()
      if (cancelled) return
      const url = buildWsUrl(code, nickname, deviceId)
      const sock = new GameSocket({ url })
      sockRef.current = sock
      const offState = sock.onState(setConnState)
      const offMsg = sock.onMessage(applyServerMsg)
      setServerMode((m) => sock.send(m))
      sock.connect()
      cleanup = () => {
        offState()
        offMsg()
        sock.close()
        reset()
      }
    })()

    return () => {
      cancelled = true
      if (cleanup) cleanup()
    }
  }, [code, nickname, setServerMode, applyServerMsg, reset])

  const foundBy = useMemo(() => foundToMap(found), [found])

  const inGame = phase === 'playing' || phase === 'roundEnd'

  return (
    <div className="relative h-full w-full bg-gray-950">
      {inGame && (
        <>
          <NumberGrid
            numbers={numbers}
            foundBy={foundBy}
            onClickNumber={click}
            disabled={phase !== 'playing'}
          />
          <HUD />
        </>
      )}
      <ConnectionStatus state={connState} />
      <OpponentLeftBanner visible={opponentLeft && phase !== 'matchEnd'} />
      <ReconnectModal visible={connState === 'reconnecting'} />
      {phase === 'lobby' && <Lobby roomCode={code} />}
      {phase === 'matchEnd' && <ResultScreen />}

      {/* Always-visible escape hatch — sits above modal layers */}
      <button
        onClick={() => setLocation('/')}
        aria-label="Back to home"
        className="absolute left-3 z-40 flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-200 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15 active:scale-95"
        style={{ top: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        ← Home
      </button>
    </div>
  )
}
