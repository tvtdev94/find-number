import type { PlayerSlot } from '@find-number/shared'

type Props = {
  numbers: number[]
  foundBy: Record<number, PlayerSlot>
  cols: number
  onClickNumber: (n: number) => void
  disabled?: boolean
}

/**
 * Variable-size grid of number tiles. Numbers are rendered in the order
 * received from server / store (re-shuffled each round so player must scan visually).
 * `cols` drives layout — sprint=5, quick=5, classic=10.
 */
export function NumberGrid({ numbers, foundBy, cols, onClickNumber, disabled }: Props) {
  // Wider tiles on small grids → cap max-width to keep them readable but not huge.
  const maxWidth = cols <= 5 ? 420 : cols <= 7 ? 520 : 640

  return (
    <div
      className="flex h-full w-full items-center justify-center px-2"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 5rem)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 1.5rem)',
      }}
    >
      <div
        className="grid w-full gap-1 sm:gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${maxWidth}px`,
        }}
      >
        {numbers.map((n) => {
          const owner = foundBy[n]
          return (
            <Tile
              key={n}
              number={n}
              owner={owner}
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
  disabled,
  onClick,
}: {
  number: number
  owner?: PlayerSlot
  disabled: boolean
  onClick: () => void
}) {
  const base =
    'aspect-square w-full rounded-lg flex items-center justify-center font-bold tabular-nums text-base sm:text-lg select-none transition-transform active:scale-95 ring-1'
  let cls = `${base} bg-white/5 text-gray-100 ring-white/10 hover:bg-white/10`
  if (owner === 'p1') cls = `${base} bg-red-500/90 text-white ring-red-300/60 line-through`
  else if (owner === 'p2') cls = `${base} bg-blue-500/90 text-white ring-blue-300/60 line-through`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Number ${number}`}
      className={cls}
    >
      {number}
    </button>
  )
}
