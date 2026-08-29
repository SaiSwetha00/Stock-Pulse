import { getCurrentUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import MobileHeader from '@/components/layout/MobileHeader'
import MobileTabBar from '@/components/layout/MobileTabBar'
import PageTransition from '@/components/layout/PageTransition'
import AIAssistantProvider from '@/components/ai/AIAssistantProvider'
import CommandPaletteProvider from '@/components/command/CommandPaletteProvider'
import ToastProvider from '@/components/ui/Toast'
import { isDemoAccount } from '@/lib/demo'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, store } = await getCurrentUser()

  // Read here rather than from an effect in the bell: the badge is part of
  // the first paint, so fetching it on mount would flash a countless bell on
  // every navigation and cost a round trip the layout was already making.
  // The function counts through the viewer's own select policy.
  const supabase = await createClient()
  const { data: unread } = await supabase.rpc('unread_notification_count')

  return (
    <ToastProvider>
      <AIAssistantProvider profile={profile} store={store}>
      <CommandPaletteProvider role={profile.role}>
        {/* First thing in the tab order: the sidebar is a dozen links, and
            without this a keyboard user pays that cost on every navigation
            before reaching the page they asked for. */}
        <a href="#main-content" className="skip-link">
          Skip to main content
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

          Fixed to the bottom-left, above the mobile tab bar (bottom-24) and
          low on desktop (lg:bottom-4), so it sits clear of the Topbar, the
          MobileHeader and the page content rather than pushing any of them
          around. pointer-events-none so it can never intercept a click meant
          for the UI underneath.
        */}
        {isDemoAccount(profile) && (
          <div
            className="pointer-events-none fixed bottom-24 left-4 z-40 lg:bottom-4"
            role="status"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning-bg px-3 py-1.5 text-xs font-semibold text-warning shadow-sm backdrop-blur">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warning" />
              Demo store — sample data
            </span>
          </div>
        )}

        <div className="flex h-screen w-full overflow-hidden bg-background">
          <Sidebar role={profile.role} store={store} />
          <div className="flex flex-1 flex-col overflow-hidden">
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
              className="flex-1 overflow-y-auto pb-20 focus:outline-none lg:pb-0"
            >
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
          <MobileTabBar />
        </div>
      </CommandPaletteProvider>
      </AIAssistantProvider>
    </ToastProvider>
  )
}
