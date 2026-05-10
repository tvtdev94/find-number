# Phase 08: PWA + Mobile Polish + Reconnect

## Context Links
- All prior phases

## Overview
- **Priority:** High
- **Status:** pending
- **Effort:** ~1-2 days
PWA install, mobile UX polish, error states, reconnect UX, GPU tier fallback, accessibility basics.

## Requirements
- Installable PWA with icon + splash
- Mobile portrait + landscape responsive
- Reconnect modal with countdown
- Error states: room not found, opponent left, server down
- GPU tier fallback to 2D mode for low-end
- Touch-optimized: tap target ≥44px, no hover-only
- Loading skeletons

## Architecture

```
apps/web/
├── public/
│   ├── manifest.json
│   ├── icon-192.png, icon-512.png
│   └── splash/* (iOS)
├── src/
│   ├── ui/
│   │   ├── ReconnectModal.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── OpponentLeftBanner.tsx
│   ├── scenes/
│   │   └── NumberField2D.tsx  # Fallback canvas 2D
│   └── pwa/
│       └── register-sw.ts
```

## Related Code Files
**Create:**
- `apps/web/public/manifest.json`
- `apps/web/public/icon-{192,512}.png` (assets)
- `apps/web/src/ui/ReconnectModal.tsx`
- `apps/web/src/ui/ErrorBoundary.tsx`
- `apps/web/src/ui/LoadingScreen.tsx`
- `apps/web/src/ui/OpponentLeftBanner.tsx`
- `apps/web/src/scenes/NumberField2D.tsx`
- `apps/web/src/pwa/register-sw.ts`

**Modify:**
- `apps/web/vite.config.ts` (vite-plugin-pwa config)
- `apps/web/index.html` (meta tags, theme color)
- `apps/web/src/App.tsx` (ErrorBoundary wrap)
- `apps/web/src/scenes/GalaxyScene.tsx` (branch 2D vs 3D by GPU tier)
- `apps/web/src/net/ws-client.ts` (emit reconnect events)

## Implementation Steps

1. Configure `vite-plugin-pwa` with manifest, registerType: autoUpdate
2. Generate icon + splash assets (use placeholder tool)
3. Add iOS meta tags in index.html (`apple-mobile-web-app-*`)
4. `ReconnectModal.tsx`: show on WS disconnect, countdown 10s, auto-close on reconnect
5. `OpponentLeftBanner.tsx`: dismissible, shows when peer disconnects mid-match
6. `ErrorBoundary.tsx`: catch React errors → friendly screen + report option
7. `LoadingScreen.tsx`: shown while initial assets/WS connecting
8. `NumberField2D.tsx`: HTML/CSS or Canvas2D fallback for `gpuTier === 'low'`
9. Branch in `GalaxyScene.tsx`: render 2D or 3D
10. Add Tailwind responsive: portrait HUD top, landscape HUD side
11. Tap targets: number sphere `radius >= 0.6` on touch devices
12. Accessibility: `aria-label` on buttons, focus rings, keyboard nav for non-game UI
13. Test on real iOS Safari + Android Chrome

## Todo List
- [ ] Configure vite-plugin-pwa
- [ ] Generate icons + splash assets
- [ ] Add iOS meta tags
- [ ] Build ReconnectModal
- [ ] Build OpponentLeftBanner
- [ ] Build ErrorBoundary + report flow
- [ ] Build LoadingScreen
- [ ] Build NumberField2D fallback
- [ ] Branch 3D/2D by GPU tier
- [ ] Responsive HUD portrait/landscape
- [ ] Accessibility pass
- [ ] Real device test (iOS + Android)

## Success Criteria
- "Add to Home Screen" works on iOS + Android
- Reconnects within 10s after airplane mode toggle
- Low-end Android (e.g., 2GB RAM) playable via 2D fallback
- Lighthouse PWA score ≥ 90
- No JS errors in console during full match

## Risk Assessment
- **iOS PWA quirks** — Mitigation: test on real iOS device, document limitations
- **2D fallback feels worse** — Mitigation: still polished CSS animations

## Security Considerations
- CSP header via Worker
- HTTPS-only (CF default)

## Next Steps
- Phase 09: E2E + production deploy
