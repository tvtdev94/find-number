type Variant = 'mark' | 'full'

type Props = {
  size?: number
  variant?: Variant
  glow?: boolean
  className?: string
}

/**
 * Find Number brand mark.
 *  - mark: square icon, "FN" monogram with P1/P2 corner dots
 *  - full: mark + "FIND NUMBER" wordmark to the right
 */
export function FindNumberLogo({ size = 48, variant = 'mark', glow = false, className }: Props) {
  const filter = glow ? 'drop-shadow(0 0 12px rgba(253,224,71,0.55))' : undefined
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ filter }}
      aria-hidden={variant === 'full' ? true : undefined}
      role={variant === 'mark' ? 'img' : undefined}
      aria-label={variant === 'mark' ? 'Find Number' : undefined}
    >
      <defs>
        <linearGradient id="fn-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#0b0f1a" stroke="#fde047" strokeWidth="2" />
      <text
        x="32"
        y="43"
        fontFamily="-apple-system,Inter,Segoe UI,sans-serif"
        fontSize="26"
        fontWeight="900"
        fill="url(#fn-grad)"
        textAnchor="middle"
        letterSpacing="-1"
      >
        FN
      </text>
      <circle cx="13" cy="13" r="3" fill="#ef4444" />
      <circle cx="51" cy="51" r="3" fill="#3b82f6" />
    </svg>
  )

  if (variant === 'mark') {
    return <span className={className}>{mark}</span>
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`} role="img" aria-label="Find Number">
      {mark}
      <span className="flex flex-col leading-none">
        <span
          className="text-xl font-black tracking-[0.18em] text-neon-yellow"
          style={glow ? { textShadow: '0 0 10px rgba(253,224,71,0.55)' } : undefined}
        >
          FIND NUMBER
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500">
          1v1 race
        </span>
      </span>
    </span>
  )
}
