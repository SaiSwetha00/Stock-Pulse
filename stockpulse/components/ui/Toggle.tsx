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
      className="tap-target shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      <span
        aria-hidden="true"
        className={`relative block h-6 w-11 rounded-full transition ${
          checked ? 'bg-foreground' : 'bg-surface-muted'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
