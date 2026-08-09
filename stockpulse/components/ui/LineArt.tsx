/**
 * The app's line-art language, in one file.
 *
 * Every illustration here is stroke-drawn inline SVG in two colours: coffee
 * (`--border-strong`) for the drawing and gold (`--accent`) for exactly one
 * element per picture. That restraint is D22's rule applied to imagery — gold
 * is a mark, never a fill — and it is what stops four illustrations from
 * looking like four different products.
 *
 * WHY INLINE SVG AND NOT FILES:
 *   No remote hosts and no checked-in binaries, the same constraint that
 *   removed six already-404 `images.unsplash.com` loads from the landing page.
 *   Inline also means the strokes read CSS variables, so a single drawing
 *   inverts correctly between themes instead of needing a light asset and a
 *   dark one.
 *
 * WHY NOT CANVAS:
 *   The Unsplash replacement drew its textures on a canvas because they were
 *   textures for a WebGL material. These are flat two-colour drawings at known
 *   sizes, and `ProductThumb` renders one per row — thirty canvases and thirty
 *   2D contexts in a table would cost far more than thirty `<svg>` elements.
 *   Same rule (nothing remote, nothing binary), cheaper mechanism.
 *
 * These are decorative. Every one is `aria-hidden`; the `EmptyState` beside
 * them already carries the words.
 */

const STROKE = 'var(--border-strong)'
const GOLD = 'var(--accent)'

/** Shared frame. One place decides viewBox, stroke weight and joins, so the
 *  four drawings cannot drift into four different weights. */
function Frame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      fill="none"
      stroke={STROKE}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      {children}
    </svg>
  )
}

/** Inventory — crates on a shelf, one of them gold. */
export function LineArtShelf({ className = '' }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M24 92h112" />
      <path d="M34 92V70h30v22M64 92V70h30v22M94 92V70h30v22" />
      <path d="M44 70V56h30v14M74 70V56h30v14" />
      {/* The one gold element: the crate that needs attention. */}
      <g stroke={GOLD}>
        <path d="M58 56V44h30v12" />
        <path d="M67 50h12" />
      </g>
      <path d="M34 92v6M124 92v6" />
    </Frame>
  )
}

/** Sales — a receipt with a trend line climbing off it. */
export function LineArtReceipt({ className = '' }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M46 26h44v70l-7-5-7 5-7-5-7 5-7-5-7 5V26z" />
      <path d="M58 44h20M58 56h20M58 68h12" />
      {/* The one gold element: the line that is the point of the screen. */}
      <g stroke={GOLD}>
        <path d="M96 78l14-14 10 8 16-22" />
        <path d="M129 50h7v7" />
      </g>
    </Frame>
  )
}

/** Customers — two figures, the nearer one marked. */
export function LineArtPeople({ className = '' }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="62" cy="48" r="12" />
      <path d="M40 92c0-12 10-20 22-20s22 8 22 20" />
      <circle cx="100" cy="54" r="9" />
      <path d="M86 92c0-9 7-15 14-15s14 6 14 15" />
      {/* The one gold element: the loyalty arc. */}
      <g stroke={GOLD}>
        <path d="M52 30a14 14 0 0 1 20 0" />
        <circle cx="62" cy="24" r="2.5" />
      </g>
    </Frame>
  )
}

/** Suppliers — a delivery van on a road. */
export function LineArtTruck({ className = '' }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M26 78V44h56v34" />
      <path d="M82 56h20l14 14v8H82z" />
      <circle cx="52" cy="82" r="7" />
      <circle cx="104" cy="82" r="7" />
      <path d="M26 78h19M59 78h38" />
      {/* The one gold element: the road it is arriving on. */}
      <g stroke={GOLD}>
        <path d="M18 96h18M46 96h22M78 96h18M106 96h18" />
      </g>
    </Frame>
  )
}

/**
 * The photo-shaped glyph used behind an empty image slot.
 *
 * Drawn at whatever size the slot is, so the placeholder occupies exactly the
 * space a real photo would and swapping one in shifts nothing.
 */
export function LineArtPhoto({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke={STROKE}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      <rect x="8" y="11" width="32" height="26" rx="3" />
      <circle cx="18" cy="20" r="3" />
      <path d="M11 33l9-9 6 6 5-4 8 7" />
    </svg>
  )
}
