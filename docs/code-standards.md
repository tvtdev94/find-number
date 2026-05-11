# Code Standards

## Design & Styling

### Use Design Tokens, Never Hard-Code Colors

All UI colors must come from the design token system defined in [`docs/design-tokens.md`](./design-tokens.md).

**Rule**: Never hard-code hex values, RGB, or color names in code.

#### Implementation
- **Tailwind utilities** (preferred): `bg-surface-base`, `text-neon-yellow`, `shadow-glow-red-md`
- **Component classes** (`.fn-*`): Tailwind `@apply` classes scoped to game components
- **CSS variables** (fallback): `var(--color-neon-yellow)`, `var(--shadow-glow-blue-lg)`

#### Example
```jsx
// ✅ Correct
<div className="bg-surface-raised rounded border border-neon-yellow/20 shadow-glow-yellow-sm">
  Find {target}
</div>

// ❌ Wrong
<div style={{ backgroundColor: '#0b0f1a', borderColor: '#fde047' }}>
  Find {target}
</div>
```

#### Animations
Use Tailwind animation utilities (`animate-pulse-glow`, `animate-spin-fast`) defined in design tokens. No inline `@keyframes` in component files.

---

## File Organization

- **Frontend**: `apps/web/src/{components,pages,stores,utils}`
- **Backend**: `apps/worker/src/{routes,models,services}`
- **Shared types**: `packages/shared/src/types`
- **Tests**: Colocated with code (`*.test.ts`) or in `tests/{e2e,visual}`

---

## Testing

- **Unit tests**: Vitest, run `pnpm test`
- **E2E tests**: Playwright, run `pnpm test:e2e`
- **Visual regression**: Screenshot snapshots in `tests/visual`

---

## TypeScript

- Strict mode enabled
- No `any` types; use `unknown` with type guards when necessary
- Shared protocol types in `packages/shared/src/types`

---

## Commits & PR Guidelines

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Keep commits focused on single logical changes
- Reference issues in PR body, not commit message
