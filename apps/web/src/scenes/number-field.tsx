import { useEffect, useMemo, useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../three/poisson-3d'
import type { PlayerSlot } from '@find-number/shared'

type Props = {
  numbers: number[]
  positions: Vec3[]
  target: number | null
  foundBy: Record<number, PlayerSlot>
  onClickNumber: (n: number) => void
  isTouch?: boolean
}

const COLOR_DEFAULT = new THREE.Color('#e2e8f0')
const COLOR_TARGET = new THREE.Color('#fde047')
const COLOR_P1 = new THREE.Color('#ef4444')
const COLOR_P2 = new THREE.Color('#3b82f6')

export function NumberField({
  numbers,
  positions,
  target,
  foundBy,
  onClickNumber,
  isTouch = false,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const radius = isTouch ? 0.55 : 0.45

  // Set per-instance transforms once per layout change
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]!
      dummy.position.set(p[0], p[1], p[2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [positions, dummy])

  // Update colors when target / foundBy change
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < numbers.length; i++) {
      const n = numbers[i]!
      let c = COLOR_DEFAULT
      const owner = foundBy[n]
      if (owner === 'p1') c = COLOR_P1
      else if (owner === 'p2') c = COLOR_P2
      else if (n === target) c = COLOR_TARGET
      mesh.setColorAt(i, c)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [numbers, target, foundBy])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const id = e.instanceId
    if (id == null) return
    const n = numbers[id]
    if (n != null) onClickNumber(n)
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, numbers.length]}
      onPointerDown={handleClick}
      frustumCulled={false}
    >
      <sphereGeometry args={[radius, 16, 12]} />
      <meshStandardMaterial
        vertexColors
        roughness={0.4}
        metalness={0.1}
        emissive="#000000"
      />
    </instancedMesh>
  )
}
