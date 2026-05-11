# Project Changelog

## v0.1.0-phase-1 (2026-05-11) — Design System Foundation

### Added
- **Design Tokens** (`docs/design-tokens.md`): Single-source color palette, shadows, motion keyframes
  - Surfaces: `surface-base`, `surface-raised`, `surface-elev`, `surface-panel` (premium-dark base)
  - Neon accents: yellow, red, blue, green, purple (arcade × premium hybrid)
  - Shadow glows: `shadow-glow-{color}-{size}` utilities
  - CSS keyframes: `pulse-glow`, `spin-fast`, etc. via Tailwind `animate-*`
- **Component Class Layer** (`.fn-*`): Tailwind component classes for consistent UI atoms
- **Dependencies**: `tailwindcss-animate` added (dev)
- **Brand Assets**:
  - `<FindNumberLogo>` React component (SVG-based)
  - Favicon + `theme-color` meta tag (neon-yellow)
- **Tailwind Extension**: Configured design tokens as color utilities, shadows, animations

### Changed
- **styles.css**: Rewrote to use design tokens; deprecated hard-coded hex values
- No behavioral changes; design system is presentation-layer only

### Technical Notes
- Bundle delta: negligible (design tokens are CSS variables, no runtime overhead)
- All unit & E2E tests pass; design system layer is transparent to game logic
- Recommendation: Always consume via `.fn-*` classes or Tailwind utilities, never hard-code colors

---

## v0.2.0 (2026-05-11) — Match-Length Modes

### Added
- **3 match presets** (configurable game length): `sprint` (25, 5×5, ~1min), `quick` (50, 5×10, ~2-3min), `classic` (100, 10×10, ~5-8min)
- `MATCH_MODES`, `MatchMode`, `DEFAULT_MATCH_MODE`, `QUICK_MATCH_MODE`, `isMatchMode()` in `@find-number/shared`
- `ModeSelector` component — 3-button segmented picker with size + duration hint (tap area ≥44px, ARIA radiogroup)
- Mode pickers in Landing (Create Room) and Practice (StartLobby)
- Persisted user preferences: `practiceMode`, `createRoomMode` in settings-store
- 8 new worker tests covering all 3 modes (sprint target-range, matchEnd at variable size)

### Changed
- Grid layout now adapts: cols driven by `cols` from snapshot; max-width scales (5col=420px, 7col=520px, 10col=640px)
- HUD `remaining` uses `store.matchSize` instead of hard-coded 100
- Round controller parameterized by mode; `initialRoundState(seed, mode='classic')`
- Forfeit award fixed: winner gets full pool size (`matchSize`) instead of legacy `GAME_CONFIG.ROUNDS=10`
- Quick Match queue locked to `quick` mode (50) — avoid fragmenting matchmaking
- Bot fallback rooms inherit `quick` mode
- `createRoom(mode?)` and `createBotRoom(mode?)` accept optional mode body

### Protocol
- `ServerMsg.snapshot` extended with optional `matchSize`, `cols`, `mode` (graceful degradation; clients default to classic if absent)

### Technical Notes
- Bundle delta: +1 KB gzip JS, +0.07 KB gzip CSS — under +2 KB budget
- Tests: 23/23 worker, 8/8 web
- DO `mode` persisted to storage; restored on cold start in `blockConcurrencyWhile`
- Backward compatible: existing rooms without mode → classic; pre-deploy clients receive defaults

---

## Unreleased (Next Phase)

- Mobile UI refactor: in-game tile memoization, target-reveal animation (phase 2 of UI plan)
- Per-mode leaderboard segmentation (deferred from match-modes feature)
