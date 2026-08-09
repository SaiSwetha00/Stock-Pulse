'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X, FileQuestion } from 'lucide-react'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  articleMatches,
  articlesInCategory,
} from '@/lib/help/articles'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

/** Offered when a search finds nothing — each is a term that does match. */
const SUGGESTED_SEARCHES = ['low stock', 'import CSV', 'shift', 'password', 'roles']

export default function HelpCenterClient() {
  const [search, setSearch] = useState('')

  /**
   * Debounce, but without a timer.
   *
   * `useDeferredValue` lets the input update at full speed while the list
   * re-filters at a lower priority, and React abandons a stale filter pass when
   * another keystroke arrives. A setTimeout debounce would instead make the
   * field itself feel laggy on the first character and still do the work every
   * 300ms whether or not it was still wanted.
   */
  const deferredSearch = useDeferredValue(search)
  const isSearching = deferredSearch.trim().length > 0

  const results = useMemo(
    () => (isSearching ? HELP_ARTICLES.filter((a) => articleMatches(a, deferredSearch)) : []),
    [deferredSearch, isSearching],
  )

  return (
    // Was `mx-auto max-w-[1100px] px-6 py-10` with a hand-rolled eyebrow and a
    // bold Inter h1 — the last page in the app still inventing its own frame.
    // sp-page/sp-eyebrow/sp-title put it on the same grid and in the same
    // voice as every other module; max-w keeps the centred reading measure,
    // which is right for prose and wrong for a table.
    <div className="sp-page max-w-[1100px]">
      <div className="sp-rise text-center">
        <p className="sp-eyebrow">Help Centre</p>
        <h1 className="sp-title mt-2">How can we help?</h1>
        <p className="mx-auto mt-3 max-w-[55ch] text-body leading-relaxed text-muted">
          Search the guides, or browse by topic below. Every article describes what StockPulse
          actually does today.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            aria-label="Search help articles"
            placeholder="Search help articles…"
            // The last toolbar control still off-family, and it disagreed on
            // the one thing D28 says these must share: it rested on
            // `bg-surface` where the other eight rest on `bg-surface-muted`,
            // so it read as a panel rather than a field, and it never changed
            // fill on focus. Same skin as Field's CONTROL now — resting
            // muted, `focus:bg-surface`, 150ms on both properties — while the
            // layout stays a toolbar: icon inside the box, placeholder doing
            // the labelling, clear button on the right.
            className="control-h w-full rounded-lg border border-border bg-surface-muted pl-11 pr-12 text-sm text-foreground transition-[border-color,background-color] duration-150 placeholder:text-muted focus:border-border-strong focus:bg-surface focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="tap-target absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-muted transition hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <section className="mt-10" aria-live="polite">
          <h2 className="text-sm font-semibold text-muted">
            {results.length === 0
              ? `No articles match “${deferredSearch.trim()}”`
              : `${results.length} ${results.length === 1 ? 'article' : 'articles'} matching “${deferredSearch.trim()}”`}
          </h2>

          {results.length === 0 ? (
            <EmptyState
              icon={FileQuestion}
              title="Nothing found for that"
              description="Try a broader word, or one of these:"
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_SEARCHES.map((term) => (
                    <Button key={term} variant="secondary" size="sm" onClick={() => setSearch(term)}>
                      {term}
                    </Button>
                  ))}
                </div>
              }
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {results.map((a, i) => (
                <li key={a.slug}>
                  {/* These ARE links, so a hover response is honest here in a
                      way it is not on the category cards. Kept as the border
                      and tint it already had rather than promoted to
                      `sp-lift` — a result row lifting off the page competes
                      with the search box above it. */}
                  <Link
                    href={`/help/${a.slug}`}
                    className={`sp-rise sp-delay-${Math.min(i + 1, 6)} sp-e1 block rounded-2xl border border-border bg-surface p-4 transition hover:border-border-strong hover:bg-surface-muted`}
                  >
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{a.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-10">
          <h2 className="sp-heading">Browse topics</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {HELP_CATEGORIES.map((category, i) => {
              const Icon = category.icon
              const articles = articlesInCategory(category.key)
              if (articles.length === 0) return null

              return (
                // Was `rounded-lg border bg-surface p-5` with no elevation and
                // no entrance — the only cards in the app sitting flat on the
                // page. `sp-e1` and the card radius put them on the same rung
                // as every other module; `sp-card-p` replaces the one-off p-5.
                // No `sp-lift`: the card is not a link (D27) — the article
                // titles inside it are.
                <div
                  key={category.key}
                  className={`sp-card-p sp-rise sp-delay-${Math.min(i + 1, 6)} sp-e1 rounded-2xl border border-border bg-surface`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">
                    <Icon className="h-5 w-5 text-muted-strong" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">{category.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{category.description}</p>

                  {/* The card is not itself a link. Each article inside it is —
                      a card wrapping several destinations has to pick one, and
                      picking one makes the other titles look clickable while
                      going somewhere else. */}
                  <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
                    {articles.map((a) => (
                      <li key={a.slug}>
                        <Link
                          href={`/help/${a.slug}`}
                          className="block rounded-md py-1 text-sm font-medium text-muted-strong transition hover:text-foreground"
                        >
                          {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
