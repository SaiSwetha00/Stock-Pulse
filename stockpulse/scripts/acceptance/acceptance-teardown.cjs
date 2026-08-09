#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- see lib.cjs */
/**
 * ACCEPTANCE TEARDOWN — removes exactly what acceptance-seed.cjs created.
 *
 *     node scripts/acceptance/acceptance-teardown.cjs            (dry run)
 *     node scripts/acceptance/acceptance-teardown.cjs --yes      (deletes)
 *
 * The safety story is the same as the seed's and has to be, because a teardown
 * is the more dangerous of the two: a seed that goes wrong adds rows somebody
 * can see and delete, and a teardown that goes wrong removes rows nobody can
 * get back.
 *
 * WHAT IT WILL AND WILL NOT DELETE
 *
 * It deletes rows whose id is in the derived set — the ids the seed computed
 * from a fixed namespace. It never deletes "everything in the store", never
 * takes a store id from the command line, and never deletes a row it cannot
 * name in advance. If you added a product by hand during acceptance testing,
 * its id is not in the derived set and this will not touch it.
 *
 * That is also its one honest limitation, and it is the right way round: the
 * failure mode is leftovers, not loss. Rows created BY the owner journey — a
 * shipment, a support request, a leave record, a hand-added product — survive
 * on purpose, and are counted at the end so the residue is visible rather than
 * silent.
 *
 * A dry run is the default. You have to ask for the deletion.
 */
const {
  HARNESS_STORE_ID,
  derivedId,
  makeClient,
  assertHarnessStore,
  STAFF,
} = require('./lib.cjs')

// These bounds must cover everything the seed could have produced. They are
// deliberately generous: computing an id that was never used costs one entry
// in an `in.()` list and matches nothing, while computing too few would leave
// rows behind and call the teardown clean.
const MAX_PRODUCTS = 60
const MAX_SUPPLIERS = 10
const MAX_SALES = 1200
const MAX_SHIFT_DAYS = 14

const DRY = !process.argv.includes('--yes')

function idRange(prefix, n) {
  return Array.from({ length: n }, (_, i) => derivedId(`${prefix}:${i}`))
}

/**
 * PostgREST puts filters in the URL, and a thousand uuids do not fit in one.
 * Chunked so the request stays inside a sane URL length; each chunk reports
 * its own affected-row count.
 *
 * `&select=id` on the delete is not decoration — D24: an RLS refusal is a
 * successful statement that matched no rows, indistinguishable from "already
 * gone" unless you ask which rows came back. The service role bypasses RLS, so
 * a zero here means genuinely absent, and that is worth being able to say.
 */
async function deleteByIds(rest, table, ids, chunk = 80) {
  let removed = 0
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk)
    const { json } = await rest('DELETE', `${table}?id=in.(${slice.join(',')})&select=id`)
    removed += Array.isArray(json) ? json.length : 0
  }
  return removed
}

async function countWhere(rest, table, query) {
  const { range } = await rest('GET', `${table}?${query}&select=id&limit=1`)
  return range ? Number(range.split('/')[1]) : 0
}

async function main() {
  const { rest, admin } = makeClient()
  const guard = await assertHarnessStore(rest)
  console.log(`target store : ${guard.name} (${HARNESS_STORE_ID})`)
  console.log(`project has  : ${guard.storesInProject} store(s) — this teardown touches exactly 1`)
  console.log(`mode         : ${DRY ? 'DRY RUN — nothing will be deleted' : 'DELETING'}\n`)

  const productIds = idRange('product', MAX_PRODUCTS)
  const supplierIds = idRange('supplier', MAX_SUPPLIERS)
  const saleIds = idRange('sale', MAX_SALES)
  const shiftIds = []
  for (let d = 0; d < MAX_SHIFT_DAYS; d++) {
    for (let i = 0; i < STAFF.length; i++) shiftIds.push(derivedId(`shift:${d}:${i}`))
  }

  if (DRY) {
    // Count what WOULD go by asking the database, not by trusting the
    // arithmetic above.
    const inList = (ids) => `id=in.(${ids.slice(0, 80).join(',')})`
    console.log('would delete (counted against the live rows):')
    console.log(`  products   ${await countWhere(rest, 'products', `store_id=eq.${HARNESS_STORE_ID}&sku=like.ACC-*`)} with an ACC- sku`)
    console.log(`  suppliers  ${await countWhere(rest, 'suppliers', inList(supplierIds))}`)
    console.log(
      `  sales      ${await countWhere(rest, 'sales', `store_id=eq.${HARNESS_STORE_ID}`)} in store ` +
        `(the derived set offers ${saleIds.length} candidate ids)`,
    )
    console.log(`  shifts     ${await countWhere(rest, 'shifts', inList(shiftIds))}`)
    console.log(`  staff      ${STAFF.length} auth users: ${STAFF.map((s) => s.email).join(', ')}`)
    console.log('\nRe-run with --yes to actually delete.')
    return
  }

  // Order matters: children before parents, or a foreign key refuses the
  // parent and the run stops half-done.
  //
  // sale_items has no store_id and its ids depend on which products appeared
  // in which sale, so they are not enumerable from a counter. Delete them by
  // their sale_id instead — the FK is `on delete cascade`, but doing it
  // explicitly means the count is reported rather than assumed.
  let removedItems = 0
  for (let i = 0; i < saleIds.length; i += 80) {
    const slice = saleIds.slice(i, i + 80)
    const { json } = await rest('DELETE', `sale_items?sale_id=in.(${slice.join(',')})&select=id`)
    removedItems += Array.isArray(json) ? json.length : 0
  }
  console.log(`sale_items   ${removedItems} deleted`)

  console.log(`sales        ${await deleteByIds(rest, 'sales', saleIds)} deleted`)
  console.log(`shifts       ${await deleteByIds(rest, 'shifts', shiftIds)} deleted`)
  console.log(`products     ${await deleteByIds(rest, 'products', productIds)} deleted`)
  console.log(`suppliers    ${await deleteByIds(rest, 'suppliers', supplierIds)} deleted`)

  // Staff last: profiles cascade from auth.users, and anything referencing a
  // staff id (shifts.staff_id, staff_leave.staff_id) has to be gone or nulled
  // first. sales.sold_by has no cascade, which is exactly why sales are
  // deleted above before we get here.
  const list = await admin('GET', '/admin/users?per_page=200')
  const wanted = new Set(STAFF.map((s) => s.email))
  let removedUsers = 0
  for (const u of (list.json && list.json.users) || []) {
    if (!wanted.has(u.email)) continue
    const del = await admin('DELETE', `/admin/users/${u.id}`)
    if (del.ok) removedUsers++
    else console.log(`  WARN could not delete ${u.email}: ${del.status} ${JSON.stringify(del.json)}`)
  }
  console.log(`staff users  ${removedUsers} deleted (profiles cascade)`)

  // ---------------------------------------------------------------------
  // What is left, said out loud.
  // ---------------------------------------------------------------------
  // "No orphaned rows" is a claim, so it gets measured. Anything still here
  // was either created by hand during the journey or is a genuine leftover,
  // and the two are worth telling apart by eye.
  console.log('\nremaining in this store after teardown:')
  for (const t of [
    'products',
    'suppliers',
    'shipments',
    'supplier_activity',
    'sales',
    'shifts',
    'staff_leave',
    'customers',
    'notifications',
    'support_requests',
    'checkout_stations',
  ]) {
    const n = await countWhere(rest, t, `store_id=eq.${HARNESS_STORE_ID}`)
    console.log(`  ${t.padEnd(20)} ${n}`)
  }
  const staffLeft = await countWhere(rest, 'profiles', `store_id=eq.${HARNESS_STORE_ID}`)
  console.log(`  ${'profiles'.padEnd(20)} ${staffLeft}  (owner + harness account expected)`)
  console.log('\nAnything non-zero above was NOT created by the seed. Check it by hand before calling the store empty.')
}

main().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
