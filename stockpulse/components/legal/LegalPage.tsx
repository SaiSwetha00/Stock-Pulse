import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Shell for the legal documents.
 *
 * Deliberately plain and light-themed rather than wearing the landing's black
 * identity: these are documents to be read, and one day printed or handed to a
 * lawyer. Wrapping them in `sp-landing` would give them a marketing costume
 * they should not have.
 *
 * `max-w-[68ch]` because prose stops being readable somewhere past 75
 * characters a line, and these pages are nothing but prose.
 *
 * SECTIONS ARE DATA, AND THAT IS THE POINT.
 *   The table of contents and the headings render from the same array, so a
 *   contents entry cannot point at a section that does not exist and a section
 *   cannot go missing from the contents. Hand-written anchor lists drift the
 *   moment somebody renames a heading — this codebase has already paid for
 *   that class of bug in `lib/nav.ts` and in `ROLE_STYLES`. One array, two
 *   renderings, no way for them to disagree.
 */

export type LegalSection = {
  /** The anchor. Kebab-case; becomes both `href="#id"` and the section's id. */
  id: string
  title: string
  body: React.ReactNode
}

/**
 * A blank the business has to fill in.
 *
 * Rendered loudly on purpose. These documents are drafts, and the difference
 * between a draft that says "TODO — registered address" and one that quietly
 * invents an address is the difference between an unfinished document and a
 * false one. Never replace one of these with a guess.
 */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded-sm bg-warning-bg px-1.5 py-0.5 font-semibold text-warning">
      [TODO — {children}]
    </mark>
  )
}

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  /** Sits above the contents: what this document is and is not. */
  intro: React.ReactNode
  sections: LegalSection[]
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

        {/* The one thing a reader must not miss, so it is not in a section
            they can skip past via the contents. */}
        <div
          role="note"
          className="mt-6 rounded-lg border border-warning bg-warning-bg px-4 py-3 text-sm text-warning"
        >
          <p className="font-semibold">Draft — not yet reviewed by a lawyer.</p>
          <p className="mt-1">
            This document describes what the software actually does, and it is written to be
            reviewed rather than relied on. It has not been checked by a qualified lawyer in any
            jurisdiction. Every <span className="font-semibold">[TODO]</span> below is a blank the
            business must fill in before anyone relies on this.
          </p>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-strong">{intro}</div>

        <nav
          aria-labelledby="toc-heading"
          className="mt-10 rounded-lg border border-border bg-surface p-5"
        >
          <h2 id="toc-heading" className="text-sm font-bold text-foreground">
            Contents
          </h2>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`#${s.id}`}
                  className="text-muted-strong underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  <span className="tabular-nums text-muted">{i + 1}.</span> {s.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          // scroll-mt keeps a jumped-to heading off the very top edge of the
          // viewport, where it reads as having scrolled past itself.
          <section key={s.id} id={s.id} className="scroll-mt-8">
            <h2 className="mt-10 text-lg font-bold text-foreground">
              <span className="tabular-nums text-muted">{i + 1}.</span> {s.title}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-strong [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
