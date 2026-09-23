import { Archivo, Fraunces } from 'next/font/google'

/**
 * One display face per direction, so the three differ in voice and not only
 * in colour. Direction A deliberately adds nothing: it uses the Inter the root
 * layout already loads, which is part of its "almost no decoration" character.
 */

/** Direction B — a grotesk with tight, heavy display weights. */
export const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-dp-archivo',
  display: 'swap',
})

/** Direction C — an editorial serif with optical sizes and a true italic. */
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-dp-fraunces',
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz'],
})
