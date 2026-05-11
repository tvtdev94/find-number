---
title: "Phase 04 — Client UI pickers"
status: completed
priority: P2
effort: 1.5h
---

## Context Links

- `apps/web/src/ui/mode-selector.tsx` (NEW)
- `apps/web/src/routes/landing.tsx`
- `apps/web/src/ui/start-lobby.tsx`
- `apps/web/src/net/room-api.ts`
- `apps/web/src/ui/quick-match-modal.tsx` (UNCHANGED — locked to quick)
- Depends on: phases 01–03

## Overview

**Priority:** UX surface.
**Status:** pending.
**Brief:** New `ModeSelector` component used in Practice's StartLobby (selects local `practiceMode`) and Landing (selects `createRoomMode`, passed to `createRoom(mode)`). Quick Match modal untouched. Vietnamese copy.

## Key Insights

- 3 modes → segmented control (3 buttons in a row) is the simplest pattern; matches existing styling (rounded-xl + ring).
- Show duration hint below mode label ("~1 phút", "~2-3 phút", "~5-8 phút").
- Both consumers store/setter shape identical → component is dumb: takes `value` + `onChange`.
- `room-api.createRoom` signature: `createRoom(mode?: MatchMode)` → `POST /api/rooms` with `{ mode }` body.

## Requirements

**Functional**
- `ModeSelector` props: `{ value: MatchMode, onChange: (m: MatchMode) => void, disabled?: boolean }`.
- Renders 3 segmented buttons. Active button highlighted (yellow). Labels in Vietnamese:
  - sprint → "Sprint" + "25 số · ~1 phút"
  - quick → "Quick" + "50 số · ~2-3 phút"
  - classic → "Classic" + "100 số · ~5-8 phút"
- Landing: above "Create Room" button, render selector bound to `createRoomMode`. Pass selected mode to `createRoom(mode)`.
- StartLobby (Practice): render selector bound to `practiceMode`. On Start, call `startMatch({ mode: practiceMode, alternateSlots })`.
- Quick Match modal: NO selector. Add a tiny "50 số · ~2-3 phút" hint line under "Quick Match" title (optional micro-UX, ≤1 line code).

**Non-functional**
- Touch-friendly: each segment ≥44px tap target.
- Mobile-first: selector wraps cleanly at 320px viewport.
- Bundle delta: file ≤80 lines, no new deps.

## Architecture

```
ModeSelector (presentational)
  ↑ value/onChange
Landing.tsx  → useSettingsStore.createRoomMode/setCreateRoomMode → createRoom(mode)
StartLobby   → useSettingsStore.practiceMode/setPracticeMode    → startMatch({mode})
```

## Related Code Files

**Create**
- `apps/web/src/ui/mode-selector.tsx`

**Modify**
- `apps/web/src/routes/landing.tsx`
- `apps/web/src/ui/start-lobby.tsx`
- `apps/web/src/net/room-api.ts`
- `apps/web/src/ui/quick-match-modal.tsx` (1-line hint only)

## Implementation Steps

1. **mode-selector.tsx**
   ```tsx
   import { MATCH_MODES, type MatchMode } from '@find-number/shared'
   const META: Record<MatchMode, { label: string; hint: string }> = {
     sprint:  { label: 'Sprint',  hint: '25 số · ~1 phút' },
     quick:   { label: 'Quick',   hint: '50 số · ~2-3 phút' },
     classic: { label: 'Classic', hint: '100 số · ~5-8 phút' },
   }
   export function ModeSelector({ value, onChange, disabled }) { /* 3-button segmented */ }
   ```
2. **room-api.ts** — `createRoom(mode?: MatchMode)` adds JSON body when mode provided.
3. **landing.tsx**
   - Read `createRoomMode` + `setCreateRoomMode` from settings store.
   - Render `<ModeSelector>` above "⚡ Create Room" button.
   - `handleCreate` calls `createRoom(createRoomMode)`.
4. **start-lobby.tsx**
   - Read `practiceMode` + `setPracticeMode`.
   - Render `<ModeSelector>` above "Start Match".
   - On click: `startMatch({ alternateSlots, mode: practiceMode })`.
5. **quick-match-modal.tsx** — add `<p>50 số · ~2-3 phút</p>` under title (cosmetic).

## Todo List

- [ ] Create `mode-selector.tsx`
- [ ] Update `room-api.ts` signature + body serialization
- [ ] Wire Landing selector + pass to createRoom
- [ ] Wire StartLobby selector + pass to startMatch
- [ ] Add hint line to Quick Match modal
- [ ] Visual check at 320/375/768 viewport widths

## Success Criteria

- Pick Sprint in Practice → Start Match → 5×5 grid, HUD shows "25 left".
- Pick Classic in Landing → Create Room → server responds with code; entering room shows 10×10 grid.
- Selected mode persists across page reload.
- Quick Match modal still shows locked Quick info; result is always 50 numbers.
- Lighthouse mobile a11y: tap targets pass.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Selector pushes Landing card below fold on small phones | Med | Low | Compact 2-line buttons; existing card has slack |
| createRoom call without mode (legacy callers) | Low | Low | `mode` optional; server defaults to `classic` |
| Vietnamese diacritics rendering | Low | Low | Existing UI already uses tiếng Việt — same font stack |

## Security Considerations

- No new endpoint — same `POST /api/rooms` with optional body.
- Client mode is hint; server validates against `MATCH_MODES` keys (phase 02).

## Next Steps

Unblocks phase 05 (tests verify round-trip, docs update).
