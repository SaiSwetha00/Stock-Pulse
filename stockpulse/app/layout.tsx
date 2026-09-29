import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
// Constants only — from the leaf module, so the landing page's dictionary is
// not pulled into every route's bundle by this layout.
import { LOCALES, LOCALE_COOKIE, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { siteUrl } from "@/lib/site";
import "./globals.css";
import RegisterServiceWorker from '@/components/pwa/RegisterServiceWorker'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * Cinzel, the wordmark's family, for page titles inside the app.
 *
 * The shell loaded Inter and nothing else, while the landing and auth shells
 * pulled Cinzel in themselves — which is precisely why the dashboard read as a
 * different product from the page that sells it. Loading it here puts the same
 * voice on both sides of the sign-in.
 *
 * Titles only. Body copy, tables and forms stay in Inter, which is built for
 * exactly that and which Cinzel would make unreadable at 13px.
 */
const cinzel = Cinzel({
  variable: "--font-cinzel-app",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // metadataBase resolves every relative OG/canonical URL below and in each
  // page's own metadata. Without it Next warns and emits relative OG urls,
  // which most social scrapers refuse to follow.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "StockPulse — Neighborhood Market Operations",
    template: "%s · StockPulse",
  },
  description: "Inventory, sales, and store management for small grocery stores.",
  applicationName: "StockPulse",
  keywords: [
    "grocery store software",
    "small business inventory",
    "point of sale",
    "stock management",
    "independent retailer",
  ],
  openGraph: {
    siteName: "StockPulse",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

/**
 * The codes the boot script may write into <html lang>. English is excluded
 * because it is what the attribute already says — derived from LOCALES rather
 * than listed again, so adding a language cannot leave this behind.
 */
const TRANSLATED_LOCALES = LOCALES.filter((c) => c !== DEFAULT_LOCALE)

/**
 * Paths that stay English whatever the language preference says, so the boot
 * script must not relabel them.
 *
 * Stage 1 did the opposite — it applied the locale only on `/` — because the
 * landing page was then the only translated surface. Now that the auth pages
 * and the authenticated shell are translated too, an allowlist would have to
 * grow with every screen. A denylist of the surfaces that stay English is
 * shorter and needs no edit as more of the app is translated.
 *
 * The legal pages are written and reviewed in English; the design previews are
 * internal throwaways.
 */
const ENGLISH_ONLY_PATHS = [
  '/privacy',
  '/terms',
  '/design-preview',
  '/design-exploration',
  '/auth-preview',
  '/brand-preview',
  '/landing-preview',
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before paint so there is no light/dark
            flash, and corrects <html lang> for the one translated page.

            Deliberately a raw <script> in <head>, NOT next/script with
            strategy="beforeInteractive": that variant left every authenticated
            route rendering an empty <main> on a full page load, because the
            hoisted script ran ahead of React's streaming swap and the Suspense
            boundary never resolved. React logs a dev-only warning about script
            tags in components; a benign warning beats a blank page.

            WHY THE LANGUAGE IS READ HERE AND NOT ON THE SERVER. Calling
            cookies() in this layout would opt EVERY page into dynamic
            rendering — /login, /signup, /privacy, /terms and the design
            previews are all statically rendered today — to serve one attribute
            on one page. Reading it in a script that already runs before paint
            costs nothing and sets the attribute before anything is painted or
            announced.

            The attribute is then right in both cases, not merely close: a
            request WITHOUT the cookie is served English content, so `lang=en`
            in that HTML is correct rather than a compromise. Only a visitor
            who has chosen Telugu or Hindi receives translated content, and
            only for them does this rewrite it.

            THE PATH GUARD IS LOAD-BEARING. The locale cookie belongs to the
            landing page; the authenticated app is not translated. Without the
            guard, choosing Telugu once would tell a screen reader that the
            English dashboard is Telugu on every page thereafter. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var ENGLISH_ONLY=${JSON.stringify(ENGLISH_ONLY_PATHS)};try{var s=localStorage.getItem('sp-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}try{if(!ENGLISH_ONLY.some(function(x){return location.pathname===x||location.pathname.indexOf(x+'/')===0})){var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);var l=m&&decodeURIComponent(m[1]);if(${TRANSLATED_LOCALES.map((c) => `l==='${c}'`).join('||')})document.documentElement.lang=l}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Renders nothing. Mounted at the root rather than in the (dashboard)
            layout so the worker is registered on the public pages too — the
            landing page is where someone is most likely to install the app,
            and a worker that only registers after sign-in cannot cache the
            shell for the sign-in screen itself. */}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
