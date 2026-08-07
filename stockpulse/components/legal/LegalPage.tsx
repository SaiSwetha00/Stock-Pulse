import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Shell for the legal placeholder pages.
 *
 * Deliberately plain and light-themed rather than wearing the landing's black
 * identity: these are documents to be read, and one day printed or handed to a
 * lawyer. Wrapping them in `sp-landing` would give them a marketing costume
 * they should not have.
 *
 * `max-w-[68ch]` because prose stops being readable somewhere past 75
 * characters a line, and these pages are nothing but prose.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh bg-background px-6 py-16">
      <div className="mx-auto max-w-[68ch]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to StockPulse
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated {updated}</p>

        {/* Spacing and heading styles live here rather than on every paragraph,
            so the two documents cannot drift apart visually. */}
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-muted-strong [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground">
          {children}
        </div>
      </div>
    </main>
  )
}
