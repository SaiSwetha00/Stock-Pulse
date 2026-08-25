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

// ---------------------------------------------------------------------------
// The rest of the shelf
// ---------------------------------------------------------------------------
// The catalogue above is ~40 lines, which is a sample rather than a shop. A
// reviewer opening /inventory on 40 rows cannot tell whether search, category
// filtering, the low-stock panel or the CSV export hold up, because none of
// them are under any pressure at that size.
//
// Real catalogues grow mostly by PACK SIZE — the same line in three or four
// sizes, priced per size — so that is how this expands, rather than by
// inventing a hundred unrelated products. Each base below yields one product
// per size, which is why the sizes carry a multiplier: price scales with the
// pack, and the stock band SHRINKS as the pack grows, because a shop holds
// fewer 5L tins than 500ml bottles.
//
// Literal input, arithmetic output. Nothing random here, so two runs produce
// identical rows and the ids derived from row index stay stable — which is
// what keeps the whole seed re-runnable.
const PACK_VARIANTS = [
  // slug, base name, brand, unit, price at size 1, stock band at size 1, sizes
  ['packaged', 'Toor Dal', 'Tata Sampann', 'kg', 1.9, [22, 48], [['500g', 0.5], ['1kg', 1], ['2kg', 2]]],
  ['packaged', 'Moong Dal', 'Tata Sampann', 'kg', 2.1, [18, 40], [['500g', 0.5], ['1kg', 1]]],
  ['packaged', 'Chana Dal', '24 Mantra', 'kg', 1.75, [18, 42], [['500g', 0.5], ['1kg', 1], ['2kg', 2]]],
  ['packaged', 'Rajma', 'Organic Tattva', 'kg', 2.4, [12, 30], [['500g', 0.5], ['1kg', 1]]],
  ['packaged', 'Poha', 'Nature Fresh', 'kg', 1.1, [15, 35], [['500g', 0.5], ['1kg', 1]]],
  ['packaged', 'Rava Sooji', 'Aashirvaad', 'kg', 1.0, [15, 35], [['500g', 0.5], ['1kg', 1]]],
  ['packaged', 'Besan', 'Rajdhani', 'kg', 1.3, [14, 32], [['500g', 0.5], ['1kg', 1]]],
  ['packaged', 'Sona Masoori Rice', 'Daawat', 'bag', 1.45, [10, 26], [['5kg', 5], ['10kg', 10]]],
  ['packaged', 'Idli Rice', 'Priya', 'bag', 1.25, [8, 22], [['5kg', 5], ['10kg', 10]]],
  ['packaged', 'Jaggery Block', 'Organic Tattva', 'kg', 1.6, [12, 28], [['500g', 0.5], ['1kg', 1]]],
  ['packaged', 'Groundnut Oil', 'Gold Winner', 'ea', 3.2, [10, 24], [['500ml', 0.5], ['1L', 1], ['5L', 5]]],
  ['packaged', 'Sunflower Oil', 'Fortune', 'ea', 2.9, [12, 28], [['1L', 1], ['5L', 5]]],
  ['packaged', 'Mustard Oil', 'Dhara', 'ea', 3.4, [8, 20], [['500ml', 0.5], ['1L', 1]]],
  ['packaged', 'Turmeric Powder', 'Everest', 'ea', 1.2, [16, 38], [['100g', 1], ['200g', 2], ['500g', 5]]],
  ['packaged', 'Chilli Powder', 'Everest', 'ea', 1.5, [16, 38], [['100g', 1], ['200g', 2], ['500g', 5]]],
  ['packaged', 'Coriander Powder', 'MDH', 'ea', 1.1, [14, 34], [['100g', 1], ['200g', 2]]],
  ['packaged', 'Garam Masala', 'MDH', 'ea', 1.8, [12, 30], [['50g', 1], ['100g', 2]]],
  ['packaged', 'Mustard Seeds', 'Catch', 'ea', 0.9, [14, 32], [['100g', 1], ['200g', 2]]],
  ['packaged', 'Cumin Seeds', 'Catch', 'ea', 1.4, [12, 30], [['100g', 1], ['200g', 2]]],
  ['packaged', 'Salt', 'Tata', 'kg', 0.4, [30, 70], [['1kg', 1]]],
  ['packaged', 'Vermicelli', 'Bambino', 'ea', 0.7, [18, 40], [['200g', 1], ['400g', 2]]],
  ['packaged', 'Marie Biscuits', 'Britannia', 'ea', 0.6, [30, 75], [['150g', 1], ['300g', 2]]],
  ['packaged', 'Glucose Biscuits', 'Parle-G', 'ea', 0.35, [40, 95], [['100g', 1], ['250g', 2.5]]],
  ['packaged', 'Rusk Toast', 'Britannia', 'ea', 0.9, [16, 38], [['200g', 1], ['400g', 2]]],
  ['dairy', 'Toned Milk', 'Nandini', 'ea', 0.75, [30, 70], [['500ml', 1], ['1L', 2]]],
  ['dairy', 'Curd', 'Nandini', 'ea', 0.6, [20, 50], [['200g', 1], ['400g', 2], ['1kg', 5]]],
  ['dairy', 'Butter', 'Amul', 'ea', 2.2, [12, 30], [['100g', 1], ['500g', 5]]],
  ['dairy', 'Cheese Slices', 'Amul', 'ea', 2.6, [8, 22], [['100g', 1], ['200g', 2]]],
  ['dairy', 'Fresh Cream', 'Amul', 'ea', 1.4, [8, 20], [['250ml', 1]]],
  ['beverages', 'Tea Leaves', 'Red Label', 'ea', 2.1, [16, 38], [['250g', 1], ['500g', 2], ['1kg', 4]]],
  ['beverages', 'Green Tea Bags', 'Lipton', 'ea', 2.8, [10, 24], [['25s', 1], ['50s', 2]]],
  ['beverages', 'Instant Coffee', 'Nescafe', 'ea', 3.6, [8, 20], [['50g', 1], ['100g', 2]]],
  ['beverages', 'Mango Drink', 'Frooti', 'ea', 0.5, [30, 80], [['200ml', 1], ['600ml', 3], ['1L', 5]]],
  ['beverages', 'Soda Water', 'Kinley', 'ea', 0.45, [25, 60], [['750ml', 1], ['2L', 2.5]]],
  ['beverages', 'Packaged Water', 'Bisleri', 'ea', 0.3, [40, 100], [['1L', 1], ['2L', 2], ['5L', 5]]],
  ['household', 'Detergent Powder', 'Surf Excel', 'ea', 1.9, [15, 36], [['500g', 1], ['1kg', 2], ['2kg', 4]]],
  ['household', 'Dishwash Bar', 'Vim', 'ea', 0.4, [30, 80], [['100g', 1], ['200g', 2]]],
  ['household', 'Dishwash Gel', 'Vim', 'ea', 1.7, [14, 34], [['250ml', 1], ['500ml', 2], ['750ml', 3]]],
  ['household', 'Hand Wash', 'Lifebuoy', 'ea', 1.5, [12, 30], [['200ml', 1], ['750ml', 3.5]]],
  ['household', 'Toothpaste', 'Colgate', 'ea', 1.3, [18, 42], [['100g', 1], ['200g', 2]]],
  ['household', 'Shampoo Sachet', 'Clinic Plus', 'ea', 0.12, [60, 150], [['6ml', 1]]],
  ['household', 'Phenyl', 'Lizol', 'ea', 2.1, [10, 26], [['500ml', 1], ['1L', 2]]],
  ['produce', 'Green Capsicum', 'Local Farm', 'kg', 2.2, [15, 38], [['loose', 1]]],
  ['produce', 'Carrots', 'Local Farm', 'kg', 1.5, [20, 45], [['loose', 1]]],
  ['produce', 'Cabbage', 'Local Farm', 'kg', 0.9, [18, 40], [['loose', 1]]],
  ['produce', 'Cauliflower', 'Local Farm', 'kg', 1.2, [15, 35], [['loose', 1]]],
  ['produce', 'Brinjal', 'Local Farm', 'kg', 1.1, [18, 42], [['loose', 1]]],
  ['produce', 'Okra', 'Local Farm', 'kg', 1.8, [15, 36], [['loose', 1]]],
  ['produce', 'Green Chillies', 'Local Farm', 'kg', 2.4, [10, 26], [['loose', 1]]],
  ['produce', 'Ginger', 'Local Farm', 'kg', 3.1, [8, 22], [['loose', 1]]],
  ['produce', 'Garlic', 'Local Farm', 'kg', 3.4, [8, 22], [['loose', 1]]],
  ['produce', 'Lemons', 'Local Farm', 'kg', 2.0, [12, 30], [['loose', 1]]],
  ['produce', 'Coriander Bunch', 'Local Farm', 'bunch', 0.4, [15, 40], [['loose', 1]]],
  ['produce', 'Spinach Bunch', 'Local Farm', 'bunch', 0.5, [12, 32], [['loose', 1]]],
]

// Nine of the generated names collide with the hand-written catalogue above
// ("Toor Dal 1kg", "Lemons", "Detergent Powder 1kg" and so on), which is what
// you would expect when both lists describe the same shop. The generated one
// yields: the explicit row is the one someone chose, and it may carry a
// FORCE_LOW entry or a deliberate price that the arithmetic here would
// silently shadow. Two products with one name would also make FORCE_LOW —
// which matches by name — push both under their threshold.
const CATALOGUE_NAMES = new Set(CATALOGUE.map((row) => row[1]))

for (const variant of PACK_VARIANTS) {
  const slug = variant[0]
  const base = variant[1]
  const brand = variant[2]
  const unit = variant[3]
  const price = variant[4]
  const band = variant[5]
  const sizes = variant[6]
  for (const size of sizes) {
    const label = size[0]
    const mult = size[1]
    // Loose produce is sold by weight and has no pack size to name.
    const name = label === 'loose' ? base : base + ' ' + label
    if (CATALOGUE_NAMES.has(name)) continue
    CATALOGUE_NAMES.add(name)
    CATALOGUE.push([
      slug,
      name,
      brand,
      unit,
      // Two decimals: unit_price is numeric(10,2), so an unrounded float would
      // be stored rounded anyway. Rounding here keeps the seed's own numbers
      // equal to what the database ends up holding.
      Math.round(price * mult * 100) / 100,
      // sqrt rather than a straight divide: a 10kg bag is not held at a tenth
      // of the 1kg line's depth, it is held at roughly a third.
      [
        Math.max(4, Math.round(band[0] / Math.sqrt(mult))),
        Math.max(8, Math.round(band[1] / Math.sqrt(mult))),
      ],
    ])
  }
}

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
        'This writes ~135 products, 5 suppliers, 3 staff accounts and 30 days of\n' +
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
  const productRows = products.map((p, i) => {
    const unitsSold = sold.get(p.id) || 0
    let stock = Math.max(0, p.opening - unitsSold)
    // FORCE_LOW is six names, chosen when the catalogue was forty. On a
    // hundred and thirty-five that is under 5% and the low-stock panel reads
    // as a rounding error rather than a working alert list, so every
    // eleventh product is forced low as well. By INDEX, not at random: the
    // set has to be the same on every run for the seed to stay idempotent.
    if (FORCE_LOW.has(p.name) || i % 11 === 7) {
      stock = Math.max(0, p.low_stock_threshold - between(1, 4))
    }
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
