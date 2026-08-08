import { Database, ArrowRight } from 'lucide-react'
import Link from 'next/link'

/**
 * Shown when the `customers` table has not been created yet. Migrations in this
 * project are applied by hand in the Supabase SQL editor, so a missing table is
 * an expected setup state rather than an error.
 */
export default function CustomersSetupNotice() {
  return (
    <div className="sp-page">
      <div>
        <p className="sp-eyebrow">Relationships</p>
        <h1 className="sp-title mt-2">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Customer profiles, purchase history, and loyalty tiers.
        </p>
      </div>

      <div className="mt-8 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted">
          <Database className="h-6 w-6 text-muted-strong" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-foreground">One setup step remaining</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          The <code className="rounded bg-surface-muted px-1.5 py-0.5 text-muted-strong">customers</code>{' '}
          table has not been created yet. Open the Supabase SQL editor for this project, paste the
          contents of{' '}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-muted-strong">
            supabase/schema_phase4.sql
          </code>
          , and run it. Reload this page afterwards and customer management will be live.
        </p>

        <ol className="mt-6 space-y-3 text-sm text-muted-strong">
          {[
            'Open your Supabase project → SQL Editor → New query.',
            'Paste the full contents of supabase/schema_phase4.sql.',
            'Press Run, then reload this page.',
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-surface">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <Link
          href="/settings"
          className="mt-7 inline-flex control-h items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-surface transition hover:opacity-90 active:scale-[0.98]"
        >
          Go to Settings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
