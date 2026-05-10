import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import type { Vec3 } from '../three/poisson-3d'

type Props = {
  numbers: number[]
  positions: Vec3[]
  target: number | null
}

// Single Group of billboard texts. drei <Text> uses troika under the hood.
// LOD: hide labels far from camera to keep mobile fps.
export function NumberLabels({ numbers, positions, target }: Props) {
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()

  useEffect(() => {
    let raf = 0
    const update = () => {
      const g = groupRef.current
      if (g) {
        for (let i = 0; i < g.children.length; i++) {
          const child = g.children[i]
          if (!child) continue
          // billboard
          child.lookAt(camera.position)
          // LOD: hide if too far
          const d = child.position.distanceTo(camera.position)
          child.visible = d < 25
        }
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [camera])

  return (
    <group ref={groupRef}>
      {numbers.map((n, i) => {
        const p = positions[i]!
        const isTarget = n === target
        return (
          <Text
            key={n}
            position={[p[0], p[1], p[2] + 0.5]}
            fontSize={isTarget ? 0.55 : 0.42}
            color={isTarget ? '#fde047' : '#f8fafc'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.025}
            outlineColor="#000000"
            outlineOpacity={0.7}
          >
            {n}
          </Text>
        )
      })}
    </group>
  )
}
