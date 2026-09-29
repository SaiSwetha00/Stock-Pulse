import {
  Rocket,
  Archive,
  Wallet,
  Truck,
  Users,
  UserSquare2,
  Settings,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react'
import type { HelpCategoryKey } from './articles'

/**
 * Each help category's icon, apart from its words.
 *
 * They used to sit on HELP_CATEGORIES, but the category cards are a Client
 * Component and their text now arrives as props, already in the reader's
 * language (see ./localized). An icon is a component and cannot cross from
 * the server as a prop, and importing ./articles just to reach it would ship
 * every article's English text to the browser for nothing — so the icons
 * live here, where importing them costs only the icons.
 */
export const HELP_CATEGORY_ICONS: Record<HelpCategoryKey, LucideIcon> = {
  'getting-started': Rocket,
  inventory: Archive,
  sales: Wallet,
  suppliers: Truck,
  customers: Users,
  staff: UserSquare2,
  settings: Settings,
  ai: Sparkles,
  roles: ShieldCheck,
  troubleshooting: LifeBuoy,
}
