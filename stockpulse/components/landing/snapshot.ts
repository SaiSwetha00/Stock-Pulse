/**
 * The figures the landing page shows, and where every one of them came from.
 *
 * REAL, not illustration: a read-only snapshot of the StockPulse Demo Store,
 * taken 2026-09-19 through PostgREST GET requests (nothing was written), plus
 * two results from the production QA cycle of September 2026. The same demo
 * store is what "Explore the demo" opens, so the page shows what a visitor
 * will actually find.
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
  { name: 'Curd 1kg', quantity: 12, expiry: '2026-09-24' },
]

/** Nine real products as Inventory lists them, with their delivery lots. */
export const INVENTORY = [
  { name: 'Agarbatti Pack', category: 'Household', stock: 25, threshold: 7, lots: [{ q: 20, exp: null, rec: '2026-08-20' }, { q: 5, exp: null, rec: '2026-09-08' }] },
  { name: 'Bananas', category: 'Produce', stock: 26, threshold: 9, lots: [{ q: 26, exp: '2026-09-11', rec: '2026-08-25' }] },
  { name: 'Basmati Rice 5kg', category: 'Packaged', stock: 2, threshold: 5, lots: [{ q: 2, exp: null, rec: '2026-09-05' }] },
  { name: 'Brinjal', category: 'Produce', stock: 14, threshold: 6, lots: [{ q: 14, exp: '2026-09-09', rec: '2026-09-02' }] },
  { name: 'Butter 500g', category: 'Dairy', stock: 2, threshold: 5, lots: [{ q: 2, exp: '2026-09-28', rec: '2026-08-21' }] },
  { name: 'Cheese Slices 100g', category: 'Dairy', stock: 18, threshold: 5, lots: [{ q: 18, exp: '2026-09-24', rec: '2026-08-31' }] },
  { name: 'Curd 1kg', category: 'Dairy', stock: 12, threshold: 5, lots: [{ q: 12, exp: '2026-09-24', rec: '2026-08-25' }] },
  { name: 'Curd 200g', category: 'Dairy', stock: 34, threshold: 7, lots: [{ q: 34, exp: '2026-09-24', rec: '2026-09-04' }] },
  { name: 'Filter Coffee 100g', category: 'Beverages', stock: 1, threshold: 5, lots: [{ q: 1, exp: null, rec: '2026-08-30' }] },
] as const

/** Product count per category. */
export const BY_CATEGORY = [
  { label: 'Packaged', value: 58 },
  { label: 'Beverages', value: 22 },
  { label: 'Household', value: 21 },
  { label: 'Dairy', value: 19 },
  { label: 'Produce', value: 18 },
]

/**
 * Production QA, Sep 2026. An earliest-expiry-first sale (Spiced Buttermilk
 * 200ml × 4: the 15 Sep lot 2 → 0, the 26 Sep lot 35 → 33) and the offline
 * sync messages exactly as the app displayed them.
 */
export const FEFO_SALE = {
  product: 'Spiced Buttermilk 200ml',
  units: 4,
  lots: [
    { exp: '15 Sep 2026', before: 2, after: 0 },
    { exp: '26 Sep 2026', before: 35, after: 33 },
  ],
}

export const OFFLINE_UI = {
  saved: 'Saved on this device',
  pending: '1 sale waiting to sync · ₹165.00',
  synced: 'Offline sales synced · 1 sent',
}
