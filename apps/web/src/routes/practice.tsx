import { useEffect, useMemo } from 'react'
import { useLocation } from 'wouter'
import { GalaxyScene } from '../scenes/galaxy-scene'
import { TargetBanner } from '../ui/target-banner'
import { HUD } from '../ui/hud'
import { FoundList } from '../ui/found-list'
import { ResultScreen } from '../ui/result-screen'
import { StartLobby } from '../ui/start-lobby'
import { useGameStore } from '../store/game-store'
import { useLocalRoundRunner } from '../game/round-runner'
import { foundToMap } from '../game/scoring'

export function Practice() {
  const [, setLocation] = useLocation()
  const phase = useGameStore((s) => s.phase)
  const mode = useGameStore((s) => s.mode)
  const numbers = useGameStore((s) => s.numbers)
  const layoutSeed = useGameStore((s) => s.layoutSeed)
  const target = useGameStore((s) => s.target)
  const found = useGameStore((s) => s.found)
  const round = useGameStore((s) => s.round)
  const click = useGameStore((s) => s.clickNumber)

  // Bounce to landing if user navigated here without starting
  useEffect(() => {
    if (mode !== 'local' || phase === 'idle') {
      // allow idle so StartLobby shows
    }
  }, [mode, phase, setLocation])

  useLocalRoundRunner()
  const foundBy = useMemo(() => foundToMap(found), [found])

  return (
    <div className="relative h-full w-full">
      <GalaxyScene
        numbers={numbers}
        layoutSeed={layoutSeed}
        target={target}
        foundBy={foundBy}
        onClickNumber={(n) => click(n)}
      />
      {phase !== 'idle' && phase !== 'matchEnd' && (
        <>
          <TargetBanner target={target} round={round} totalRounds={10} />
          <HUD />
          <FoundList />
        </>
      )}
      {phase === 'idle' && <StartLobby />}
      {phase === 'matchEnd' && <ResultScreen />}
      <button
        onClick={() => setLocation('/')}
        className="absolute bottom-3 left-3 z-30 rounded-lg bg-white/10 px-3 py-2 text-xs ring-1 ring-white/15 hover:bg-white/15"
      >
        ← Home
      </button>
    </div>
  )
}
