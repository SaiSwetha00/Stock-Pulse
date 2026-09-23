import Link from 'next/link'

/**
 * A small floating control for flipping between the three samples. It is part
 * of the preview harness, not of any concept, so it wears neutral styling of
 * its own and sits bottom-centre, clear of every concept's nav and CTAs.
 */
const CONCEPTS = [
  { n: 1, label: 'Minimal' },
  { n: 2, label: 'Grocery Ops' },
  { n: 3, label: 'B2B SaaS' },
] as const

export default function PreviewSwitcher({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav
      aria-label="Design samples"
      className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/10 bg-white p-1 font-[family-name:var(--font-inter)] text-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
    >
      <Link
        href="/landing-preview"
        className="rounded-full px-3 py-2 font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      >
        All
      </Link>
      {CONCEPTS.map((c) => (
        <Link
          key={c.n}
          href={`/landing-preview/${c.n}`}
          aria-current={c.n === current ? 'page' : undefined}
          aria-label={`Concept ${c.n}: ${c.label}`}
          className={`whitespace-nowrap rounded-full px-3.5 py-2 font-medium ${
            c.n === current ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          {/* Numbers only on a phone: "Concept 1" wrapped to two lines at 375px. */}
          <span className="sm:hidden">{c.n}</span>
          <span className="hidden sm:inline">
            {c.n} · {c.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}
