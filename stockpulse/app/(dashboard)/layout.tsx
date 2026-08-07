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
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <Sidebar role={profile.role} store={store} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="hidden lg:block">
              <Topbar store={store} profile={profile} initialUnread={Number(unread ?? 0)} />
            </div>
            <MobileHeader profile={profile} role={profile.role} store={store} />
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
