import { ImageResponse } from 'next/og'

/**
 * The link preview for every route in the app.
 *
 * There was none at all before this: `app/layout.tsx` declared `openGraph`
 * with a siteName and a locale but no image, so anything shared into Slack,
 * WhatsApp or a DM rendered as a bare grey card. That is the first thing a
 * prospective customer sees of the product.
 *
 * Rendered by next/og rather than checked in as a PNG, so the wordmark and the
 * palette cannot drift from the app's own values without someone editing this
 * file.
 */
export const alt = 'StockPulse — inventory, sales and staff for independent grocery stores'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The landing's own values, not the dashboard's. A share card is marketing
// surface, and the landing is permanently dark — see the .sp-landing block in
// globals.css.
const INK = '#000000'
const PANEL = '#0a0d0f'
const GOLD = '#edc155'
const GOLD_DEEP = '#c9a227'
const BODY = '#d1c5b0'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: INK,
          // A single warm pool of light behind the mark, so the card is not a
          // flat black rectangle at thumbnail size.
          backgroundImage:
            'radial-gradient(900px 480px at 22% 30%, rgba(237,193,85,0.16), transparent 70%)',
          padding: '0 86px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* Same mark as the favicon: a gold pulse on a dark plate. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 108,
              height: 108,
              borderRadius: 26,
              background: PANEL,
              border: `2px solid ${GOLD_DEEP}`,
            }}
          >
            <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
              <path
                d="M17 54 H35 L44 30 L56 74 L65 50 H83"
                stroke={GOLD}
                strokeWidth="8.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#f2f4f5',
            }}
          >
            StockPulse
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 40,
            lineHeight: 1.35,
            color: BODY,
            maxWidth: 900,
          }}
        >
          Inventory, sales and staff for independent grocery stores.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 52,
            gap: 18,
            alignItems: 'center',
            fontSize: 26,
            color: GOLD,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex', width: 56, height: 3, background: GOLD }} />
          Know your stock
        </div>
      </div>
    ),
    size,
  )
}
