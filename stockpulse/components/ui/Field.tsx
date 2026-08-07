'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * The shared control skin.
 *
 * The error state is driven by `aria-invalid` rather than a prop, which is the
 * whole trick: `Field` already sets that attribute when it has an error, so
 * every control inside one turns red without the caller wiring a second flag.
 * A control used outside `Field` gets the same treatment the moment it is
 * marked invalid, and the styling can never disagree with what assistive tech
 * is told.
 *
 * Height comes from `--control-h` — 40px per the brief, 44px on a coarse
 * pointer. `min-height` rather than `height` so a zoomed-in browser or a
 * long select option can still grow the control instead of clipping it.
 */
const CONTROL = cn(
  'w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm text-foreground',
  'min-h-[var(--control-h)] transition-[border-color,background-color] duration-150',
  'placeholder:text-muted',
  'focus:border-border-strong focus:bg-surface focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-bg',
  'aria-[invalid=true]:focus:border-danger',
)

/**
 * Label + control + error, wired together by id so the label actually points at
 * its input and errors are announced.
 */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode
}) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong"
      >
        {label}
        {/* Decorative: `required` on the control itself is what gets
            announced, so repeating it here would double up. */}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, 'py-2', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(CONTROL, 'py-2', className)} {...props}>
        {children}
      </select>
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(CONTROL, 'min-h-24 resize-y py-2.5', className)} {...props} />
  },
)
