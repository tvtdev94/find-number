import { useMemo } from 'react'
import { useLocation } from 'wouter'
import { NumberGrid } from '../ui/number-grid'
import { HUD } from '../ui/hud'
import { ResultScreen } from '../ui/result-screen'
import { StartLobby } from '../ui/start-lobby'
import { useGameStore } from '../store/game-store'
import { useLocalRoundRunner } from '../game/round-runner'
import { foundToMap } from '../game/scoring'

export function Practice() {
  const [, setLocation] = useLocation()
  const phase = useGameStore((s) => s.phase)
  const numbers = useGameStore((s) => s.numbers)
  const target = useGameStore((s) => s.target)
  const found = useGameStore((s) => s.found)
  const click = useGameStore((s) => s.clickNumber)

  useLocalRoundRunner()
  const foundBy = useMemo(() => foundToMap(found), [found])

  const inGame = phase === 'playing' || phase === 'roundEnd' || phase === 'lobby'

  return (
    <div className="relative h-full w-full bg-gray-950">
      {inGame && (
        <>
          <NumberGrid
            numbers={numbers}
            foundBy={foundBy}
            onClickNumber={(n) => click(n)}
            disabled={phase !== 'playing'}
          />
          <HUD />
        </>
      )}
      {phase === 'idle' && <StartLobby />}
      {phase === 'matchEnd' && <ResultScreen />}
      <button
        onClick={() => setLocation('/')}
        className="absolute left-2 z-30 rounded-lg bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/15 hover:bg-white/15"
        style={{ bottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        ← Home
      </button>
    </div>
  )
}
