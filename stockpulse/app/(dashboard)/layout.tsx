import { getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileTabBar from '@/components/layout/MobileTabBar'
// PREVIEW ONLY: adds the redesigned theme's class when ?brand=1 is on the URL.
// Boot applies it before the first paint (so there is no flash of the old
// design); Theme keeps it applied across client-side navigations and imports
// the stylesheet. Neither touches data; remove these two imports and their
// elements below to drop the preview entirely.
import BrandPreviewBoot from '@/components/app-theme/BrandPreviewBoot'
import BrandPreviewTheme from '@/components/app-theme/BrandPreviewTheme'
import PageTransition from '@/components/layout/PageTransition'
import AIAssistantProvider from '@/components/ai/AIAssistantProvider'
import CommandPaletteProvider from '@/components/command/CommandPaletteProvider'
import ToastProvider from '@/components/ui/Toast'
import { isDemoAccount } from '@/lib/demo'
import { appCopy } from '@/lib/i18n/app'
import { AppCopyProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, store } = await getCurrentUser()

  // Read here rather than from an effect in the bell: the badge is part of
  // the first paint, so fetching it on mount would flash a countless bell on
  // every navigation and cost a round trip the layout was already making.
  // The function counts through the viewer's own select policy.
  const supabase = await createClient()
  const { data: unread } = await supabase.rpc('unread_notification_count')

  // The badge reserves a lane at the foot of the scroller (below), so whether
  // it is shown has to be known before <main> is rendered.
  const showDemoBadge = isDemoAccount(profile)

  // The language chosen on the landing page, carried through sign-in by the
  // same cookie. Free here: this layout is already dynamic because of
  // getCurrentUser() above. Resolved once on the server and handed to the
  // shell's Client Components, so only the active language reaches the browser.
  const locale = await getLocale()
  const t = appCopy(locale)

  return (
    <>
      {/* First thing the layout emits, so it runs before the shell below it is
          parsed and painted. PREVIEW ONLY.

          Outside the providers deliberately: they are Client Components, and a
          raw <script> re-rendered inside a client boundary makes React log
          "Encountered a script tag while rendering React component" on every
          client-side navigation. Kept as a plain server-rendered sibling, it
          is emitted once with the document and never re-rendered. */}
      <BrandPreviewBoot />
      <AppCopyProvider locale={locale} copy={t}>
      <ToastProvider>
      <AIAssistantProvider profile={profile} store={store}>
      <CommandPaletteProvider role={profile.role}>
        {/* First thing in the tab order: the sidebar is a dozen links, and
            without this a keyboard user pays that cost on every navigation
            before reaching the page they asked for. */}
        <a href="#main-content" className="skip-link">
          {t.shell.skipToContent}
        </a>
        {/*
          Demo marker.

          Server-rendered from the profile, so it is present in the very first
          HTML of every authenticated page and there is no frame in which the
          demo store is indistinguishable from a real one. It carries no
          dismiss control and no client state: the only way to remove it is to
          stop being the demo account.

          It is a label and nothing else — `isDemoAccount` gates this badge and
          never data or permission, which stay with RLS and lib/permissions.ts.

          IT IS NO LONGER `fixed`, and that is the fix for a real defect. As a
          fixed chip at the bottom-left it floated over whatever happened to be
          at that screen position: measured at 375px while scrolling, it sat on
          top of the Low Stock figure, "Restock" and "Write off" actions, alert
          text and a product name — eight of eleven scroll positions had
          content underneath it. Bottom padding on the scroller was tried first
          and is not a fix: it reserves space at the END of the page, while a
          fixed element overlays content all the way DOWN it.

          So it moved out of the overlay layer and into the shell, as its own
          row below <main>. The scroller shrinks by exactly the badge's height,
          which means content cannot reach it at any scroll position, at any
          width — and the badge is still on screen at all times, which is the
          whole point of it. Nothing is hidden and nothing is conditional on
          viewport size.

          Rendered below, after <main>, so it reads last in the tab and screen
          reader order — it is a label about the data, not a control.
        */}

        <BrandPreviewTheme />
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <Sidebar role={profile.role} store={store} />
          {/* The tab-bar clearance moved here from <main>'s own padding, so
              that the demo badge row below can sit inside the shell and above
              the fixed tab bar rather than floating over the page. Content
              behaves identically: the scroller simply ends where the padding
              begins instead of padding itself. */}
          <div className="flex flex-1 flex-col overflow-hidden pb-20 lg:pb-0">
            <div className="hidden lg:block">
              <Topbar store={store} profile={profile} initialUnread={Number(unread ?? 0)} />
            </div>
            <MobileHeader
              profile={profile}
              role={profile.role}
              store={store}
              initialUnread={Number(unread ?? 0)}
            />
            {/* tabIndex={-1} so the skip link can actually move focus here;
                without it the browser scrolls but focus stays behind, and the
                next Tab returns to the navigation. */}
            <main
              id="main-content"
              tabIndex={-1}
              className="min-h-0 flex-1 overflow-y-auto focus:outline-none"
            >
              <PageTransition>{children}</PageTransition>
            </main>

            {/* The demo marker — see the note above. A shrink-0 row, so the
                scroller gives up exactly this much height and no content can
                ever be underneath it. */}
            {showDemoBadge && (
              <div
                role="status"
                className="shrink-0 border-t border-border bg-surface px-4 py-2 lg:px-6"
              >
                <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-warning/40 bg-warning-bg px-3 py-1 text-xs font-semibold text-warning">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  {t.shell.demoBadge}
                </span>
              </div>
            )}
          </div>
          <MobileTabBar />
        </div>
      </CommandPaletteProvider>
      </AIAssistantProvider>
      </ToastProvider>
      </AppCopyProvider>
    </>
  )
}
