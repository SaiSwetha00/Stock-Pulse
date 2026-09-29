import { cookies } from 'next/headers'
import { LOCALE_COOKIE, toLocale, type Locale } from './locales'

/**
 * The visitor's chosen language, read on the server.
 *
 * WHY THIS IS ITS OWN FILE. ./locales and ./landing are imported by Client
 * Components, and `cookies()` cannot be. Isolating the read here keeps the
 * server-only dependency out of anything the browser pulls in. (The
 * `server-only` package would enforce that at build time, but it is not a
 * dependency of this project and adding one for a guard is not worth it —
 * importing next/headers from a client file already fails the build.)
 *
 * CALLING THIS MAKES A ROUTE DYNAMIC, and that is fine everywhere it is used:
 * app/page.tsx and app/(dashboard)/layout.tsx already call
 * supabase.auth.getUser() on every request, and the auth pages are forms whose
 * prerendering buys nothing. It is deliberately NOT called from app/layout.tsx
 * — that would make every route dynamic, including /privacy and /terms, which
 * is why <html lang> is set by the boot script there instead.
 *
 * A missing or unrecognised cookie yields English, so opening an app URL
 * directly with no preference behaves exactly as it does today.
 */
export async function getLocale(): Promise<Locale> {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value)
}
