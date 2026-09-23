/**
 * THE StockPulse mark — Icon A, "inventory flow", approved 2026-09-23.
 *
 * Three shelf rows of descending width with one unit detached from the top row
 * and shifted right: organised stock, and stock moving out of it. It replaced
 * a gold ECG/pulse emblem, and before that a blue one; nothing in the app
 * should draw a pulse line any more.
 *
 * THIS FILE IS THE ONLY DRAWING OF THE MARK IN THE APP. The favicon, Apple
 * icon and PWA icons under app/ and public/icons are PNG/ICO renders of this
 * same geometry (see scripts/render-brand-icons.cjs), and
 * components/marketing/StockPulseLogo and the landing page's header both
 * render this component. If the geometry below changes, re-run that script or
 * the raster icons silently disagree with the vector one.
 *
 * `uid` is required rather than generated: this renders inside Server
 * Components, where useId is unavailable, and a page may show the mark twice
 * (nav and footer). Two <linearGradient> elements sharing an id are invalid
 * HTML and both resolve to whichever the browser parsed first.
 */
export default function StockPulseMark({
  uid,
  className = 'h-8 w-8',
  style,
  variant = 'app',
  flatColor = 'currentColor',
}: {
  /** Unique per instance on the page, e.g. "nav" / "footer". */
  uid: string
  className?: string
  style?: React.CSSProperties
  /** `app` draws the rounded-square container; `flat` draws the symbol alone. */
  variant?: 'app' | 'flat'
  /** Colour of the symbol in the `flat` variant. */
  flatColor?: string
}) {
  const fill = variant === 'flat' ? flatColor : '#FFFFFF'
  // useId() returns ids containing colons (":r1:"); strip anything that is not
  // safe in a fragment reference before it reaches url(#…).
  const ref = `sp-mark-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const symbol = (
    <g fill={fill}>
      <rect x="7" y="8" width="11" height="4.6" rx="2.3" />
      <rect x="7" y="14.7" width="18" height="4.6" rx="2.3" />
      <rect x="7" y="21.4" width="14.5" height="4.6" rx="2.3" />
      <rect x="20.4" y="8" width="4.6" height="4.6" rx="2.3" fillOpacity="0.72" />
    </g>
  )

  return (
    <svg viewBox="0 0 32 32" className={className} style={style} aria-hidden="true" focusable="false">
      {variant === 'app' ? (
        <>
          <defs>
            <linearGradient id={`${ref}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4F6BFF" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id={`${ref}-shine`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.26" />
              <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="32" height="32" rx="8.5" fill={`url(#${ref}-bg)`} />
          <rect x="0" y="0" width="32" height="32" rx="8.5" fill={`url(#${ref}-shine)`} />
          {symbol}
        </>
      ) : (
        symbol
      )}
    </svg>
  )
}
