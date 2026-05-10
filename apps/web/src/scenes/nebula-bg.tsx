import { useMemo } from 'react'
import * as THREE from 'three'

// Cheap radial gradient nebula on a sky sphere — no postprocess cost.
export function NebulaBg() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        cTop: { value: new THREE.Color('#0b0f1a') },
        cMid: { value: new THREE.Color('#1a1342') },
        cAcc: { value: new THREE.Color('#5a1f7a') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vPos;
        uniform vec3 cTop;
        uniform vec3 cMid;
        uniform vec3 cAcc;
        void main() {
          float h = normalize(vPos).y * 0.5 + 0.5;
          vec3 base = mix(cTop, cMid, smoothstep(0.0, 0.6, h));
          float accent = smoothstep(0.3, 0.55, h) * (1.0 - smoothstep(0.55, 0.85, h));
          base += cAcc * accent * 0.45;
          gl_FragColor = vec4(base, 1.0);
        }
      `,
    })
  }, [])

  return (
    <mesh material={material}>
      <sphereGeometry args={[80, 24, 16]} />
    </mesh>
  )
}
