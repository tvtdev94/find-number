import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Vec3 } from '../three/poisson-3d'

type Props = {
  position: Vec3 | null
  enabled: boolean
}

// Lightweight glow: additive sprite + slow pulse. Avoids postprocess on low-end.
export function TargetGlow({ position, enabled }: Props) {
  const ref = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fde047',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const s = 1.4 + Math.sin(t * 3) * 0.25
    m.scale.setScalar(s)
  })

  if (!position || !enabled) return null

  return (
    <mesh ref={ref} position={position} material={material}>
      <sphereGeometry args={[0.6, 16, 12]} />
    </mesh>
  )
}
