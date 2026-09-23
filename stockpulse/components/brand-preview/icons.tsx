/**
 * Three NEW StockPulse icon concepts — previews only. Nothing in production
 * uses these: the live mark is still components/marketing/StockPulseLogo and
 * app/favicon.ico.
 *
 * None reuses the current ECG/pulse line, and none is a cart, a cube, a
 * candlestick or a bar chart. Each is built on the same 32-unit grid with the
 * same optical weight, so the three can be compared as marks rather than as
 * drawings at different scales.
 *
 * Every symbol is drawn to survive 16px: no stroke thinner than 2 units, no
 * detail smaller than 2.5 units, and a silhouette that holds when the colour
 * is removed — the preview renders each one flat white to prove it.
 *
 * Gradient ids are namespaced per instance through `uid`, because the page
 * shows each icon many times and two <linearGradient> elements sharing an id
 * would both resolve to whichever the browser parsed first.
 */

export type IconProps = {
  /** Unique per rendered instance — see the note about gradient ids. */
  uid: string
  className?: string
  /** Used by the size ladder to render at exact pixel sizes. */
  style?: React.CSSProperties
  /** `flat` drops the container and gradient: the silhouette test. */
  variant?: 'app' | 'flat'
  /** Colour of the flat variant. */
  flatColor?: string
}

const BLUE = '#4F6BFF'
const PURPLE = '#8B5CF6'

/** The shared rounded-square container and its one soft highlight. */
function Container({ uid, children }: { uid: string; children: React.ReactNode }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BLUE} />
          <stop offset="1" stopColor={PURPLE} />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="8.5" fill={`url(#${uid}-bg)`} />
      <rect x="0" y="0" width="32" height="32" rx="8.5" fill={`url(#${uid}-shine)`} />
      {children}
    </>
  )
}

/* ══════════════════ ICON A — Inventory / stock movement ══════════════════ */

/**
 * Three shelf rows of descending width, with the top row's last unit detached
 * and shifted right: stock leaving an organised shelf. The gap between the
 * stack and the moving unit is the whole idea, so it is kept at 2 units —
 * still open at 16px.
 */
export function IconA({ uid, className, style, variant = 'app', flatColor = '#FFFFFF' }: IconProps) {
  const fill = variant === 'flat' ? flatColor : '#FFFFFF'
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
      {variant === 'app' ? <Container uid={uid}>{symbol}</Container> : symbol}
    </svg>
  )
}

/* ══════════════════ ICON B — Pulse + store ══════════════════ */

/**
 * A filled shop front — arch-topped, like a shutter — with two slots cut out
 * of it. The lower slot is offset to the right: the shutter is open and
 * something has moved. Activity without an ECG line.
 *
 * FILLED rather than stroked, and redrawn from the first attempt: an arch over
 * a separate counter line read as a pair of headphones at small sizes. A solid
 * silhouette with negative-space slots cannot, and it carries far more weight
 * at 16px. The slots are cut with a mask so the shape stays one object in both
 * the app and flat variants.
 */
export function IconB({ uid, className, style, variant = 'app', flatColor = '#FFFFFF' }: IconProps) {
  const fill = variant === 'flat' ? flatColor : '#FFFFFF'
  const symbol = (
    <>
      <mask id={`${uid}-mask`}>
        <rect width="32" height="32" fill="black" />
        <path d="M7.4 25.6V15.2a8.6 8.6 0 0 1 17.2 0v10.4a1 1 0 0 1-1 1h-15.2a1 1 0 0 1-1-1Z" fill="white" />
        <rect x="11" y="13.4" width="10" height="2.8" rx="1.4" fill="black" />
        <rect x="13.4" y="19" width="10" height="2.8" rx="1.4" fill="black" />
      </mask>
      <rect width="32" height="32" fill={fill} mask={`url(#${uid}-mask)`} />
    </>
  )
  return (
    <svg viewBox="0 0 32 32" className={className} style={style} aria-hidden="true" focusable="false">
      {variant === 'app' ? <Container uid={uid}>{symbol}</Container> : symbol}
    </svg>
  )
}

/* ══════════════════ ICON C — Abstract flow ══════════════════ */

/**
 * A rounded square loop — stock circulating through the shop — with its
 * top-right corner opened and one unit breaking away from it.
 *
 * Redrawn from the first attempt, three bars rotated 120°, which read as a
 * propeller. A loop plus a departing block keeps the "flow, organised" idea
 * while looking like nothing else on a home screen; the gap and the block are
 * what the eye keeps at 16px.
 */
export function IconC({ uid, className, style, variant = 'app', flatColor = '#FFFFFF' }: IconProps) {
  const fill = variant === 'flat' ? flatColor : '#FFFFFF'
  const symbol = (
    <>
      <mask id={`${uid}-mask`}>
        <rect width="32" height="32" fill="black" />
        <rect x="8.4" y="10.6" width="14.4" height="14.4" rx="4.4" fill="none" stroke="white" strokeWidth="3.3" />
        <circle cx="22.8" cy="10.6" r="4.3" fill="black" />
      </mask>
      <rect width="32" height="32" fill={fill} mask={`url(#${uid}-mask)`} />
      {/* A square unit, not a dot: a rounded circle here read as a camera lens. */}
      <rect x="20.6" y="4.4" width="7" height="7" rx="2" fill={fill} fillOpacity="0.85" />
    </>
  )
  return (
    <svg viewBox="0 0 32 32" className={className} style={style} aria-hidden="true" focusable="false">
      {variant === 'app' ? <Container uid={uid}>{symbol}</Container> : symbol}
    </svg>
  )
}

export const ICONS = [
  {
    id: 'a',
    name: 'Inventory / stock movement',
    Icon: IconA,
    idea: 'Three shelf rows of descending width, with one unit detached from the top row and shifted right.',
    says: 'Organised stock, and stock moving out of it — inventory and sales in one mark.',
    watch: 'The most literal of the three, and the most dependent on its 2-unit gap staying open at small sizes.',
  },
  {
    id: 'b',
    name: 'Pulse + store',
    Icon: IconB,
    idea: 'A filled, arch-topped shop front with two slots cut out of it, the lower one offset right.',
    says: 'A store with its shutter open and something moving — activity, with no heartbeat line.',
    watch: 'The heaviest silhouette of the three, which makes it the most solid at 16px and the least delicate at 512px.',
  },
  {
    id: 'c',
    name: 'Abstract flow',
    Icon: IconC,
    idea: 'A rounded square loop, opened at the top-right corner, with one unit breaking away from it.',
    says: 'Stock circulating and leaving — movement and organisation, with no literal object to date it.',
    watch: 'Says the least on first sight; it earns meaning by repetition, as most abstract marks do.',
  },
] as const
