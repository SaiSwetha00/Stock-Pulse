import type { ReactNode } from 'react'

/**
 * The top of every page in the app: eyebrow, title, one primary action.
 *
 * Six modules had each grown their own version of this. Four used
 * `text-3xl font-bold`, two used `text-2xl lg:text-3xl`; none carried an
 * eyebrow, and the action sat in a different place on each. The result read as
 * six screens that happened to share a sidebar.
 *
 * The title is Cinzel (`sp-title`), the wordmark's family, which is what ties
 * the app to the landing page rather than leaving it looking like a separate
 * product behind a login.
 *
 * `action` is deliberately singular. A page with three equally-weighted buttons
 * at the top has no primary action, and the one thing someone came to do stops
 * being obvious. Secondary controls belong beside the content they affect.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <p className="sp-eyebrow">{eyebrow}</p>
        <h1 className="sp-title mt-2">{title}</h1>
        {description && <p className="sp-body mt-2 max-w-[62ch]">{description}</p>}
      </div>
      {/* shrink-0 so a long title wraps rather than crushing the action, and
          flex-wrap on the parent so the action drops to its own line before it
          can overflow — which is the same failure the Settings theme toggle
          hit when it escaped its card. */}
      {action && <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div>}
    </div>
  )
}
