'use client'

import { useId } from 'react'
import StockPulseMark from '@/components/brand/StockPulseMark'

interface StockPulseLogoProps {
  className?: string
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSubtitle?: boolean
}

/**
 * The StockPulse logo: the approved Icon A mark (components/brand/
 * StockPulseMark) beside the wordmark.
 *
 * It replaced a gold 3D emblem (a leaf-and-shield outline with a gold ECG line,
 * a brushed-metal texture and a Cinzel "STOCK PULSE" wordmark), and then the
 * interim blue pulse square. The same mark is now the app icon —
 * app/favicon.ico, app/apple-icon.png and public/icons/* are rendered from this
 * artwork — so a browser tab, a home screen and the sign-in page all show one
 * logo. Change them together.
 *
 * Rendered on the four auth pages (login, signup, forgot-password,
 * reset-password) through components/auth/AuthUI, and by the unused
 * components/marketing Landing/Footer/LandingNav.
 *
 * The gradient ids come from useId because a page may hold more than one logo
 * (nav and footer): two instances sharing an id would both paint with whichever
 * definition the browser resolved first.
 */
export default function StockPulseLogo({
  className = '',
  iconOnly = false,
  size = 'md',
  showSubtitle = true,
}: StockPulseLogoProps) {
  const id = useId()

  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-11 md:h-11',
    lg: 'w-14 h-14 md:w-16 md:h-16',
    xl: 'w-20 h-20 md:w-24 md:h-24',
  }[size]

  const textSize = {
    sm: 'text-sm',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-4xl',
  }[size]

  const subtitleSize = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size]

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${iconDimensions} flex-shrink-0`}>
        <StockPulseMark uid={id} className="h-full w-full" />
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`font-semibold tracking-[-0.02em] text-foreground ${textSize} leading-none`}>
            StockPulse
          </span>
          {showSubtitle && (
            <span className={`uppercase tracking-[0.18em] text-muted ${subtitleSize} mt-1.5 font-medium`}>
              Store operations
            </span>
          )}
        </div>
      )}
    </div>
  )
}
