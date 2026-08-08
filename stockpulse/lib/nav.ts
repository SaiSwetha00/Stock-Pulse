import {
  LayoutGrid,
  Archive,
  TrendingUp,
  Users,
  Truck,
  UserSquare2,
  MonitorCheck,
  Settings,
  LifeBuoy,
  Inbox,
  FileText,
  History,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
}

/**
 * Single source of truth for primary navigation. The sidebar and the command
 * palette both render from this, so a route added here shows up in both — and,
 * more importantly, a `roles` change can't apply to one and not the other.
 */
/**
 * Every entry's `roles` must match the guard on the route it points at, or the
 * nav lies: a role listed here but rejected by the page gets a link that
 * bounces to /dashboard, and a role the page admits but this array omits loses
 * a screen it is entitled to. Migration 0002 added 'manager' to the database
 * and to lib/permissions.ts, but this array was never updated — so
 * navItemsFor('manager') returned nothing at all and a manager signed in to an
 * empty sidebar. The guard each line is keyed to is named beside it.
 */
export const NAV_ITEMS: NavItem[] = [
  // No role guard on these pages — every signed-in member of the store.
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['owner', 'manager', 'staff'] },
  { href: '/inventory', label: 'Inventory', icon: Archive, roles: ['owner', 'manager', 'staff'] },
  { href: '/sales', label: 'Sales', icon: TrendingUp, roles: ['owner', 'manager', 'staff'] },
  // canViewReports() — store-wide takings. Managers run the shop, so they see
  // the numbers; both pages redirect anyone else who reaches them by URL.
  // /analytics is gone. It was the same guard, the same query and the same
  // four KPIs over the same four panels as /reports — one module wearing two
  // sidebar entries, which left a user clicking both to work out which was
  // authoritative. Its one distinct feature, the period-over-period
  // comparison, now lives in Reports and works for custom ranges too.
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['owner', 'manager'] },
  // profile.role !== 'owner' redirects — the audit trail records what managers
  // do, so it cannot be readable by them.
  { href: '/audit', label: 'Activity', icon: History, roles: ['owner'] },
  // canManage() — day-to-day operations.
  { href: '/customers', label: 'Customers', icon: Users, roles: ['owner', 'manager'] },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['owner', 'manager'] },
  { href: '/staff', label: 'Staff', icon: UserSquare2, roles: ['owner', 'manager', 'staff'] },
  { href: '/monitoring', label: 'Monitoring', icon: MonitorCheck, roles: ['owner', 'manager', 'staff'] },
  // profile.role !== 'owner' redirects, and the link now says so. /settings is
  // store administration end to end — store details, appearance, operational
  // controls, staff management — and 0002 reserves updating the store and
  // hiring to the owner. Staff were previously offered this link and bounced
  // to /dashboard on click; personal preferences live at /profile, which every
  // role reaches from the avatar menu.
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['owner'] },
  // canManage() — /support redirects anyone else. Managers field day-to-day
  // questions, so they see the queue; a staff member can still read their own
  // request through the Help Centre's policy, not this screen.
  { href: '/support', label: 'Support', icon: Inbox, roles: ['owner', 'manager'] },
  { href: '/help', label: 'Help Center', icon: LifeBuoy, roles: ['owner', 'manager', 'staff'] },
]

export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

/**
 * The current route's human name, for the chrome that has to say where you
 * are — the topbar and the mobile header.
 *
 * Derived from NAV_ITEMS rather than a second lookup table so a route renamed
 * in one place cannot keep its old name in the header. /profile is the one
 * destination reached from the avatar rather than the nav, so it is the one
 * entry that has to be spelled out here.
 *
 * Deliberately not role-filtered: this answers "what is this page called",
 * which does not depend on who is asking. Whether the viewer may be here at
 * all is the route guard's job.
 */
export function pageTitleFor(pathname: string): string {
  const item = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
  if (item) return item.label
  if (pathname.startsWith('/profile')) return 'Profile'
  return 'StockPulse'
}
