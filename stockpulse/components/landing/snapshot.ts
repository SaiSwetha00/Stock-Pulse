/**
 * The figures the landing page's dashboard preview shows.
 *
 * REAL, not illustration: a read-only snapshot of the StockPulse Demo Store,
 * retaken 2026-09-23 through PostgREST GET requests (nothing was written). The
 * same demo store is what "Try the demo" opens.
 *
 * Each figure is counted the way the app itself defines it: `lowStock` is
 * 0004's `low_stock_products` test (`stock <= low_stock_threshold`), and the
 * expiry counts use `getExpiringStock`'s rules — lots with `quantity > 0`,
 * undated lots excluded, the window from `stores.expiry_warning_days`.
 *
 * Counted in LOTS, because that is what the page says: "9 lots", "N lots
 * already expired". The dashboard's own KPI counts PRODUCTS over the same
 * rows, so the two differ in kind as well as in date — that is not drift.
 *
 * Categories are stored as the labels the dashboard prints (via
 * `categoryLabel`), not the raw slugs, since the panel here renders the value
 * directly.
 *
 * Deliberately absent: revenue, sales totals and prices. The demo's seeded
 * sales history has aged out and its seeded prices are not realistic, and
 * inventing replacements would put fake statistics on a public page. The
 * "Test …" QA fixtures (14 of them today) are excluded from every count.
 *
 * These figures age. Retake them rather than edit them by hand: the counts,
 * the two panels and SNAPSHOT_DATE have to describe one moment, or ExpiryTag
 * will date a row against a day the row did not come from.
 */

export const SNAPSHOT_DATE = '2026-09-23'
export const SNAPSHOT_LABEL = '23 Sep 2026'

/** stores.expiry_warning_days for the demo store. */
export const WARNING_DAYS = 7

export const TOTALS = {
  products: 139,
  liveLots: 145,
  lowStock: 25,
  expiredLots: 28,
  expiringSoonLots: 9,
}

/** "Low Stock Alerts": stock at or below the product's own threshold. */
export const LOW_STOCK = [
  { name: 'Belgian chocolate', category: 'Dairy & Eggs', stock: 0, threshold: 10 },
  { name: 'Black salt', category: 'Packaged Goods', stock: 0, threshold: 10 },
  { name: 'Curd 400g', category: 'Dairy & Eggs', stock: 0, threshold: 5 },
]

/**
 * "Expiring Soon", expired first as the real panel orders it, then the
 * soonest lot that can still be sold — the row that carries the "Discount"
 * badge here and in the scan card. Quantities are the at-risk units on those
 * lots, not the product's total stock.
 */
export const EXPIRING = [
  { name: 'Brinjal', quantity: 14, expiry: '2026-09-09' },
  { name: 'Red Onions', quantity: 63, expiry: '2026-09-11' },
  { name: 'Cheese Slices 100g', quantity: 18, expiry: '2026-09-24' },
]
