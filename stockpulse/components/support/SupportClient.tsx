'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, RotateCcw, Mail, Loader2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { LocalDateTime } from '@/components/ui/LocalTime'
import { useToast } from '@/components/ui/Toast'
import { setRequestStatus } from '@/app/(dashboard)/support/actions'

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
        toast.error('Could not update the request', result.message)
        return
      }
      toast.success(next === 'resolved' ? 'Marked resolved' : 'Reopened', row.reference)
    })
  }

  return (
    <div className="sp-stack">
      <div className="flex flex-wrap items-center gap-2">
        {(['open', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`control-h-sm rounded-lg px-3 text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-foreground text-surface'
                : 'border border-border text-muted-strong hover:bg-surface-muted'
            }`}
          >
            {f === 'open' ? `Open (${openCount})` : `All (${requests.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filter === 'open' ? 'Nothing waiting' : 'No requests yet'}
          description={
            filter === 'open'
              ? 'Every support request has been dealt with.'
              : 'Requests raised from the Help Centre will appear here.'
          }
        />
      ) : (
        <ul className="sp-stack">
          {visible.map((r) => (
            <li key={r.id} className="sp-card-p rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-strong">
                      {r.reference}
                    </span>
                    <Badge tone={r.status === 'open' ? 'warning' : 'success'}>
                      {r.status === 'open' ? 'Open' : 'Resolved'}
                    </Badge>
                    <Badge tone="neutral">{r.category}</Badge>
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

                <button
                  type="button"
                  onClick={() => toggle(r)}
                  disabled={pending && busyId === r.id}
                  className="control-h-sm inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-strong transition-colors hover:bg-surface-muted disabled:opacity-60"
                >
                  {pending && busyId === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : r.status === 'open' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {r.status === 'open' ? 'Mark resolved' : 'Reopen'}
                </button>
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
