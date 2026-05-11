# Design Tokens — Find Number

Single-source reference for colors, shadows, motion, and component classes. Consume via Tailwind utilities or `.fn-*` component classes — never hard-code hex values.

Direction: **neon-arcade × premium dark** hybrid. Premium dark base + neon accents on key moments (target reveal, score, winner state).

---

## Color palette

### Surfaces (premium-dark base)
| Token | Hex | Use |
|---|---|---|
| `surface-base` | `#030712` | App background (alias of `gray-950`) |
| `surface-raised` | `#0b0f1a` | Cards, modal panels |
| `surface-elev` | `#13131a` | Inset panels inside cards |
| `surface-panel` | `#1c1c26` | Heaviest elevation (popovers, dropdowns) |

### Neon accents (semantic)
| Token | Hex | Use |
|---|---|---|
| `neon-yellow` | `#fde047` | Target number, primary CTA, brand glow |
| `neon-red` | `#ff3b54` | P1 identity, danger states |
| `neon-blue` | `#3ea0ff` | P2 identity, info states |
| `neon-green` | `#34d399` | Ready/success states |
| `neon-purple` | `#a855f7` | Reserved (special events, future bot variant) |

### Legacy aliases (kept for back-compat)
- `p1` = `#ef4444` — existing code uses `bg-p1` etc.
- `p2` = `#3b82f6` — same

---

## Shadows / Glows

Each color has 3 levels — apply via `shadow-glow-{color}-{size}`.

| Token | Use |
|---|---|
| `shadow-glow-yellow-sm/md/lg` | Active CTA, focused target |
| `shadow-glow-red-sm/md/lg` | P1 actions, claim animation |
| `shadow-glow-blue-sm/md/lg` | P2 actions, claim animation |

---

## Motion language

All animations are CSS keyframes. Compose via Tailwind `animate-*`. No JS animation libs.

| Animation | Duration | Purpose |
|---|---|---|
| `animate-tile-pop` | 200ms ease-out | Tap feedback on grid tile |
| `animate-tile-claim-p1` | 420ms back-out | P1 wins a number (red glow burst) |
| `animate-tile-claim-p2` | 420ms back-out | P2 wins a number (blue glow burst) |
| `animate-target-reveal` | 380ms back-out | New target number appears in HUD |
| `animate-score-bump` | 360ms ease-out | Score increments |
| `animate-fade-in-up` | 280ms ease-out | Generic entrance |
| `animate-pulse-glow` | 1.8s loop | Waiting/idle hint (room code, ready) |
| `animate-stagger-in` | 320ms ease-out backwards | Children of a modal/list — set `animation-delay` per item |

Plus `tailwindcss-animate` plugin classes: `animate-in`, `slide-in-from-bottom-4`, etc.

---

## Component classes (`.fn-*`)

Defined in `src/styles.css` under `@layer components`. Compose with Tailwind utilities as needed.

| Class | Equivalent | When to use |
|---|---|---|
| `.fn-card` | rounded-3xl + dark bg + border + shadow + blur | Modal panels, prominent cards |
| `.fn-card-elev` | rounded-2xl + lighter bg + border | Inset cards inside `.fn-card` |
| `.fn-modal-backdrop` | absolute inset-0 + dark blur | Modal overlay container |
| `.fn-modal-panel` | width-clamped panel with `animate-stagger-in` | Modal panel content |
| `.fn-btn-primary` | yellow gradient + glow + min-h 48px | Hero CTA (Create Room, Ready, Start) |
| `.fn-btn-ghost` | white/10 + ring + min-h 44px | Secondary actions (Join, Exit, Practice) |
| `.fn-btn-danger` | red bg + min-h 44px | Destructive (Give up, Cancel match) |
| `.fn-tile` | aspect-square + ring + transition | Grid tile base (phase 2 expands) |
| `.fn-glow-text-{yellow,red,blue}` | colored + text-shadow | Target number, scores, winner labels |
| `.fn-label` | text-[10px] uppercase tracking-widest | Section labels (`ROOM CODE`, `P1`) |

---

## Tap targets

iOS HIG = 44 pt minimum. Material = 48 dp. All interactive elements **must** meet this.

- `.fn-btn-primary` → 48px+
- `.fn-btn-ghost` / `.fn-btn-danger` → 44px+
- Grid tiles → use invisible padding wrapper to expand hit area (phase 2)
- Icon buttons → wrap with `min-h-[44px] min-w-[44px]` flex container

---

## Typography

- Font stack: `Inter` (fallback) → system stack. **No remote font fetch** (perf, privacy).
- Tabular numerals globally enabled (`font-feature-settings: 'tnum'`).
- Display sizes: 3xl (hero), 2xl (modal title), xl (lobby code), base/sm (body), [10px] uppercase tracking-widest (labels).

---

## Logo

`<FindNumberLogo size={n} variant="mark"|"full" glow={bool} />`

- `mark`: 64×64 square icon, "FN" monogram on premium dark with neon-yellow stroke + P1 (red) / P2 (blue) corner dots
- `full`: mark + wordmark "FIND NUMBER" with "1v1 race" tagline
- `glow`: drop-shadow halo for hero placements
- Static asset: `/public/find-number-logo.svg` and `/public/favicon.svg`

---

## Do / Don't

| Do | Don't |
|---|---|
| Use `.fn-btn-primary` for hero CTAs | Re-implement gradient/glow from scratch |
| Use `bg-surface-raised` for new panels | Use raw `bg-gray-900` (drifts off-token) |
| Compose `.fn-tile` + state utilities | Re-create tile styling per screen |
| Apply `animate-target-reveal` on target change | Add framer-motion (banned) |
| Reference `neon-yellow` for target text | Hard-code `#fde047` |

---

## Safe areas (mobile — CRITICAL)

iPhone notch / Dynamic Island, home indicator, Android gesture nav, and the **collapsing Safari address bar** all hide UI if you ignore them.

### Rules
1. **Top inset** (notch / Dynamic Island / status bar): HUD, top banners, modal headers → use `.safe-top` utility (`padding-top: max(env(safe-area-inset-top), 0.75rem)`)
2. **Bottom inset** (home indicator / gesture bar): primary CTAs, footers, bottom sheets → use `.safe-bottom` (`padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)`)
3. **Full-height layouts**: use **`100dvh`** (dynamic viewport height) not `100vh` — `vh` does not shrink when Safari's address bar appears, causing bottom overflow
4. **Side insets** (landscape with notch): apply `padding-left: env(safe-area-inset-left)` + right to absolute-positioned overlays
5. **viewport-fit=cover** already set in `index.html` — required for `env()` to return non-zero values
6. **Backdrop modals** (`.fn-modal-backdrop`): full-bleed dark layer must extend under the notch — DO NOT inset the backdrop, only inset the **panel content**

### Tokens / utilities
| Utility | Equivalent |
|---|---|
| `.safe-top` | `padding-top: max(env(safe-area-inset-top), 0.75rem)` |
| `.safe-bottom` | `padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)` |
| `h-screen-dvh` | use raw `h-[100dvh]` (Tailwind 3.4 supports `dvh` natively) |
| `min-h-screen-dvh` | use raw `min-h-[100dvh]` |

### Common pitfalls (avoid)
- Floating bottom CTA at `bottom-0` without `pb-[env(safe-area-inset-bottom)]` → button half-hidden under home indicator
- Hero header at `top-0` without `pt-[env(safe-area-inset-top)]` → text behind Dynamic Island
- `h-screen` on root container → on Safari mobile, address bar collapsing causes content to extend past viewport, clipping bottom CTAs. **Always use `h-[100dvh]` for root.**
- Grid sized via `vh` units → same issue. Use `dvh` or absolute positioning with safe insets

### Phase 2+ checklist
Before merging any phase, manually verify on:
- iPhone with notch (Safari + standalone PWA)
- Android with gesture nav (Chrome)
- Landscape orientation
- Address bar visible AND collapsed

---

## Bundle budget

- Phase 1 cost: ~ +4 KB gzip (mostly `tailwindcss-animate` utilities + custom keyframes)
- Whole refactor budget: ≤ +15 KB gzip across phases 1–5
