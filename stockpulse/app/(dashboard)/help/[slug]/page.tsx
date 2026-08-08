import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Info } from 'lucide-react'
import {
  HELP_ARTICLES,
  getArticle,
  categoryFor,
  articlesInCategory,
  type HelpBlock,
} from '@/lib/help/articles'
import SupportRequestForm from '@/components/help/SupportRequestForm'
import { getCurrentUser } from '@/lib/data'

/**
 * Enumerates the valid slugs, so an unknown one is a 404 rather than a page
 * that renders half-empty.
 *
 * Note this does NOT make the route static: the page calls getCurrentUser() to
 * seed the support form, which reads cookies, so it renders dynamically. The
 * article body itself is module data and costs no round trip — the only wait is
 * the session lookup the whole dashboard already does.
 */
export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return { title: 'Article not found' }
  return {
    title: `${article.title} · StockPulse Help`,
    description: article.summary,
  }
}

/** One block of article body. Kept local — nothing else renders these. */
function Block({ block }: { block: HelpBlock }) {
  switch (block.kind) {
    case 'h':
      return <h2 className="sp-heading mt-9">{block.text}</h2>
    case 'p':
      // 65ch cap: past roughly 75 characters the eye loses the start of the
      // next line, which is what makes long-form text tiring to read.
      return (
        <p className="mt-4 max-w-[65ch] text-body leading-relaxed text-muted-strong">{block.text}</p>
      )
    case 'steps':
      return (
        <ol className="mt-4 max-w-[65ch] list-decimal space-y-2 pl-5 text-body leading-relaxed text-muted-strong marker:font-semibold marker:text-muted">
          {block.items.map((item) => (
            <li key={item} className="pl-1.5">
              {item}
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="mt-4 max-w-[65ch] list-disc space-y-2 pl-5 text-body leading-relaxed text-muted-strong marker:text-muted">
          {block.items.map((item) => (
            <li key={item} className="pl-1.5">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'note':
      return (
        <div className="mt-6 flex max-w-[65ch] gap-3 rounded-lg border border-border bg-surface-muted p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-strong">{block.text}</p>
        </div>
      )
  }
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const category = categoryFor(article.category)
  // "More in this category", minus the one being read.
  const related = articlesInCategory(article.category).filter((a) => a.slug !== article.slug)

  const { profile } = await getCurrentUser()

  return (
    <div className="sp-page max-w-[1100px]">
      <Link
        href="/help"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-muted-strong transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All help topics
      </Link>

      <article className="mt-6">
        {category && (
          <p className="text-label font-semibold uppercase tracking-[0.14em] text-muted">
            {category.title}
          </p>
        )}
        <h1 className="mt-2 max-w-[22ch] text-xl font-bold leading-tight text-foreground lg:text-2xl">
          {article.title}
        </h1>
        <p className="mt-3 max-w-[65ch] text-body leading-relaxed text-muted">{article.summary}</p>

        <div className="mt-2 border-t border-border pt-2">
          {article.body.map((block, i) => (
            // Index key is safe here: article bodies are static module data and
            // are never reordered, inserted into, or filtered at runtime.
            <Block key={i} block={block} />
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="sp-heading">More on this</h2>
          <ul className="mt-4 space-y-2">
            {related.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/help/${a.slug}`}
                  className="block rounded-lg border border-border bg-surface p-4 transition hover:border-border-strong hover:bg-surface-muted"
                >
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="mt-1 text-sm text-muted">{a.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <div className="max-w-xl">
          <SupportRequestForm defaultName={profile.full_name} defaultEmail={profile.email} />
        </div>
      </section>
    </div>
  )
}
