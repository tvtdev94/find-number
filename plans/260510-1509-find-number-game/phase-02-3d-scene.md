# Phase 02: 3D Galaxy Scene + 100 Numbers

## Context Links
- Brainstorm §4: 3D Scene Strategy
- Phase 01 must be complete

## Overview
- **Priority:** Critical
- **Status:** pending
- **Effort:** ~2-3 days
Render 100 numbers in 3D galaxy space with target highlight, click detection, color circles. Mobile 60fps target.

## Key Insights
- InstancedMesh = 1 draw call cho 100 numbers → quan trọng cho mobile
- troika-three-text dùng SDF, sharp ở mọi zoom level
- Bloom postprocessing nặng → tắt nếu GPU tier ≤ 1
- Poisson disk sampling tránh số đè nhau

## Requirements
- 100 numbers (1-100) lơ lửng trong space
- Background galaxy: starfield + nebula gradient
- Top banner hiển thị target number to, pulse glow trên target trong scene
- Tap/click number → detect đúng/sai
- Khoanh tròn xanh/đỏ persistent quanh number sau khi found
- Camera auto-orbit nhẹ + pinch zoom mobile
- Adaptive: bloom on/off theo GPU tier

## Architecture

```
apps/web/src/
├── scenes/
│   ├── GalaxyScene.tsx        # Top-level R3F canvas
│   ├── Starfield.tsx          # Particle stars background
│   ├── NebulaBg.tsx           # Gradient shader background
│   ├── NumberField.tsx        # InstancedMesh 100 numbers
│   ├── NumberLabel.tsx        # troika text per number
│   ├── TargetGlow.tsx         # Selective bloom on target
│   └── ResultRing.tsx         # Red/blue circle around found
├── three/
│   ├── poisson-3d.ts          # Distribution sampler
│   ├── gpu-tier.ts            # detect-gpu wrapper
│   └── shaders/
│       └── nebula.glsl        # Background shader
└── ui/
    └── TargetBanner.tsx       # Top "Find: 42" banner
```

## Related Code Files
**Create:**
- `apps/web/src/scenes/GalaxyScene.tsx`
- `apps/web/src/scenes/Starfield.tsx`
- `apps/web/src/scenes/NebulaBg.tsx`
- `apps/web/src/scenes/NumberField.tsx`
- `apps/web/src/scenes/NumberLabel.tsx`
- `apps/web/src/scenes/TargetGlow.tsx`
- `apps/web/src/scenes/ResultRing.tsx`
- `apps/web/src/three/poisson-3d.ts`
- `apps/web/src/three/gpu-tier.ts`
- `apps/web/src/ui/TargetBanner.tsx`

**Modify:**
- `apps/web/src/App.tsx` (mount GalaxyScene)
- `apps/web/package.json` (add `detect-gpu`, `@react-three/postprocessing`)

## Implementation Steps

1. Install: `detect-gpu`, `@react-three/postprocessing`, `troika-three-text`
2. `gpu-tier.ts`: wrapper return `'low' | 'mid' | 'high'`
3. `poisson-3d.ts`: sample 100 points in box `[-8,8]^3` with min distance 1.5
4. `Starfield.tsx`: 2000 Points with custom shader, twinkle animation
5. `NebulaBg.tsx`: full-screen quad with fragment shader gradient
6. `NumberField.tsx`:
   - InstancedMesh sphere (radius 0.4) for 100 spots
   - Per-instance color attribute (default: white)
   - Raycast on pointer event → instanceId → number value
7. `NumberLabel.tsx`: 100 troika text meshes positioned at instances (LOD: hide far ones)
8. `TargetGlow.tsx`: selective bloom via `@react-three/postprocessing` on target mesh only
9. `ResultRing.tsx`: torus geometry, red `#ef4444` or blue `#3b82f6`, animate scale-in
10. `TargetBanner.tsx`: HTML overlay, large number + pulse animation
11. Integrate in `App.tsx`: load scene, set initial target = random
12. Click handler: compare clicked number vs target → set ring color (local mock P1)
13. Performance pass: profile with React DevTools, ensure <16ms frame
14. GPU tier branch: low → no bloom, fewer stars, no nebula shader

## Todo List
- [ ] Install 3D deps
- [ ] Implement Poisson disk sampler
- [ ] Build Starfield + Nebula background
- [ ] Build NumberField with InstancedMesh
- [ ] Add troika text labels with LOD
- [ ] Implement TargetGlow (selective bloom)
- [ ] Implement ResultRing (red/blue)
- [ ] Build TargetBanner UI overlay
- [ ] Wire click → ring placement (local mock)
- [ ] GPU tier detection + adaptive quality
- [ ] Mobile profiling: 60fps on Snapdragon 7-series

## Success Criteria
- 100 numbers visible, no overlap
- Click correct number → blue ring, click wrong → no ring (no penalty per spec)
- Target glows + banner shows
- Mobile 60fps sustained on mid-tier device

## Risk Assessment
- **Mobile lag** — Mitigation: InstancedMesh + adaptive bloom + LOD labels
- **Text legibility 3D space** — Mitigation: troika SDF + billboard option
- **Poisson sampling slow** — Mitigation: pre-compute on first mount, cache by seed

## Security Considerations
- N/A (frontend rendering)

## Next Steps
- Phase 03: add round flow, scoring, multi-target
- Phase 05: replace local mock with server-driven layout seed
