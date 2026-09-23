/**
 * The figures the landing page's dashboard preview shows.
 *
 * REAL, not illustration: a read-only snapshot of the StockPulse Demo Store,
 * taken 2026-09-19 through PostgREST GET requests (nothing was written). The
 * same demo store is what "Try the demo" opens.
 *
 * Deliberately absent: revenue, sales totals and prices. The demo's seeded
 * sales history has aged out and its seeded prices are not realistic, and
 * inventing replacements would put fake statistics on a public page. The 15
 * "Test …" QA fixtures are excluded from every count.
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

/** "Low Stock Alerts": stock at or below the product's own threshold. */
export const LOW_STOCK = [
  { name: 'Filter Coffee 100g', category: 'Beverages', stock: 1, threshold: 5 },
  { name: 'Basmati Rice 5kg', category: 'Packaged', stock: 2, threshold: 5 },
  { name: 'Butter 500g', category: 'Dairy', stock: 2, threshold: 5 },
]

/** "Expiring Soon", expired first as the real panel orders it. */
export const EXPIRING = [
  { name: 'Brinjal', quantity: 14, expiry: '2026-09-09' },
  { name: 'Bananas', quantity: 26, expiry: '2026-09-11' },
  { name: 'Cheese Slices 100g', quantity: 18, expiry: '2026-09-24' },
]
