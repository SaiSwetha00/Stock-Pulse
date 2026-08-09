export type Role = 'owner' | 'manager' | 'staff'

/**
 * A category slug, as stored in `products.category`.
 *
 * Was a five-value union until migration 0013 made categories the shop's own
 * data. It cannot be a union any more: the set is per-store and decided at
 * runtime, so a compile-time list would be a lie the moment somebody adds
 * "Frozen". The value is still constrained — `products_category_fkey` requires
 * it to name a row in that store's `categories` table — just not by TypeScript.
 *
 * Display names come from `lib/categories.ts#categoryLabel`, never from a
 * constant. `CATEGORY_LABELS` used to sit further down this file and was one of
 * five hardcoded copies of the same list.
 */
export type Category = string

export interface Store {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  contact_phone: string | null
  low_stock_threshold_units: number
  perishables_warning_hours: number
  critical_stock_alerts: boolean
  daily_digest: boolean
  supplier_updates: boolean
  theme: string
  created_at: string
}

export interface Profile {
  id: string
  store_id: string
  full_name: string
  email: string
  role: Role
  job_title: string | null
  phone: string | null
  location: string | null
  avatar_url: string | null
  invited: boolean
  created_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  brand: string | null
  sku: string | null
  category: Category
  unit_price: number
  unit: string
  stock: number
  low_stock_threshold: number
  expiry_date: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  store_id: string
  sold_by: string
  total: number
  payment_method: 'cash' | 'card' | 'nfc'
  created_at: string
  sale_items?: SaleItem[]
  profiles?: { full_name: string }
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

// CATEGORY_LABELS was here. It mapped the five hardcoded slugs to display
// names, and every screen that showed a category read it — so a shop's own
// category had no name to render and the map could not grow without a
// deployment. Replaced by lib/categories.ts: pages read the store's rows and
// pass a label map down. Removed rather than deprecated, so the compiler finds
// every call site instead of leaving one quietly on the old list.

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Customer {
  id: string
  store_id: string
  full_name: string
  email: string | null
  phone: string | null
  loyalty_tier: LoyaltyTier
  total_spent: number
  visits: number
  notes: string | null
  last_visit_at: string | null
  created_at: string
}

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

export type SupplierCategory = 'produce' | 'dairy' | 'dry_goods' | 'beverages' | 'bakery'
export type SupplierStatus = 'active' | 'inactive' | 'issue'
export type ShipmentStatus = 'ordered' | 'shipped' | 'transit' | 'dock'

export interface Supplier {
  id: string
  store_id: string
  name: string
  primary_contact: string | null
  category: SupplierCategory
  status: SupplierStatus
  logo_url: string | null
  created_at: string
  active_orders?: number
}

export interface Shipment {
  id: string
  store_id: string
  supplier_id: string
  po_number: string
  status: ShipmentStatus
  pallets: number
  eta: string | null
  created_at: string
  suppliers?: { name: string }
}

export interface SupplierActivity {
  id: string
  store_id: string
  supplier_id: string | null
  supplier_name: string
  message: string
  created_at: string
}

export interface Shift {
  id: string
  store_id: string
  staff_id: string | null
  role_label: string
  shift_date: string
  start_time: string
  end_time: string
  created_at: string
  profiles?: { full_name: string; avatar_url: string | null } | null
}

/** Migration 0011. Both dates are inclusive — see the note in that file. */
export type LeaveKind = 'holiday' | 'sick' | 'unpaid' | 'other'

export interface StaffLeave {
  id: string
  store_id: string
  staff_id: string
  starts_on: string
  ends_on: string
  kind: LeaveKind
  note: string | null
  created_by: string | null
  created_at: string
  profiles?: { full_name: string } | null
}

export const LEAVE_KIND_LABELS: Record<LeaveKind, string> = {
  holiday: 'Holiday',
  sick: 'Sick',
  unpaid: 'Unpaid',
  other: 'Leave',
}

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  produce: 'Produce',
  dairy: 'Dairy',
  dry_goods: 'Dry Goods',
  beverages: 'Beverages',
  bakery: 'Bakery',
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  ordered: 'Ordered',
  shipped: 'Shipped',
  transit: 'In Transit',
  dock: 'At Dock',
}

export type StationStatus = 'available' | 'in_use' | 'review' | 'assistance' | 'maintenance'
export type StationAlertType = 'weight_mismatch' | 'age_verification'

export interface CheckoutStation {
  id: string
  store_id: string
  station_number: number
  status: StationStatus
  payment_type: string
  items_scanned: number
  current_total: number
  session_started_at: string | null
  alert_type: StationAlertType | null
  alert_expected: number | null
  alert_actual: number | null
  alert_item: string | null
  updated_at: string
  created_at: string
}

export const STATION_STATUS_LABELS: Record<StationStatus, string> = {
  available: 'Available',
  in_use: 'In Use',
  review: 'Review',
  assistance: 'Assistance',
  maintenance: 'Maintenance',
}
