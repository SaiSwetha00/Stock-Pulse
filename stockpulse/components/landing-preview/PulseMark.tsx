/**
 * A flat StockPulse mark for the design samples: the pulse line from the live
 * logo, without its metallic bevel, glow and brushed texture. That emblem is a
 * client component drawn for a black page; on a light surface it reads as a
 * sticker. `currentColor` lets each concept tint it.
 */
export default function PulseMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" />
      <path
        d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
        fill="none"
        stroke="var(--pm-line, #fff)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({
  className = '',
  markClass = 'h-7 w-7',
}: {
  className?: string
  markClass?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PulseMark className={markClass} />
      <span className="font-semibold tracking-tight">StockPulse</span>
    </span>
  )
}
