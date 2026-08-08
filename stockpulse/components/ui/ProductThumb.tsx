import Image from 'next/image'
import { isOptimizableImage } from '@/lib/images'

/**
 * A product's photo wherever a product is shown, with one placeholder.
 *
 * Every list that showed a product had grown its own `bg-surface-muted` square
 * containing two uppercase letters. They are one component now, so a product
 * reads the same in the inventory table, the sales picker and anywhere added
 * later — and adding photos did not mean editing four separate squares.
 *
 * The placeholder keeps the initials rather than a generic image icon: in a
 * list of thirty lines, "BA" and "CH" are scannable in a way that thirty
 * identical grey icons are not.
 */
export default function ProductThumb({
  name,
  imageUrl,
  size = 40,
  className = '',
}: {
  name: string
  imageUrl?: string | null
  /** Rendered edge in CSS pixels. Also the requested image width. */
  size?: number
  className?: string
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg bg-surface-muted ${className}`}
      style={{ width: size, height: size }}
    >
      {isOptimizableImage(imageUrl) ? (
        <Image src={imageUrl} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-bold text-muted"
          style={{ fontSize: Math.max(10, Math.round(size * 0.3)) }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  )
}
