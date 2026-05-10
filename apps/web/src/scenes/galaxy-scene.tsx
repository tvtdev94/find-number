import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { PlayerSlot } from '@find-number/shared'
import { Starfield } from './starfield'
import { NebulaBg } from './nebula-bg'
import { NumberField } from './number-field'
import { NumberLabels } from './number-label'
import { ResultRings } from './result-ring'
import { TargetGlow } from './target-glow'
import { detectTier, type GpuTier } from '../three/gpu-tier'
import { poissonPoints3D, type Vec3 } from '../three/poisson-3d'

type Props = {
  numbers: number[]
  layoutSeed: number
  target: number | null
  foundBy: Record<number, PlayerSlot>
  onClickNumber: (n: number) => void
}

const FIELD_HALF = 7
const MIN_DIST = 1.6

export function GalaxyScene({ numbers, layoutSeed, target, foundBy, onClickNumber }: Props) {
  const [tier, setTier] = useState<GpuTier>('mid')
  const isTouch =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    detectTier().then(setTier)
  }, [])

  const positions: Vec3[] = poissonPoints3D(numbers.length, FIELD_HALF, MIN_DIST, layoutSeed)
  const targetIdx = target != null ? numbers.indexOf(target) : -1
  const targetPos = targetIdx >= 0 ? positions[targetIdx]! : null

  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 60, near: 0.1, far: 200 }}
      dpr={tier === 'low' ? 1 : Math.min(window.devicePixelRatio, 2)}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#05060d']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      <Suspense fallback={null}>
        {tier !== 'low' && <NebulaBg />}
        <Starfield count={tier === 'low' ? 600 : 1500} />
        <NumberField
          numbers={numbers}
          positions={positions}
          target={target}
          foundBy={foundBy}
          onClickNumber={onClickNumber}
          isTouch={isTouch}
        />
        <NumberLabels numbers={numbers} positions={positions} target={target} />
        <ResultRings numbers={numbers} positions={positions} foundBy={foundBy} />
        <TargetGlow position={targetPos} enabled={tier !== 'low'} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.4}
        minDistance={6}
        maxDistance={28}
      />
    </Canvas>
  )
}
