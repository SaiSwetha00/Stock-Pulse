'use client'

import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_LABELS, type Locale } from '@/lib/i18n'

/**
 * The landing page's language control — the ONLY language control in the app.
 * The authenticated side has none, deliberately.
 *
 * WHY A NATIVE <select> RATHER THAN A CUSTOM MENU. Three options in three
 * scripts, in a sticky navbar that has to survive 375px. A native select gets
 * keyboard operation, type-ahead, screen-reader semantics and the platform's
 * own picker on a phone for free — and, the reason that settles it, its option
 * list is drawn by the OS outside the document, so it cannot clip against the
 * sticky header or widen the navbar. A custom dropdown would have to re-earn
 * all of that and could only lose.
 *
 * HOW THE CHANGE TAKES EFFECT. The cookie is written here, then
 * `router.refresh()` re-runs the Server Component with it, so the new language
 * arrives as server-rendered HTML rather than being swapped in on the client.
 * Nothing flashes, scroll position is kept, and a reload or a reopened tab
 * reads the same cookie. See lib/i18n for why a cookie and not localStorage.
 *
 * `document.documentElement.lang` is set here too. The root layout hard-codes
 * lang="en" and is shared by every route, including statically rendered ones;
 * making it read the cookie would turn the whole app dynamic to serve one
 * attribute on one page. Setting it client-side keeps that cost at zero. The
 * trade is that the first HTML a crawler sees still says `en` — noted rather
 * than hidden.
 */
export default function LanguageSelector({
  locale,
  label,
  className = '',
}: {
  locale: Locale
  /** Already translated by the caller, so the control names itself in the current language. */
  label: string
  className?: string
}) {
  const router = useRouter()

  function choose(next: string) {
    if (!LOCALES.includes(next as Locale) || next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
    document.documentElement.lang = next
    router.refresh()
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe
        className="pointer-events-none absolute left-3 h-4 w-4 text-[#8FA2FF]"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <select
        value={locale}
        onChange={(e) => choose(e.target.value)}
        aria-label={label}
        className="h-10 cursor-pointer appearance-none rounded-full border bg-transparent pl-9 pr-8 text-[14px] text-[#C4CADB] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8FA2FF]"
        style={{ borderColor: 'rgba(255,255,255,0.12)' }}
      >
        {LOCALES.map((l) => (
          // The option list is OS-drawn and does not inherit the page's
          // colours — these keep it legible wherever the platform honours them.
          <option key={l} value={l} style={{ background: '#0A0F1F', color: '#EEF0F6' }}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      {/* The chevron that appearance-none removed. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-3 h-[6px] w-[10px] text-[#8A93AB]"
      >
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
