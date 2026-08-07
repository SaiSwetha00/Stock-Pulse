import { Fragment } from 'react'

/**
 * Renders the small amount of markdown the model actually emits — **bold** and
 * `code` — as real elements instead of literal asterisks.
 *
 * Deliberately not a markdown library: the assistant's replies are short
 * operational answers, and the surrounding bubble already uses
 * `whitespace-pre-wrap`, so line breaks and numbered lists render correctly on
 * their own. Only inline emphasis was leaking through as raw syntax.
 *
 * Splitting on a capturing regex keeps the delimiters in the output array, so
 * odd indices are the matches and even indices the plain text between them.
 */
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={i} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
