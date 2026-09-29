'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, RotateCcw, Mail } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { LocalDateTime } from '@/components/ui/LocalTime'
import { useToast } from '@/components/ui/Toast'
import { setRequestStatus } from '@/app/(dashboard)/support/actions'
import { useAppCopy } from '@/lib/i18n/client'
import { supportCategories } from '@/lib/validation/supportRequest'

export type SupportRequestRow = {
  id: string
  reference: string
  name: string
  email: string
  category: string
  message: string
  created_at: string
  status: 'open' | 'resolved'
  resolved_at: string | null
}

/**
 * The owner's view of what people have asked for help with.
 *
 * Until now these rows existed only in the database — the form wrote them and
 * nothing ever read them back, so the only way to see a request was to open
 * Supabase. That is not support, it is a suggestion box with the lid welded on.
 */
export default function SupportClient({ requests }: { requests: SupportRequestRow[] }) {
  const toast = useToast()
  const copy = useAppCopy()
  const t = copy.support
  // The stored value is a key ('inventory', 'bug'); the form that wrote it
  // labels those keys from the help copy, so the triage list reads the same
  // labels. An unknown key (a future category) still shows, as itself.
  const categoryLabels = useMemo(
    () => new Map<string, string>(supportCategories(copy.help).map((c) => [c.value, c.label])),
    [copy],
  )
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  // Open first: a resolved ticket is history, an open one is work.
  const [filter, setFilter] = useState<'open' | 'all'>('open')

  const visible = filter === 'open' ? requests.filter((r) => r.status === 'open') : requests
  const openCount = requests.filter((r) => r.status === 'open').length

  function toggle(row: SupportRequestRow) {
    setBusyId(row.id)
    startTransition(async () => {
      const next = row.status === 'open' ? 'resolved' : 'open'
      const result = await setRequestStatus(row.id, next)
      setBusyId(null)
      if (!result.ok) {
        toast.error(t.updateFailed, result.message)
        return
      }
      toast.success(next === 'resolved' ? t.markedResolved : t.reopened, row.reference)
    })
  }

  return (
    <div className="sp-stack">
      {/* A filter, not the page's action.

          These two wore the primary skin when selected — `bg-foreground
          text-surface`, the same near-black as a Save button — which made the
          loudest control on a triage screen a thing that only changes what is
          listed. Secondary when selected and ghost when not keeps the emphasis
          where the work is, and `aria-pressed` still says which is on. */}
      <div className="flex flex-wrap items-center gap-2">
        {(['open', 'all'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'secondary' : 'ghost'}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={filter === f ? 'border-border-strong text-foreground' : undefined}
          >
            {f === 'open'
              ? t.filterOpen.replace('{n}', String(openCount))
              : t.filterAll.replace('{n}', String(requests.length))}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filter === 'open' ? t.nothingTitle : t.emptyTitle}
          description={filter === 'open' ? t.nothingBody : t.emptyBody}
        />
      ) : (
        <ul className="sp-stack">
          {visible.map((r, i) => (
            // Stagger capped at 6: sp-delay only defines six rungs, and past
            // half a second an entrance stops reading as one movement and
            // starts reading as a list loading slowly.
            <li
              key={r.id}
              className={`sp-card-p sp-rise sp-delay-${Math.min(i + 1, 6)} sp-e1 rounded-2xl border border-border bg-surface shadow-sm`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-strong">
                      {r.reference}
                    </span>
                    <Badge tone={r.status === 'open' ? 'warning' : 'success'}>
                      {r.status === 'open' ? t.statusOpen : t.statusResolved}
                    </Badge>
                    <Badge tone="neutral">{categoryLabels.get(r.category) ?? r.category}</Badge>
                  </div>
                  <p className="sp-subheading mt-2">{r.name}</p>
                  <p className="text-xs text-muted">
                    {/* mailto, because the next thing anyone does with a
                        support request is reply to it. */}
                    <a
                      href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.reference}`)}`}
                      className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                    >
                      <Mail className="h-3 w-3" aria-hidden="true" />
                      {r.email}
                    </a>
                    {' · '}
                    <LocalDateTime iso={r.created_at} />
                  </p>
                </div>

                {/* Secondary, not primary, and deliberately so: there is one
                    of these per row, and N high-emphasis buttons is the same
                    as none. `loading` replaces the hand-rolled spinner
                    branch — Button keeps the label in place while it spins,
                    so the row does not reflow mid-click. */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggle(r)}
                  loading={pending && busyId === r.id}
                >
                  {!(pending && busyId === r.id) &&
                    (r.status === 'open' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    ))}
                  {r.status === 'open' ? t.markResolved : t.reopen}
                </Button>
              </div>

              <p className="sp-body mt-3 whitespace-pre-wrap border-l-2 border-border pl-3">
                {r.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
