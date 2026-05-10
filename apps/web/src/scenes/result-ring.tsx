import { useMemo } from 'react'
import * as THREE from 'three'
import type { PlayerSlot } from '@find-number/shared'
import type { Vec3 } from '../three/poisson-3d'

type Props = {
  numbers: number[]
  positions: Vec3[]
  foundBy: Record<number, PlayerSlot>
}

const TORUS_GEO = new THREE.TorusGeometry(0.85, 0.08, 8, 32)
const MAT_P1 = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.85 })
const MAT_P2 = new THREE.MeshBasicMaterial({ color: '#3b82f6', transparent: true, opacity: 0.85 })

export function ResultRings({ numbers, positions, foundBy }: Props) {
  const rings = useMemo(() => {
    const out: { idx: number; slot: PlayerSlot }[] = []
    numbers.forEach((n, i) => {
      const slot = foundBy[n]
      if (slot) out.push({ idx: i, slot })
    })
    return out
  }, [numbers, foundBy])

  return (
    <>
      {rings.map(({ idx, slot }) => {
        const p = positions[idx]!
        return (
          <mesh
            key={`${idx}-${slot}`}
            geometry={TORUS_GEO}
            material={slot === 'p1' ? MAT_P1 : MAT_P2}
            position={[p[0], p[1], p[2]]}
          />
        )
      })}
    </>
  )
}
