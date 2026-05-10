import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../three/poisson-3d'

type Props = { count?: number; radius?: number; seed?: number }

export function Starfield({ count = 1500, radius = 60, seed = 42 }: Props) {
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const rand = mulberry32(seed)
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // uniform on sphere shell
      const u = rand() * 2 - 1
      const theta = rand() * Math.PI * 2
      const r = radius * (0.7 + rand() * 0.3)
      const sq = Math.sqrt(1 - u * u)
      positions[i * 3] = sq * Math.cos(theta) * r
      positions[i * 3 + 1] = u * r
      positions[i * 3 + 2] = sq * Math.sin(theta) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [count, radius, seed])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        color="#cfd8ff"
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  )
}
