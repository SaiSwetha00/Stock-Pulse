import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Join class names, letting later Tailwind utilities win over earlier ones.
 * Without twMerge, `cn('px-3', 'px-6')` would emit both and leave the winner
 * up to stylesheet order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
