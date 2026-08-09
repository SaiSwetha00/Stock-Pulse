import Image from 'next/image'
import { isOptimizableImage } from '@/lib/images'
import { LineArtPhoto } from '@/components/ui/LineArt'

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
  // Below this edge the slot is a list-row marker and initials win; at or
  // above it the slot is big enough to read as a picture frame, and two large
  // letters in it look like a missing image rather than a placeholder.
  const showDrawing = size >= 56

  return (
    <div
      className={`sp-img-slot shrink-0 overflow-hidden rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      {isOptimizableImage(imageUrl) ? (
        <Image src={imageUrl} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : showDrawing ? (
        // The drawing sits at 55% of the slot and low opacity, so the slot
        // reads as "a photo goes here" rather than as an icon that means
        // something. Same box either way — swapping a real photo in shifts
        // nothing, which is the whole point of building the fallback first.
        <div aria-hidden="true" className="flex h-full w-full items-center justify-center">
          <LineArtPhoto className="h-[55%] w-[55%] opacity-40" />
        </div>
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
