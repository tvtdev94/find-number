import { useMemo } from 'react'
import type { PlayerSlot } from '@find-number/shared'

type Props = {
  numbers: number[]
  target: number | null
  foundBy: Record<number, PlayerSlot>
  onClickNumber: (n: number) => void
  disabled?: boolean
}

/**
 * 10x10 grid of number tiles. Replaces the 3D galaxy scene.
 * Tiles are >=44px touch targets, large readable numbers, color-coded
 * by which player found them. Target tile pulses yellow.
 */
export function NumberGrid({ numbers, target, foundBy, onClickNumber, disabled }: Props) {
  // Sort 1..N for stable visual layout — protocol's layoutSeed is unused in 2D.
  const sorted = useMemo(() => [...numbers].sort((a, b) => a - b), [numbers])

  return (
    <div className="flex h-full w-full items-center justify-center px-2 pb-6 pt-20 sm:pt-24">
      <div
        className="grid w-full max-w-[640px] gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
      >
        {sorted.map((n) => {
          const owner = foundBy[n]
          const isTarget = n === target
          return (
            <Tile
              key={n}
              number={n}
              owner={owner}
              isTarget={isTarget}
              disabled={disabled || !!owner}
              onClick={() => !disabled && !owner && onClickNumber(n)}
            />
          )
        })}
      </div>
    </div>
  )
}

function Tile({
  number,
  owner,
  isTarget,
  disabled,
  onClick,
}: {
  number: number
  owner?: PlayerSlot
  isTarget: boolean
  disabled: boolean
  onClick: () => void
}) {
  const base =
    'aspect-square w-full rounded-lg flex items-center justify-center font-bold tabular-nums text-base sm:text-lg select-none transition-transform active:scale-95 ring-1'
  let cls = `${base} bg-white/5 text-gray-100 ring-white/10 hover:bg-white/10`
  if (owner === 'p1') cls = `${base} bg-red-500/90 text-white ring-red-300/60 line-through`
  else if (owner === 'p2') cls = `${base} bg-blue-500/90 text-white ring-blue-300/60 line-through`
  else if (isTarget) {
    cls = `${base} bg-yellow-400/15 text-yellow-200 ring-2 ring-yellow-400 animate-pulse`
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Number ${number}${isTarget ? ' (target)' : ''}`}
      className={cls}
    >
      {number}
    </button>
  )
}
