type Props = {
  target: number | null
  round?: number
  totalRounds?: number
}

export function TargetBanner({ target, round, totalRounds }: Props) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-center">
      <div className="rounded-2xl bg-black/60 px-5 py-2 backdrop-blur-md ring-1 ring-white/10">
        <div className="text-xs uppercase tracking-widest text-gray-300">
          {round && totalRounds ? `Round ${round} / ${totalRounds}` : 'Find'}
        </div>
        <div className="text-4xl font-black tabular-nums text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.6)]">
          {target ?? '—'}
        </div>
      </div>
    </div>
  )
}
