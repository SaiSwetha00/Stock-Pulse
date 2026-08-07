import Link from 'next/link'
import { Compass, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
          <Compass className="h-7 w-7 text-zinc-700" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          That page doesn&apos;t exist, or it may have moved. Check the address, or head back to
          your dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex control-h items-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
