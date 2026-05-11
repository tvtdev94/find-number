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

## Unreleased (Next Phase)

- Mobile UI refactor: component refinement, adaptive sizing
- Animation enhancements: game state transitions
