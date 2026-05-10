import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { GalaxyScene } from '../scenes/galaxy-scene'
import { TargetBanner } from '../ui/target-banner'
import { HUD } from '../ui/hud'
import { FoundList } from '../ui/found-list'
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
  const layoutSeed = useGameStore((s) => s.layoutSeed)
  const target = useGameStore((s) => s.target)
  const found = useGameStore((s) => s.found)
  const round = useGameStore((s) => s.round)
  const click = useGameStore((s) => s.clickNumber)
  const opponentLeft = useGameStore((s) => s.opponentLeft)

  const [connState, setConnState] = useState<ConnState>('idle')
  const sockRef = useRef<GameSocket | null>(null)

  // No nickname → bounce to landing
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

  return (
    <div className="relative h-full w-full">
      <GalaxyScene
        numbers={numbers}
        layoutSeed={layoutSeed}
        target={target}
        foundBy={foundBy}
        onClickNumber={click}
      />
      <ConnectionStatus state={connState} />
      <OpponentLeftBanner visible={opponentLeft && phase !== 'matchEnd'} />
      <ReconnectModal visible={connState === 'reconnecting'} />
      {phase === 'playing' && (
        <>
          <TargetBanner target={target} round={round} totalRounds={10} />
          <HUD />
          <FoundList />
        </>
      )}
      {phase === 'roundEnd' && (
        <>
          <TargetBanner target={null} round={round} totalRounds={10} />
          <HUD />
          <FoundList />
        </>
      )}
      {phase === 'lobby' && <Lobby roomCode={code} />}
      {phase === 'matchEnd' && <ResultScreen />}
    </div>
  )
}
