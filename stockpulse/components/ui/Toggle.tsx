'use client'

/**
 * `label` is required, not optional: this control renders no text of its own,
 * so without it a screen reader announces a nameless "button" with no state.
 * role="switch" + aria-checked make the on/off state audible too.
 */
export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  // The switch still reads as a 24px-tall track, but the button around it is
  // held to the 44px tap-target floor, so the hit area is a full square.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="tap-target shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <span
        aria-hidden="true"
        // The OFF track carries a hairline; the ON track does not need one.
        // Off is --surface-muted, which in dark is #2f2118 sitting on a
        // #241a12 card — seen in a dark screenshot, the switch was very nearly
        // invisible, so an unset control read as empty space rather than as
        // something you can turn on. The border is inside the box
        // (border-box), so the 44x24 track keeps its size.
        className={`relative block h-6 w-11 rounded-full transition ${
          checked ? 'bg-foreground' : 'border border-border-strong bg-surface-muted'
        }`}
      >
        {/* `left-0.5` is load-bearing, not tidiness.

            Without it this knob was absolutely positioned with no inline
            anchor, so it resolved against its *static* position rather than
            the track's left edge. Measured: the static position was 22px, and
            the translate stacked on top of it — the ON knob started 42px into
            a 44px track and hung 18px past its right end, and even the OFF
            knob sat at 24px instead of 2px. That overhang is what read as
            "the toggle sits outside the card".

            With an explicit left the two states are 2px and 22px inside a
            44px track holding a 20px knob: 2px of breathing room at each end,
            and the translate now means what it says. */}
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
