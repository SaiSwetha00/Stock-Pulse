/* eslint-disable @typescript-eslint/no-require-imports --
 * Node CommonJS tooling, not application code. It never ships in a bundle and
 * never runs in a browser; `require()` is what lets it run under a bare
 * `node scripts/...` with no build step. The rule is right about the app and
 * wrong about this file, so it is disabled here rather than in the shared
 * config, where it would stop protecting everything else.
 */
/**
 * ACCEPTANCE SEED — shared safety rail and data plane.
 *
 * Read scripts/acceptance/README.md before running anything in this folder.
 *
 * This module exists so the seed and the teardown cannot disagree about two
 * things that must never drift apart:
 *
 *   1. WHICH STORE. One hard-coded id, checked three independent ways.
 *   2. WHICH ROWS. Every id is derived, not random, so teardown can
 *      reconstruct the exact set the seed created without a manifest file
 *      that could be lost, stale, or edited.
 *
 * The manifest-free design is deliberate. A teardown that reads a JSON file
 * of "what I inserted last time" is only as safe as that file, and the failure
 * mode is silent: a missing manifest makes teardown a no-op that reports
 * success, and a stale one makes it delete rows it did not create. Derived ids
 * have neither failure mode — the same key always produces the same uuid, and
 * an id the seed never used simply matches nothing.
 */
const crypto = require('crypto')
const fs = require('fs')

const APP = require('path').resolve(__dirname, '../..')

// ---------------------------------------------------------------------------
// GUARD 1 — the store id is a constant in the source, never an argument.
// ---------------------------------------------------------------------------
// There is no --store-id flag and there must never be one. A destructive
// script whose target is a command-line argument is one typo away from the
// wrong shop, and the whole point of this file is that the blast radius is
// decided at review time rather than at 2am.
const HARNESS_STORE_ID = 'e47fe6eb-8825-4612-965f-cb61b9be3864'
const HARNESS_STORE_NAME = 'StockPulse Demo Store'

// ---------------------------------------------------------------------------
// Derived ids
// ---------------------------------------------------------------------------
// RFC 4122 v5-shaped: sha1 over a fixed namespace plus a stable key. Not a
// cryptographic claim, just a stable one — `product:0007` must map to the same
// uuid on every machine, forever, so teardown can find it.
const NAMESPACE = 'stockpulse.acceptance-seed.v1'

function derivedId(key) {
  const h = crypto.createHash('sha1').update(`${NAMESPACE}:${key}`).digest()
  const b = Buffer.from(h.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50 // version 5
  b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant
  const hex = b.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
function loadEnv() {
  const raw = fs.readFileSync(`${APP}/.env.local`, 'utf8')
  const env = Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      }),
  )
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('.env.local is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return env
}

function makeClient() {
  const env = loadEnv()
  const URL = env.NEXT_PUBLIC_SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

  async function rest(method, pathAndQuery, body, extraPrefer) {
    const res = await fetch(`${URL}/rest/v1/${pathAndQuery}`, {
      method,
      headers: { ...headers, Prefer: extraPrefer || 'return=representation,count=exact' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = text
    }
    if (!res.ok) {
      throw new Error(`${method} ${pathAndQuery} -> ${res.status} ${typeof json === 'string' ? json : JSON.stringify(json)}`)
    }
    return { json, range: res.headers.get('content-range') }
  }

  async function admin(method, path, body) {
    const res = await fetch(`${URL}/auth/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = text
    }
    return { ok: res.ok, status: res.status, json }
  }

  return { rest, admin, URL }
}

// ---------------------------------------------------------------------------
// GUARDS 2 and 3 — prove the target before writing to it.
// ---------------------------------------------------------------------------
/**
 * Guard 2 checks the store row exists AND its name matches. Two independent
 * facts have to line up: if the constant above were ever edited to another
 * shop’s uuid, the name check is what stops it, because nobody renames a shop
 * to "StockPulse Demo Store" by accident. This constant and the `stores.name`
 * row are ONE fact in two places: rename the store and this must change in the
 * same commit, or every acceptance script aborts on Guard 2.
 *
 * Guard 3 counts how many stores the project has and prints it. This is not a
 * check the script can fail on — it is a number a human reads in the output
 * before typing --yes, and it is there because "scoped to one store" is a
 * claim that deserves evidence next to it (D25's habit, applied to writes).
 */
async function assertHarnessStore(rest) {
  const { json: stores } = await rest('GET', `stores?id=eq.${HARNESS_STORE_ID}&select=id,name`)
  if (!Array.isArray(stores) || stores.length !== 1) {
    throw new Error(`ABORT: store ${HARNESS_STORE_ID} not found (got ${JSON.stringify(stores)})`)
  }
  if (stores[0].name !== HARNESS_STORE_NAME) {
    throw new Error(
      `ABORT: store ${HARNESS_STORE_ID} is named ${JSON.stringify(stores[0].name)}, ` +
        `expected ${JSON.stringify(HARNESS_STORE_NAME)}. Refusing to touch a store this script does not recognise.`,
    )
  }
  const { range } = await rest('GET', `stores?select=id&limit=1`)
  const total = range ? range.split('/')[1] : '?'
  return { name: stores[0].name, storesInProject: total }
}

/** Every write goes through here, so no call site can forget the store_id. */
function scoped(rows) {
  return rows.map((r) => ({ ...r, store_id: HARNESS_STORE_ID }))
}

/**
 * Batched upsert. Deliberately `resolution=merge-duplicates` on the primary
 * key: re-running the seed must be idempotent rather than an error, because
 * the realistic failure is a half-finished run that needs repeating — and the
 * handover note is explicit that a seed abandoned halfway is worse than none.
 */
async function upsert(rest, table, rows, chunk = 200) {
  let written = 0
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk)
    const { json } = await rest('POST', `${table}?on_conflict=id`, slice, 'return=representation,resolution=merge-duplicates')
    written += Array.isArray(json) ? json.length : 0
  }
  return written
}

/** Staff accounts use RFC 2606 `.test`, which can never receive mail. */
const STAFF = [
  { key: 'staff:1', email: 'acceptance.priya@stockpulse.test', full_name: 'Priya Raman', role: 'manager', job_title: 'Floor Manager' },
  { key: 'staff:2', email: 'acceptance.arun@stockpulse.test', full_name: 'Arun Nair', role: 'staff', job_title: 'Counter Assistant' },
  { key: 'staff:3', email: 'acceptance.meera@stockpulse.test', full_name: 'Meera Iyer', role: 'staff', job_title: 'Stock Assistant' },
]

module.exports = {
  APP,
  HARNESS_STORE_ID,
  HARNESS_STORE_NAME,
  NAMESPACE,
  derivedId,
  makeClient,
  assertHarnessStore,
  scoped,
  upsert,
  STAFF,
}
