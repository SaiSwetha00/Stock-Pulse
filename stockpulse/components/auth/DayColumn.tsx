'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * The trading day, drawn as a column. The signature element of the auth
 * screens.
 *
 * WHY THIS AND NOT AN ECG LINE. The product is called StockPulse, so a
 * heartbeat trace is the obvious move — and it is the wrong one. It reads
 * medical, it is the single most templated "pulse" visual in circulation, and
 * it would be here because the name invites it rather than because it says
 * anything. A grocery's pulse is not a heartbeat. It is a trading day: the
 * morning opening, the delivery, the lunch trade, the evening peak, closing.
 * That is a real rhythm, it is a thing this product actually measures, and it
 * has its own vocabulary — a bar per hour — borrowed from the dashboard
 * rather than from a hospital monitor.
 *
 * It earns its place by meaning something different on each screen:
 *
 *   Sign in  — `fill` is 1. The whole day is there, drawn once on load in a
 *              single sweep and then still. You are returning to a shop that
 *              has been trading.
 *   Sign up  — `fill` tracks the wizard. The day is empty at step one and
 *              fills as you advance, so your shop's first day appears as you
 *              create it. It is a progress indicator that happens to be the
 *              brand mark, not an ornament sitting next to one.
 *
 * The `fill` value is READ from the step state the signup page already keeps.
 * Nothing here drives the flow, validates anything, or sits on the path of a
 * submit — this component cannot affect whether an account is created.
 */

/**
 * A kirana shop's day, 07:00 to 21:00, as a share of the day's best hour.
 * Hand-authored and illustrative: these are not a real store's takings, and
 * the component is never given any. The shape is the point — a slow morning,
 * a lunch lift, the long evening peak any neighbourhood grocer would
 * recognise, and the taper into closing.
 */
const TRADING_DAY: ReadonlyArray<{ hour: string; value: number }> = [
  { hour: '07', value: 0.18 },
  { hour: '08', value: 0.34 },
  { hour: '09', value: 0.52 },
  { hour: '10', value: 0.46 },
  { hour: '11', value: 0.38 },
  { hour: '12', value: 0.61 },
  { hour: '13', value: 0.72 },
  { hour: '14', value: 0.44 },
  { hour: '15', value: 0.3 },
  { hour: '16', value: 0.41 },
  { hour: '17', value: 0.66 },
  { hour: '18', value: 0.88 },
  { hour: '19', value: 1.0 },
  { hour: '20', value: 0.57 },
  { hour: '21', value: 0.22 },
]

/** The one hour drawn in red — the day's peak, and the only red in the column. */
const PEAK = TRADING_DAY.reduce((a, b) => (b.value > a.value ? b : a)).hour

export default function DayColumn({
  fill = 1,
  className = '',
}: {
  /** 0…1 — how much of the day has been drawn. Sign-in passes 1. */
  fill?: number
  className?: string
}) {
  const still = useReducedMotion()
  const shown = Math.round(Math.max(0, Math.min(1, fill)) * TRADING_DAY.length)

  return (
    <figure className={`w-full ${className}`}>
      {/*
        The caption is not decoration and should not be dropped. Without it
        this is an abstract pattern; with it, it is a figure with a subject —
        which is the whole difference between a signature and wallpaper.
      */}
      <figcaption className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        A trading day · 07—21
      </figcaption>

      <div className="mt-4 space-y-[5px]">
        {TRADING_DAY.map((slot, i) => {
          const drawn = i < shown
          const isPeak = slot.hour === PEAK
          return (
            <div key={slot.hour} className="flex items-center gap-3">
              <span
                className="w-[18px] shrink-0 font-mono text-[10px] tabular-nums text-muted"
                aria-hidden="true"
              >
                {slot.hour}
              </span>

              {/* The track keeps every row the same width, so the column reads
                  as a measured figure rather than a ragged stack. */}
              <span className="relative h-[7px] flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${slot.value * 100}%`,
                    transformOrigin: 'left center',
                    background: isPeak
                      ? 'linear-gradient(90deg, var(--sp-red) 0%, #b81a20 100%)'
                      : 'linear-gradient(90deg, var(--sp-gold-deep) 0%, var(--sp-gold) 100%)',
                    opacity: isPeak ? 1 : 0.85,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: drawn ? 1 : 0 }}
                  transition={
                    still
                      ? { duration: 0 }
                      : // The stagger IS the pulse: rows land in sequence from
                        // opening to close, so the column sweeps rather than
                        // appears. Slow enough to read, short enough that a
                        // returning user is not kept waiting on a decoration.
                        { duration: 0.42, delay: drawn ? i * 0.045 : 0, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              </span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}
