#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- see lib.cjs */
/**
 * The public demo account.
 *
 *     node scripts/acceptance/ensure-demo-user.cjs --yes
 *
 * Idempotent: creates the auth user if absent, resets the password to the
 * published one if present, and makes sure the profile row points at the
 * seeded store.
 *
 * ROLE IS `owner`, DELIBERATELY, AND IT IS A TRADE-OFF.
 *
 * A reviewer gets one visit. `staff` renders four sidebar entries and bounces
 * off /settings, /audit, /reports, /customers and /suppliers; `manager` still
 * loses /settings and /audit. Either would show a reviewer a smaller product
 * than the one that was built, and they would have no way to know what they
 * were not being shown. Owner is the only role that renders the whole app.
 *
 * The cost is real and is stated rather than hidden: these credentials are
 * published, so anyone who reads them is an owner of the demo store and can
 * edit or delete its data. Three things bound that, and none of them is
 * "nobody will bother":
 *
 *   1. RLS scopes the account to ONE store. scope-check.js measured the
 *      harness account — same store, same role — seeing 1 store of 4 and zero
 *      rows belonging to any other. A visitor cannot reach a real shop.
 *   2. Nothing here is real. Every product, sale and staff member came from
 *      acceptance-seed.cjs; the "staff" are @stockpulse.test addresses that
 *      cannot receive mail.
 *   3. Damage is one command from undone. The seed is idempotent on derived
 *      ids, so re-running it restores the shop exactly:
 *          node scripts/acceptance/acceptance-seed.cjs --yes
 *
 * If this ever stops being a portfolio demo and starts holding anything real,
 * the answer is a read-only role enforced in RLS, not a weaker password.
 */
const { HARNESS_STORE_ID, makeClient, assertHarnessStore } = require('./lib.cjs')

// Published in the README and on the login screen. Not a secret, and written
// here in plain sight on purpose — a "secret" that ships in a public repo and
// on a sign-in page is not a secret, and pretending otherwise is how a real
// one ends up next to it.
const DEMO_EMAIL = 'demo@stockpulse.test'
const DEMO_PASSWORD = 'StockPulseDemo2026!'
const DEMO_NAME = 'Demo Reviewer'

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error(
      'Refusing to run without --yes.\n' +
        `Creates/refreshes ${DEMO_EMAIL} as an OWNER of the seeded harness store.\n\n` +
        '  node scripts/acceptance/ensure-demo-user.cjs --yes\n',
    )
    process.exit(2)
  }

  const { rest, admin } = makeClient()
  const guard = await assertHarnessStore(rest)
  console.log(`target store : ${guard.name} (${HARNESS_STORE_ID})`)
  console.log(`project has  : ${guard.storesInProject} store(s) — this touches exactly 1`)

  const list = await admin('GET', '/admin/users?per_page=200')
  const existing = ((list.json && list.json.users) || []).find((u) => u.email === DEMO_EMAIL)

  let userId
  if (existing) {
    userId = existing.id
    // Reset the password every run, so the published credentials are always
    // the working ones. A README that lies about how to sign in is worse than
    // no README.
    const upd = await admin('PUT', `/admin/users/${userId}`, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (!upd.ok) throw new Error(`could not reset demo password: ${JSON.stringify(upd.json)}`)
    console.log(`demo user    : reused ${userId} (password reset to the published one)`)
  } else {
    const created = await admin('POST', '/admin/users', {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME, demo_account: true },
    })
    if (!created.ok || !created.json || !created.json.id) {
      throw new Error(`could not create demo user: ${JSON.stringify(created.json)}`)
    }
    userId = created.json.id
    console.log(`demo user    : created ${userId}`)
  }

  const { json: profile } = await rest(
    'POST',
    'profiles?on_conflict=id',
    [
      {
        id: userId,
        store_id: HARNESS_STORE_ID,
        full_name: DEMO_NAME,
        email: DEMO_EMAIL,
        role: 'owner',
        job_title: 'Store Owner (demo)',
        invited: false,
      },
    ],
    'return=representation,resolution=merge-duplicates',
  )
  const row = Array.isArray(profile) ? profile[0] : null
  console.log(`profile      : ${row && row.role} of ${row && row.store_id}`)
  console.log(`\nSign in with  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
