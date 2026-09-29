import type { Locale } from '@/lib/i18n/locales'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  type HelpArticle,
  type HelpBlock,
  type HelpCategoryKey,
  type HelpText,
} from './articles'
import { HELP_TEXT_TE } from './articles.te'
import { HELP_TEXT_HI } from './articles.hi'

/**
 * The Help Centre in one language, resolved on the server.
 *
 * THE SAME SHAPE AS THE APP'S DICTIONARIES (lib/i18n/client.tsx): a Server
 * Component picks the language from the cookie and hands the RESOLVED text
 * down, so only the reader's language reaches the browser. Nothing here may
 * be imported by a Client Component — it pulls in all three languages. The
 * Help Centre's client half receives these objects as props.
 *
 * Structure always comes from ./articles — slug, category, order. A
 * translation only replaces words, so links, "more on this" and result order
 * are identical in every language.
 */

export type LocalizedHelpCategory = {
  key: HelpCategoryKey
  title: string
  description: string
}

export type LocalizedHelpArticle = HelpArticle & {
  /**
   * Lowercased text to search against: the article in the reader's language
   * AND in English. English is kept in because shopkeepers type "CSV",
   * "SKU" and "stock" whatever language the screen is in, and a search that
   * found those only on the English screen would feel broken.
   */
  searchText: string
}

const TEXT: Record<Exclude<Locale, 'en'>, HelpText> = {
  te: HELP_TEXT_TE,
  hi: HELP_TEXT_HI,
}

function flatten(title: string, summary: string, body: HelpBlock[], category?: string): string {
  const parts: string[] = [title, summary]
  for (const block of body) {
    if (block.kind === 'p' || block.kind === 'h' || block.kind === 'note') parts.push(block.text)
    else parts.push(...block.items)
  }
  if (category) parts.push(category)
  return parts.join(' ')
}

export function localizedHelp(locale: Locale): {
  categories: LocalizedHelpCategory[]
  articles: LocalizedHelpArticle[]
} {
  const text = locale === 'en' ? null : TEXT[locale]

  const categories: LocalizedHelpCategory[] = HELP_CATEGORIES.map((c) => ({
    key: c.key,
    title: text?.categories[c.key].title ?? c.title,
    description: text?.categories[c.key].description ?? c.description,
  }))
  const categoryTitle = (key: HelpCategoryKey) => categories.find((c) => c.key === key)?.title
  const englishCategory = (key: HelpCategoryKey) => HELP_CATEGORIES.find((c) => c.key === key)?.title

  const articles: LocalizedHelpArticle[] = HELP_ARTICLES.map((a) => {
    const t = text?.articles[a.slug]
    const title = t?.title ?? a.title
    const summary = t?.summary ?? a.summary
    const body = t?.body ?? a.body
    const searchText = [
      flatten(title, summary, body, categoryTitle(a.category)),
      t ? flatten(a.title, a.summary, a.body, englishCategory(a.category)) : '',
    ]
      .join(' ')
      .toLowerCase()
    return { slug: a.slug, category: a.category, title, summary, body, searchText }
  })

  return { categories, articles }
}

/** One article in the reader's language, or undefined for an unknown slug. */
export function localizedArticle(locale: Locale, slug: string) {
  const { categories, articles } = localizedHelp(locale)
  const article = articles.find((a) => a.slug === slug)
  if (!article) return undefined
  return {
    article,
    category: categories.find((c) => c.key === article.category),
    related: articles.filter((a) => a.category === article.category && a.slug !== slug),
  }
}
