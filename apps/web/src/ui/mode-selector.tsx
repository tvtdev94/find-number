import { MATCH_MODES, type MatchMode } from '@find-number/shared'

const ORDER: MatchMode[] = ['sprint', 'quick', 'classic']

type Props = {
  value: MatchMode
  onChange: (m: MatchMode) => void
  /** Visual size: 'sm' compact, 'md' default */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Segmented mode picker — 3 buttons (Sprint / Quick / Classic) showing
 * pool size + duration hint. Tap area ≥ 44px per platform guidelines.
 */
export function ModeSelector({ value, onChange, size = 'md', className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Match length"
      className={`grid grid-cols-3 gap-1.5 rounded-2xl bg-white/5 p-1.5 ring-1 ring-white/10 ${className ?? ''}`}
    >
      {ORDER.map((mode) => {
        const m = MATCH_MODES[mode]
        const selected = value === mode
        const base =
          'flex flex-col items-center justify-center rounded-xl transition active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-yellow-400'
        const stateCls = selected
          ? 'bg-gradient-to-b from-yellow-400 to-amber-400 text-gray-900 shadow-glow-yellow-sm'
          : 'bg-transparent text-gray-300 hover:bg-white/5'
        const padding = size === 'sm' ? 'px-2 py-2' : 'px-2 py-3'
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode)}
            className={`${base} ${stateCls} ${padding}`}
            style={{ minHeight: 44 }}
          >
            <span className={`font-bold ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
              {m.label}
            </span>
            <span className={`tabular-nums font-semibold ${selected ? 'opacity-90' : 'opacity-80'} ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
              {m.size} số
            </span>
            <span className={`${selected ? 'opacity-70' : 'opacity-50'} ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'}`}>
              {m.durationHint}
            </span>
          </button>
        )
      })}
    </div>
  )
}
