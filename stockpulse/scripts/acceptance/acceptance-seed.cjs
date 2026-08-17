#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- see lib.cjs */
/**
 * ACCEPTANCE SEED — populates the HARNESS store with a month of plausible
 * trade so the product can be judged at real volume instead of through empty
 * states.
 *
 *     node scripts/acceptance/acceptance-seed.cjs --yes
 *
 * THIS IS NOT DEMO DATA FOR A CLIENT STORE. Read the README next to this file.
 *
 * D23 is the rule this sits under: a setup action creates the thing empty, and
 * only a clearly-labelled seed may invent trade. This is that clearly-labelled
 * seed. Three things keep the label attached rather than relying on somebody
 * remembering:
 *
 *   - it refuses to run against any store but the harness one (lib.cjs);
 *   - every product carries an `ACC-` SKU, so seeded stock is identifiable in
 *     the UI, in an export, and in a database query, forever;
 *   - every product carries a PLACEHOLDER barcode in the GS1 restricted-
 *     distribution range (200...), which is not and can never be a real
 *     article's code — see the ean13() comment below;
 *   - every id is derived from a fixed namespace, so the teardown removes
 *     exactly this set and provably nothing else.
 *
 * Deliberately NOT modelled here, because the owner journey creates them by
 * hand and seeding them would hide whether those flows work:
 *   shipments (Add Shipment on /suppliers), support requests, leave,
 *   notifications.
 */
const {
  HARNESS_STORE_ID,
  derivedId,
  makeClient,
  assertHarnessStore,
  scoped,
  upsert,
  STAFF,
} = require('./lib.cjs')

const DAYS = 30
const SEED_TAG = 'ACC'

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness
// ---------------------------------------------------------------------------
// A seeded PRNG, not Math.random. Two runs must produce the same shop — if the
// numbers moved every time, "revenue is down 4% on last week" could never be
// checked against anything, and a screenshot could not be reproduced.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(0x5741484d)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))

// ---------------------------------------------------------------------------
// The shop
// ---------------------------------------------------------------------------
// Category slugs are the five that migration 0013 seeded and that were then
// CONFIRMED present in this store by querying it — products_category_fkey is
// composite on (store_id, slug), so a slug that is merely plausible gets a
// foreign-key violation rather than a row.
//
// Prices are US dollars because lib/format.ts hard-codes `$` and en-US. An
// Indian grocery priced in dollars is a little odd to read and that is worth
// knowing: the currency is not configurable anywhere in the product.
const CATALOGUE = [
  // slug, name, brand, unit, price, typical stock band
  ['produce', 'Red Onions', 'Local Farm', 'kg', 1.29, [40, 90]],
  ['produce', 'Roma Tomatoes', 'Local Farm', 'kg', 1.85, [30, 70]],
  ['produce', 'Potatoes', 'Local Farm', 'kg', 0.99, [50, 120]],
  ['produce', 'Fresh Coriander', 'Local Farm', 'bunch', 0.75, [20, 45]],
  ['produce', 'Green Chillies', 'Local Farm', 'g', 0.6, [15, 40]],
  ['produce', 'Curry Leaves', 'Local Farm', 'bunch', 0.5, [10, 30]],
  ['produce', 'Bananas', 'Sunrise', 'kg', 1.1, [25, 60]],
  ['produce', 'Lemons', 'Sunrise', 'ea', 0.35, [40, 100]],

  ['dairy', 'Whole Milk 1L', 'Amul', 'ea', 1.45, [30, 70]],
  ['dairy', 'Fresh Curd 400g', 'Amul', 'ea', 1.2, [20, 50]],
  ['dairy', 'Paneer 200g', 'Amul', 'ea', 2.95, [12, 30]],
  ['dairy', 'Salted Butter 100g', 'Amul', 'ea', 1.75, [15, 40]],
  ['dairy', 'Pure Ghee 500ml', 'Amul', 'ea', 7.5, [8, 20]],
  ['dairy', 'Cheese Slices 200g', 'Britannia', 'ea', 3.25, [10, 25]],
  ['dairy', 'Free Range Eggs (6)', 'Happy Hen', 'pack', 2.4, [20, 45]],
  ['dairy', 'Spiced Buttermilk 200ml', 'Amul', 'ea', 0.65, [25, 60]],

  ['packaged', 'Toor Dal 1kg', 'Tata Sampann', 'kg', 2.4, [25, 60]],
  ['packaged', 'Basmati Rice 5kg', 'India Gate', 'bag', 12.9, [10, 28]],
  ['packaged', 'Whole Wheat Atta 5kg', 'Aashirvaad', 'bag', 8.75, [12, 30]],
  ['packaged', 'Sugar 1kg', 'Madhur', 'kg', 1.15, [30, 70]],
  ['packaged', 'Iodised Salt 1kg', 'Tata', 'kg', 0.55, [35, 80]],
  ['packaged', 'Turmeric Powder 100g', 'Everest', 'ea', 1.35, [20, 50]],
  ['packaged', 'Mustard Oil 1L', 'Fortune', 'ea', 4.2, [15, 35]],
  ['packaged', 'Red Poha 500g', 'Tata Sampann', 'ea', 1.6, [18, 40]],

  ['beverages', 'Masala Chai Leaves 250g', 'Brooke Bond', 'ea', 2.85, [20, 45]],
  ['beverages', 'Filter Coffee 100g', 'Bru', 'ea', 3.4, [12, 30]],
  ['beverages', 'Drinking Water 1L', 'Bisleri', 'ea', 0.55, [50, 120]],
  ['beverages', 'Cola 750ml', 'Thums Up', 'ea', 1.05, [30, 70]],
  ['beverages', 'Mango Drink 600ml', 'Maaza', 'ea', 1.15, [25, 60]],
  ['beverages', 'Sweet Lassi 200ml', 'Amul', 'ea', 0.85, [20, 50]],
  ['beverages', 'Tender Coconut Water', 'Local Farm', 'ea', 1.5, [15, 35]],
  ['beverages', 'Ginger Ale 300ml', 'Duke', 'ea', 0.95, [18, 40]],

  ['household', 'Detergent Powder 1kg', 'Surf Excel', 'ea', 3.6, [15, 35]],
  ['household', 'Dishwash Bar 200g', 'Vim', 'ea', 0.7, [25, 60]],
  ['household', 'Floor Cleaner 1L', 'Lizol', 'ea', 3.1, [12, 28]],
  ['household', 'Toilet Cleaner 500ml', 'Harpic', 'ea', 2.25, [12, 30]],
  ['household', 'Bathing Soap 100g', 'Medimix', 'ea', 0.8, [30, 70]],
  ['household', 'Toothpaste 150g', 'Colgate', 'ea', 2.15, [20, 45]],
  ['household', 'Agarbatti Pack', 'Cycle', 'pack', 1.35, [20, 50]],
  ['household', 'Garbage Bags (30)', 'Presto', 'pack', 2.6, [15, 35]],
]

const SUPPLIERS = [
  ['Anand Fresh Produce', 'Anand Kulkarni', 'produce', 'active'],
  ['Sri Dairy Distributors', 'Lakshmi Sundaram', 'dairy', 'active'],
  ['Gopal Wholesale Grains', 'Gopal Menon', 'dry_goods', 'active'],
  ['Coastal Beverage Supply', 'Rafiq Sheikh', 'beverages', 'issue'],
  ['Ravi Home Essentials', 'Ravi Deshpande', 'bakery', 'inactive'],
]

// Products deliberately pushed under their threshold, so /dashboard's low-stock
// panel, the inventory filter and the notification path all have something
// real to show. Chosen across three categories rather than one, because a
// single-category alert list would not exercise the grouping.
const FORCE_LOW = new Set([
  'Paneer 200g',
  'Pure Ghee 500ml',
  'Basmati Rice 5kg',
  'Filter Coffee 100g',
  'Floor Cleaner 1L',
  'Curry Leaves',
])

// ---------------------------------------------------------------------------
// Placeholder barcodes
// ---------------------------------------------------------------------------
// THESE ARE NOT REAL PRODUCT BARCODES. Every value produced below is invented
// by this script. Scanning a real tin of Amul ghee will NOT match the seeded
// "Pure Ghee 500ml" row, and none of these digits identifies any real-world
// article. They exist so the later scanning phases have unique, well-formed
// values to resolve against instead of a column full of NULLs.
//
// They are built so they can never be mistaken for real ones:
//
//   - The prefix is 200. GS1 reserves 02 and 20-29 for RESTRICTED
//     DISTRIBUTION — codes a shop prints for itself, which by definition
//     identify nothing outside that shop. A placeholder in that range is not
//     merely unassigned; it is in the block guaranteed never to be assigned to
//     a manufacturer.
//   - The check digit is computed properly, so a scanner or validator accepts
//     them as well-formed EAN-13. A seed of malformed codes would exercise the
//     error path forever and the happy path never.
//   - The payload is the catalogue index, so the mapping is stable across runs
//     and collisions are impossible by construction rather than by luck — the
//     same reasoning as derivedId() above: two runs must produce the same shop.
//
// This carries D48 forward. The seed stays labelled: the ACC- SKU is the label
// a human reads, the 200 prefix is the label a machine reads.
function ean13(index) {
  // 3-digit restricted prefix + 9 digits of payload = 12, + check digit = 13.
  const body = `200${String(index).padStart(9, '0')}`
  let sum = 0
  for (let i = 0; i < 12; i++) {
    // EAN-13 weights the 1st, 3rd, 5th... digit by 1 and the rest by 3.
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  }
  return body + String((10 - (sum % 10)) % 10)
}

function isoDaysAgo(days, hour, minute) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, Math.floor(rnd() * 60), 0)
  return d.toISOString()
}

function dateOnlyDaysAhead(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error(
      'Refusing to run without --yes.\n\n' +
        'This writes ~40 products, 5 suppliers, 3 staff accounts and 30 days of\n' +
        'sales into the harness store. Read scripts/acceptance/README.md first.\n\n' +
        '  node scripts/acceptance/acceptance-seed.cjs --yes\n',
    )
    process.exit(2)
  }

  const { rest, admin } = makeClient()
  const guard = await assertHarnessStore(rest)
  console.log(`target store : ${guard.name} (${HARNESS_STORE_ID})`)
  console.log(`project has  : ${guard.storesInProject} store(s) — this seed touches exactly 1`)

  // Categories are read, never created. If 0013's slugs are not here the seed
  // must stop, not invent them: inventing a category to satisfy a foreign key
  // is how a seed quietly reshapes a schema it does not own.
  const { json: cats } = await rest('GET', `categories?store_id=eq.${HARNESS_STORE_ID}&select=slug`)
  const slugs = new Set(cats.map((c) => c.slug))
  const missing = [...new Set(CATALOGUE.map((c) => c[0]))].filter((s) => !slugs.has(s))
  if (missing.length) {
    throw new Error(
      `ABORT: these category slugs do not exist in this store: ${missing.join(', ')}.\n` +
        `products_category_fkey is composite (store_id, slug) and would reject every product.\n` +
        `Present: ${[...slugs].join(', ')}`,
    )
  }
  console.log(`categories   : ${[...slugs].sort().join(', ')}`)

  // -------------------------------------------------------------------------
  // Staff — auth users first, because profiles.id references auth.users(id).
  // -------------------------------------------------------------------------
  const staffIds = {}
  for (const s of STAFF) {
    const created = await admin('POST', '/admin/users', {
      email: s.email,
      password: `Acc-${derivedId(s.key).slice(0, 18)}!`,
      email_confirm: true,
      user_metadata: { full_name: s.full_name, acceptance_seed: true },
    })
    if (created.ok && created.json && created.json.id) {
      staffIds[s.key] = created.json.id
    } else {
      // Already there from a previous run — find it rather than fail. The
      // Admin API has no get-by-email, so page the list.
      const list = await admin('GET', `/admin/users?per_page=200`)
      const found = (list.json.users || []).find((u) => u.email === s.email)
      if (!found) throw new Error(`could not create or find auth user ${s.email}: ${JSON.stringify(created.json)}`)
      staffIds[s.key] = found.id
    }
  }
  await upsert(
    rest,
    'profiles',
    STAFF.map((s) => ({
      id: staffIds[s.key],
      store_id: HARNESS_STORE_ID,
      full_name: s.full_name,
      email: s.email,
      role: s.role,
      job_title: s.job_title,
      invited: true,
    })),
  )
  console.log(`staff        : ${STAFF.map((s) => `${s.full_name} (${s.role})`).join(', ')}`)

  // -------------------------------------------------------------------------
  // Suppliers
  // -------------------------------------------------------------------------
  const supplierRows = SUPPLIERS.map(([name, contact, category, status], i) => ({
    id: derivedId(`supplier:${i}`),
    name,
    primary_contact: contact,
    category,
    status,
  }))
  await upsert(rest, 'suppliers', scoped(supplierRows))
  console.log(`suppliers    : ${supplierRows.length}`)

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------
  // Stock is computed AFTER the sales below, so what the shop shows is opening
  // stock minus what it sold. Seeding stock and sales independently is how you
  // get a shop that sold 400 units and still has all of them.
  const products = CATALOGUE.map(([category, name, brand, unit, price, band], i) => {
    const threshold = Math.max(5, Math.round(band[0] * 0.35))
    return {
      id: derivedId(`product:${i}`),
      name,
      brand,
      sku: `${SEED_TAG}-${String(i + 1).padStart(3, '0')}`,
      // Placeholder, not a real barcode — read the ean13() comment above
      // before assuming any of these means anything outside this store.
      barcode: ean13(i + 1),
      category,
      unit_price: price,
      unit,
      opening: between(band[0], band[1]),
      low_stock_threshold: threshold,
      // Perishables get a near expiry so the perishables warning has input;
      // shelf-stable lines get none rather than a fictional one.
      expiry_date:
        category === 'produce' ? dateOnlyDaysAhead(between(1, 6))
        : category === 'dairy' ? dateOnlyDaysAhead(between(3, 20))
        : null,
    }
  })

  // -------------------------------------------------------------------------
  // 30 days of sales
  // -------------------------------------------------------------------------
  const sellers = [...Object.values(staffIds)]
  const sold = new Map() // product id -> units sold
  const sales = []
  const items = []
  let saleSeq = 0

  for (let d = DAYS - 1; d >= 0; d--) {
    const dow = new Date(Date.now() - d * 86400000).getDay()
    // A grocery is busier at the weekend. Without this every chart in the app
    // is a flat line, which tells you nothing about whether the chart works.
    const base = dow === 0 || dow === 6 ? between(14, 22) : between(7, 14)
    for (let s = 0; s < base; s++) {
      const hour = pick([8, 9, 10, 11, 12, 13, 17, 18, 18, 19, 19, 20])
      const saleId = derivedId(`sale:${saleSeq++}`)
      const lineCount = between(1, 5)
      const chosen = new Set()
      let total = 0
      for (let l = 0; l < lineCount; l++) {
        const p = products[Math.floor(rnd() * products.length)]
        if (chosen.has(p.id)) continue
        chosen.add(p.id)
        const qty = between(1, 3)
        const line = Number((p.unit_price * qty).toFixed(2))
        total += line
        sold.set(p.id, (sold.get(p.id) || 0) + qty)
        items.push({
          id: derivedId(`item:${saleId}:${p.id}`),
          sale_id: saleId,
          product_id: p.id,
          product_name: p.name,
          quantity: qty,
          unit_price: p.unit_price,
          line_total: line,
        })
      }
      if (chosen.size === 0) continue
      sales.push({
        id: saleId,
        sold_by: sellers[Math.floor(rnd() * sellers.length)],
        total: Number(total.toFixed(2)),
        payment_method: pick(['cash', 'cash', 'card', 'card', 'nfc']),
        created_at: isoDaysAgo(d, hour, between(0, 59)),
      })
    }
  }

  // Closing stock. Anything on the forced-low list is pushed just under its
  // threshold; everything else keeps a sane floor so the shop does not read as
  // if it sold out of everything at once.
  const productRows = products.map((p) => {
    const unitsSold = sold.get(p.id) || 0
    let stock = Math.max(0, p.opening - unitsSold)
    if (FORCE_LOW.has(p.name)) stock = Math.max(0, p.low_stock_threshold - between(1, 4))
    else if (stock < p.low_stock_threshold) stock = p.low_stock_threshold + between(2, 15)
    // `opening` is a working value, not a column — drop it before the insert
    // or PostgREST rejects the row for an unknown field.
    const row = { ...p }
    delete row.opening
    return { ...row, stock }
  })

  await upsert(rest, 'products', scoped(productRows))
  console.log(
    `products     : ${productRows.length} (${productRows.filter((p) => p.stock < p.low_stock_threshold).length} below threshold)`,
  )

  await upsert(rest, 'sales', scoped(sales))
  // sale_items has no store_id — it is scoped through its sale.
  await upsert(rest, 'sale_items', items)
  const revenue = sales.reduce((a, s) => a + s.total, 0)
  console.log(`sales        : ${sales.length} over ${DAYS} days, ${items.length} line items, $${revenue.toFixed(2)} revenue`)

  // -------------------------------------------------------------------------
  // A week of shifts, so /staff has a rota to read
  // -------------------------------------------------------------------------
  const shifts = []
  for (let d = 0; d < 7; d++) {
    STAFF.forEach((s, i) => {
      if ((d + i) % 3 === 0) return // everyone gets a day off
      shifts.push({
        id: derivedId(`shift:${d}:${i}`),
        staff_id: staffIds[s.key],
        role_label: s.job_title,
        shift_date: dateOnlyDaysAhead(d),
        start_time: i === 0 ? '07:00:00' : '12:00:00',
        end_time: i === 0 ? '15:00:00' : '20:00:00',
      })
    })
  }
  await upsert(rest, 'shifts', scoped(shifts))
  console.log(`shifts       : ${shifts.length} across the next 7 days`)

  console.log('\nSEEDED. Teardown: node scripts/acceptance/acceptance-teardown.cjs --yes')
}

main().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
