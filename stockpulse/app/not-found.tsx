import Link from 'next/link'
import { Compass, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-6">
      <div className="w-full max-w-md sp-rise rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center sp-rise rounded-2xl border border-border bg-surface-muted">
          <Compass className="h-7 w-7 text-muted-strong" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          That page doesn&apos;t exist, or it may have moved. Check the address, or head back to
          your dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex control-h items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-surface transition hover:opacity-90 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
