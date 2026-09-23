/**
 * REAL data, not illustration: a read-only snapshot of the StockPulse Demo
 * Store (store e47fe6eb…), taken 2026-09-19 through PostgREST GET requests.
 * Nothing was written to produce it.
 *
 * What is deliberately NOT here: revenue, sales totals and prices. The demo's
 * seeded sales history has aged out (the only sales in the last 7 days are QA
 * test sales) and its seeded prices are not realistic (Basmati Rice 5kg at
 * ₹12.90). Showing them would either look broken or require inventing
 * numbers, and the brief rules out both. Stock state — products, lots,
 * thresholds, expiry dates — is real, presentable, and what the product is
 * about.
 *
 * The 15 products named "Test …" are QA fixtures and are excluded from every
 * count. Swap this file to change the data source; nothing else reads the
 * database.
 */

export const SNAPSHOT_DATE = '2026-09-19'
export const SNAPSHOT_LABEL = '19 Sep 2026'

/** stores.expiry_warning_days for the demo store. */
export const WARNING_DAYS = 7

export const TOTALS = {
  products: 138,
  liveLots: 130,
  lowStock: 25,
  expiredLots: 22,
  expiringSoonLots: 11,
}

/** Rows from "Low Stock Alerts": stock at or below the product's own threshold. */
export const LOW_STOCK = [
  { name: 'Filter Coffee 100g', category: 'beverages', stock: 1, threshold: 5 },
  { name: 'Basmati Rice 5kg', category: 'packaged', stock: 2, threshold: 5 },
  { name: 'Butter 500g', category: 'dairy', stock: 2, threshold: 5 },
]

/** Lots from "Expiring Soon", expired first as the real panel orders them. */
export const EXPIRING = [
  { name: 'Brinjal', quantity: 14, expiry: '2026-09-09' },
  { name: 'Bananas', quantity: 26, expiry: '2026-09-11' },
  { name: 'Cheese Slices 100g', quantity: 18, expiry: '2026-09-24' },
  { name: 'Curd 1kg', quantity: 12, expiry: '2026-09-24' },
]

/** Products with their delivery lots, as Inventory shows them. */
export const INVENTORY = [
  {
    name: 'Agarbatti Pack',
    category: 'household',
    stock: 25,
    threshold: 7,
    lots: [
      { quantity: 20, expiry: null, received: '2026-08-20' },
      { quantity: 5, expiry: null, received: '2026-09-08' },
    ],
  },
  {
    name: 'Curd 200g',
    category: 'dairy',
    stock: 34,
    threshold: 7,
    lots: [{ quantity: 34, expiry: '2026-09-24', received: '2026-09-04' }],
  },
  {
    name: 'Butter 500g',
    category: 'dairy',
    stock: 2,
    threshold: 5,
    lots: [{ quantity: 2, expiry: '2026-09-28', received: '2026-08-21' }],
  },
]

/** Product count per category (excluding QA fixtures). */
export const BY_CATEGORY = [
  { label: 'Packaged', value: 58 },
  { label: 'Beverages', value: 22 },
  { label: 'Household', value: 21 },
  { label: 'Dairy', value: 19 },
  { label: 'Produce', value: 18 },
]

/**
 * The app's real offline-sync messages, with the figure from the production
 * QA sale that produced them (Test Sugar 1kg × 3, 2026-09-17).
 */
export const OFFLINE_UI = {
  pending: '1 sale waiting to sync · ₹165.00',
  synced: 'Offline sales synced · 1 sent',
}
