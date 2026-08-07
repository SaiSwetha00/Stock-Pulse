'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * `destructive` and `danger` are the same variant under two names. The brief
 * calls it destructive; four existing call sites already say danger. Keeping
 * both costs one map entry and saves a rename that would touch files this
 * change has no other reason to open.
 */
type Variant = 'primary' | 'secondary' | 'destructive' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const DESTRUCTIVE =
  'bg-danger text-surface shadow-xs hover:brightness-110 active:brightness-95 focus-visible:outline-danger'

const VARIANTS: Record<Variant, string> = {
  // `foreground`, not `accent`: primary in this app has always been the
  // near-black, and the accent is reserved for state and emphasis. Expressed
  // as a token pair so it inverts correctly under .dark — a near-white button
  // with dark text — instead of staying black on a black page.
  primary:
    'bg-foreground text-surface shadow-xs hover:opacity-90 active:opacity-100 focus-visible:outline-foreground',
  secondary:
    'border border-border bg-surface text-foreground shadow-xs hover:bg-surface-muted active:brightness-[0.98] focus-visible:outline-border-strong',
  destructive: DESTRUCTIVE,
  danger: DESTRUCTIVE,
  ghost:
    'text-muted-strong hover:bg-surface-muted hover:text-foreground focus-visible:outline-border-strong',
}

/**
 * Heights come from `--control-h` (40px, or 44px on a coarse pointer) so
 * buttons and inputs sit on the same baseline in a form row. See the metrics
 * block in globals.css for why that is a variable rather than a fixed height.
 */
const SIZES: Record<Size, string> = {
  sm: 'control-h-sm gap-1.5 px-3 text-xs',
  md: 'control-h gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-sm',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

/**
 * The one button. Hover, focus, disabled and loading are decided here so they
 * cannot drift per screen.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth, className, children, disabled, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      // Buttons default to type="submit" inside a form, which silently submits.
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-semibold',
        'transition-[background-color,box-shadow,filter] duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {/* The label stays put while loading — swapping it for a spinner would
          collapse the button's width mid-click and shift whatever sits beside
          it. The spinner is inserted alongside instead. */}
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

export default Button
