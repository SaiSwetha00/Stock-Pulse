/**
 * The StockPulse mark for the navy landing page: a rounded square filled
 * blue-to-purple with a white pulse line — the brand's pulse, in the page's
 * two accents. Replaces the flat single-colour square here only; the shared
 * Mark (../shared) still serves Explorations 1-3 unchanged.
 *
 * `id` must be unique per instance on the page: the gradient is referenced by
 * id, and two marks sharing one would both paint with whichever the browser
 * finds first. (useId is not available in a Server Component.)
 */
export default function BrandMark({ id, className = 'h-8 w-8' }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B7CFF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-fill)`} />
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-shine)`} />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" />
      <path
        d="M6.5 16.5h4.6l2.4-5.6 3.9 10.2 3-7.6 1.5 3H25.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
