# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout — one repository, two projects

**This folder IS the git repository**, and `stockpulse/` is a subdirectory of
it — there is no `stockpulse/.git`. Verify with `git rev-parse --show-toplevel`
from anywhere in the tree; it answers with this folder. A commit made from
inside `stockpulse/` lands here, on this branch, and `git status` run there
shows paths relative to `stockpulse/` while still being the same working tree.

(This section previously said the root was not a repository and that
`stockpulse/` was its own. That was wrong, and it mattered: it invites a second
`git push` for a subfolder that has nothing to push, and it makes the planning
docs at the root look like they sit outside version control when they are
tracked here alongside the app.)

It holds two projects. Know which one you're in before running any command:

1. **Root (this directory)** — a static marketing/landing-page prototype (`react-example`, Vite + React 19), generated in Google AI Studio to mock up the "Stock Pulse" visual design (`src/App.tsx` renders the whole single-page site: hero, features, pricing, testimonials, an in-page `FullDashboardView` mock, etc., all from static/hardcoded data in `src/types.ts`-typed components). It is not wired to any backend — the `@google/genai` and `express` deps in its `package.json` are unused scaffolding from the AI Studio template.
2. **`stockpulse/`** — the real product: a Next.js 16 App Router application with a Supabase backend. A plain subdirectory of this repository, not a nested one, with its own `stockpulse/CLAUDE.md` (which imports `stockpulse/AGENTS.md`). `.claude/launch.json` at the root points `npm run dev` at this subfolder, confirming it's the primary app for day-to-day development, not the root prototype.

Nearly all feature work happens inside `stockpulse/`. The root prototype is a frozen design reference; `designs/*.png` holds the original mockups it was built from.

**The working-tree caveat that used to be here is resolved and has been
removed.** It described `stockpulse/package.json`, `tsconfig.json`, `README.md`
and `.gitignore` having been overwritten with the root prototype's versions,
plus stray copies of `src/`, `index.html`, `vite.config.ts`, `metadata.json`
and `bun.lock` sitting inside `stockpulse/`. Checked 2026-08-09: every one of
those files is absent, `stockpulse/package.json` carries the Next.js `dev`
script, and the tree is clean. If `npm run dev` in `stockpulse/` ever launches
Vite instead of Next, that is the symptom to look for again.

## Commands — `stockpulse/` (the real app)

Run from inside `stockpulse/`:

```
npm install
npm run dev      # cross-env NODE_EXTRA_CA_CERTS=./avast-root.pem next dev
npm run build     # next build
npm run start     # next start
npm run lint      # eslint
```

- `NODE_EXTRA_CA_CERTS=./avast-root.pem` in `dev` is machine-specific (Avast antivirus TLS interception); if not needed on your machine, run `next dev` directly.
- **`predev` and `prebuild` stage the barcode decoder's wasm** (`scripts/copy-zxing-wasm.mjs`, `node_modules/zxing-wasm/dist/reader/zxing_reader.wasm` → gitignored `public/wasm/`). npm runs them automatically; if you invoke `next dev`/`next build` directly you must run that script yourself or `/scan` fails with a module-instantiation error. Copied rather than committed so the binary and the JS glue that loads it cannot drift apart.
- **Barcode decoding is `zxing-wasm` on every browser — deliberately not the native `BarcodeDetector`.** WebKit implements that API not at all, so a native-first design would make the fallback the real code path on every iPhone while being the branch nobody tests. One decoder means the behaviour verified on Chrome is the behaviour shipped on Safari. Do not "optimise" this into a native-first split without measuring both paths on a real iOS device. Full reasoning: the header comment of `lib/barcode/decoder.ts`.
- **Scanning is wired into Inventory through two existing flows, never a third.** The `Scan` button mounts Phase 2's `ScannerPrototype` (whose only addition is an optional `onDetected` prop — omit it and `/scan` is unchanged), then `findProductByBarcode` resolves the code against `store_id` + `barcode`. A match opens `ProductModal` in edit mode, which is *how stock is updated* — there is no separate stock-adjust screen in Inventory; the `Quantity` field in that modal is it. No match opens the same modal in create mode with `initialBarcode` pre-filled. Before adding a third outcome, check whether Inventory already has a flow for it.
- **Sales scanning enters through `addToCart`, the same function the search results call** (`components/sales/LogSaleModal.tsx`). Duplicate-increment, the stock cap, the price and the `log_sale` deduction are all inherited — the scan never touches `handleSubmit`. An unknown barcode at the till is an **error** ("Nothing was added"), never the create-product form Inventory offers; a `stock <= 0` product is refused too, because manual search already filters to `stock > 0`. The scanner mounts **inline, not as a nested Modal** (D29 — two focus traps fight), and `key={scanned}` remounts it to re-arm continuous scanning without changing the component.
- **`findProductByBarcode` has NO `canManage` guard, and must not regain one.** Phase 3 guarded it; Phase 4 removed it because `/sales` has no role guard at all — staff work the till, and the guard stopped cashiers scanning. RLS already lets any store member SELECT products, so it protected nothing. Inventory's Scan button stays behind `canWrite`.
- **`findProductByBarcode` is a Server Action deliberately, even though `InventoryClient` already holds every product in memory.** That array is a page-load snapshot; a product added at the till seconds ago is absent from it, so a client-side match would offer to create a duplicate — and the unique index would then refuse the save while naming a product that is not on screen.
- `proxy.ts`'s matcher must exclude every static extension served from `public/`. `wasm` was added for the barcode decoder after measuring 307→`/login` on `/wasm/zxing_reader.wasm` without a session; the file's own comments record the same bug for `mp4` (a black hero) and `opengraph-image` (blank link previews). If you add a binary asset type, curl it unauthenticated before assuming it is served.
- No test suite is configured in this project.
- Database schema/migrations live in `stockpulse/supabase/` (`schema.sql` + `schema_phase2-4.sql` for the base schema, then `migrations/0001`–`0017`) — run these in the Supabase SQL editor, there's no migration CLI wired up. There is also **no DDL path from an agent**: no `psql` on this machine, no `pg`/`postgres` driver in the project, and the service-role key reaches PostgREST, which is the data plane only. Applying a migration is always a request to the owner.

**Do not trust a doc about which migrations are applied — measure.** `PROGRESS.md` carried "0009 NOT APPLIED" for weeks after it had in fact been applied, and this file briefly repeated it. The storage API and PostgREST both answer the question directly in one call, so the check costs nothing:

```
node -e "fetch(process.env.U+'/storage/v1/bucket',{headers:{apikey:K,Authorization:'Bearer '+K}}).then(r=>r.json()).then(console.log)"
```

As of 2026-08-09, verified by measurement rather than by reading: `0001`–`0013` are all applied. `0009`'s bucket exists AND its write policies hold (own-store upload 200, other-store 403, staff 403).

`0014_product_barcode.sql` (2026-08-17) adds `products.barcode` — **applied and verified**: `products` reports 15 columns, the unique index is `(store_id, barcode) where barcode is not null`, and the CHECK is `^[0-9]{8,14}$`. Uniqueness is deliberately **per store, not global** (two shops legitimately stock the same EAN); proved by measurement — the same barcode in a second store returns 200 · 1 row. Measure it the same way — the PostgREST OpenAPI document is the authoritative column list and answers in one call:

```
node -e "fetch(U+'/rest/v1/',{headers:{apikey:K,Authorization:'Bearer '+K}}).then(r=>r.json()).then(s=>console.log(Object.keys(s.definitions.products.properties)))"
```

Read that output before trusting a `barcode present:` boolean derived from it — if the spec fetch fails, `definitions` is undefined and a naive `Object.hasOwn` on `{}` reports `false`, which is indistinguishable from "not applied". That exact false negative happened while writing 0014 (D38 again: name the healthy scenario that produces this output).

**`products` RLS, corrected 2026-08-17 — the staff hole is CLOSED.** For most
of this project `products` also carried `"staff can update stock on sale"` —
`for update using (store_id = current_store_id())`, with no role test, no
column list and no `WITH CHECK`. Permissive policies are OR'd, so **staff could
PATCH any `products` column in their own store** directly through PostgREST,
including `barcode`. Migration `0015_products_staff_policy.sql` drops it.

Selling still works because `log_sale` is `security definer` (`schema.sql:212`)
— it decrements `stock` as its owner, so it never depended on that policy. The
policy was redundant to the sale path and load-bearing only for direct PATCHes.

Measured after applying, with real sessions and the anon key, rows actually
affected (D24):

| role | `log_sale` | `PATCH products` |
|---|---|---|
| staff | 200 · 1 row · stock −1 | 200 · **0 rows** |
| manager | 200 · 1 row · stock −1 | 200 · 1 row |
| owner | 200 · 1 row · stock −1 | 200 · 1 row |

Note Postgres RLS **cannot** restrict an UPDATE to particular columns — there
is no `for update of (stock)`. "Staff may change only stock" is not expressible
as a policy, which is why the fix was to remove the policy and rely on the
definer function rather than to narrow it.


### `products.stock` is DERIVED. Nothing in the app may assign it.

`0016_product_batches.sql` (2026-08-18) — **applied and verified by
measurement**: `product_batches` is in the PostgREST schema with
`id, store_id, product_id, quantity, expiry_date, received_on, note,
created_at, updated_at`, and the mirror check over all 42 harness products
returns zero drifted rows.

A product's stock lives in `product_batches`, one row per delivery, each with
its own nullable `expiry_date`. `products.stock` stays a column — five call
sites in `InventoryClient` alone read `p.stock` — but it is now a
**trigger-maintained mirror of `sum(product_batches.quantity)`**, kept by a
`SECURITY DEFINER` trigger. Write it directly and you set it to a number the
batches do not support; it stays wrong until the next batch change happens to
re-sync it.

Phase 2 (2026-08-18) closed the two writers that did exactly that. `saveProduct`
and `importProducts` now go through `syncProductLots` in
`app/(dashboard)/inventory/actions.ts`, and `ProductPayload` in
`lib/validation/product.ts` **has no `stock` field at all** — the type is the
guard, so a call site cannot quietly reintroduce the overwrite.

Three things about that function that look like details and are not:

- **A submitted lot id is matched against this product's existing lots, never
  trusted.** An unknown id becomes a new lot rather than repointing someone
  else's batch.
- **An unchanged lot is not rewritten.** A no-op UPDATE still fires the
  trigger, which recomputes stock as the batch sum — and `log_sale` still
  decrements `products.stock` without touching lots (FEFO is a later phase), so
  rewriting an untouched lot would restore stock the shop has already sold.
  This is why editing a product's *name* cannot resurrect stock.
- **It is not atomic.** Separate PostgREST calls; a mid-way failure leaves some
  lots written and says so. A retry is safe because surviving lots keep ids.

**`products.expiry_date` is legacy and is neither read nor written.** 0016
copied it into the backfilled lot; one column cannot hold two deliveries with
two different dates. Left in place because dropping it is destructive and
nothing depends on it.

**`product_batches` RLS is the post-0015 shape, and must stay that way.** There
is no blanket store-member UPDATE policy — that is the hole 0015 had to drop
from `products`. Measured with real sessions and the anon key, rows actually
affected (D24):

| role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| staff | 200 · rows visible | **403 · 42501** | 200 · **0 rows** | 200 · **0 rows** |
| manager | 200 · rows visible | 201 · 1 row | 200 · 1 row | 200 · 1 row |
| owner | 200 · rows visible | 201 · 1 row | 200 · 1 row | 200 · 1 row |

No definer function was needed for staff in Phase 2, and adding one "for
symmetry" would be wrong: `saveProduct` is behind `canManage`, so staff have no
Inventory write path to serve. The definer function becomes necessary when
`log_sale` must decrement lots, and it belongs in that phase.

**Expiry in the UI.** `/inventory` reads lots in ONE query — 
`select('*, product_batches(*)')`, resolved through 0016's composite FK, so a
lot cannot arrive from another store. `lib/expiry.ts` does all the reading:
`nextExpiry` is the earliest date among lots with `quantity > 0`, and every
comparison is on YYYY-MM-DD **strings** — `new Date('2026-08-24')` parses as
UTC midnight and renders as the 23rd anywhere ahead of UTC. `today` is computed
server-side with `reportingDate()` and passed to the client component; deciding
it in the browser makes an "Expired" badge differ between the server render and
hydration across midnight.

A blank expiry is valid and always will be — most of what a kirana shop sells
does not perish. A past date is valid too. Only an impossible year (outside
2000–2100) is refused, because the control is a four-digit spinner and `0202`
is one keystroke from `2026`. The bound is absolute rather than relative to
today so the rule stays pure and cannot disagree between client and server.

The inventory CSV export carries `Expiry Date` at **index 9** (tenth column),
between `Min Stock` and `Status`. That exact header is what `lib/importCsv.ts`
maps back onto a lot, so renaming it silently breaks the Excel round trip — the
same rule the `Barcode` column follows. A CSV row describes one lot, so
importing a file **with** a Stock or Expiry column replaces a product's lots,
and a file with **neither** now leaves them alone (it previously wrote stock 0
over every matched product, silently).


### The expiry threshold is `stores.expiry_warning_days`, and it is NOT hours

`0017_store_expiry_warning_days.sql` (2026-08-19) — **applied and verified by
measurement**: the column is in the PostgREST schema cache, all four stores
hold 7, and `stores_expiry_warning_days_check` bites exactly at the boundary
(`90` → 200 · 1 row, `91` → 23514).

It lives on `stores` because that is where `low_stock_threshold_units` already
lives and where /settings already edits a threshold. Read it through
`storeExpiryWarningDays()` in `lib/expiry.ts`, **never off the property** — the
field is optional in the type so the app renders against an unmigrated
database, and `undefined` would reach `shiftDays` as NaN and report that
nothing is expiring, which is the worst way an alerting feature can fail
because it looks exactly like good news.

**`stores.perishables_warning_hours` is the dead column this replaces.** It has
existed since `schema.sql:14` with a /settings slider reading "48 Hours", and
nothing has ever read it — a D5-shaped column. 0017 deliberately does **not**
convert its value (no query ever read it, so 48 is a placeholder and not a
preference) and does **not** drop it (`main`'s SettingsClient still writes it;
dropping breaks saving settings until the Phase 3 branch merges). Drop it with
one line once nothing on `main` references it.

Hours could not work: `product_batches.expiry_date` is a `date`, so 12 hours
and 23 hours are the same query. A unit finer than the data is a control
promising precision it cannot deliver.

**Reading it: `lib/expiringStock.ts#getExpiringStock`.** Same shape as
`low_stock_products` — one scoped call returning rows already ordered
urgency-first, so no page filters or sorts. It is a plain query rather than an
RPC because `low_stock_products` only had to be a function for its
column-to-column test (`stock <= low_stock_threshold`); this one compares a
column to a constant. Undated lots drop out without a second filter, since
`null <= cutoff` is null — which also lets Postgres use 0016's partial index.
Zero-quantity lots are excluded. Rows group to one entry per product carrying
the **at-risk** quantity, not the product's total stock.

**The colour rule, and the mistake it comes from.** Expired is `--danger`;
expiring-soon is `--warning` (`.sp-kpi-warning`, added beside `.sp-kpi-alert`).
`ALERT_STYLES` carries two entries, `expired` and `expiring`, not one with a
flag — the state that can still be sold must not look like the state that
cannot. And **zero is never coloured**: the Low Stock tile already carries the
comment recording that colouring a zero "made an empty store look like a
failing one", and the expiry tile follows it, dropping even the red
"N already expired" line when that count is 0.

**Nothing was added to /reports, deliberately.** Every panel there is a
sales-period aggregate over a range picker with a prior-period comparison.
Expiry is point-in-time stock state with no period and no meaningful
prior-period figure, so it would need either a panel ignoring the page's own
date range or an invented metric. If a later phase wants expiry reporting, it
needs its own surface, not a panel wedged into that one.


### Scanning shows expiry, and `expiryTone` takes the store's window

**Phase 4 (2026-08-19) — expiry tracking is CLOSED.** `findProductByBarcode`
is the ONE place a scanned product is looked up, shared by Inventory and Sales,
so it is where the lots were added: `select('*, product_batches(*)')`. Both
scan flows get expiry with no extra round trip between the beep and the answer,
and neither gained a new code path — Inventory still opens `ProductModal`,
Sales still enters through `addToCart`.

`components/ui/ExpiryTag.tsx` renders it: the **nearest at-risk date only**,
with extra lots as a count ("+2 more lots"), never a list. Both scan surfaces
are places where someone is holding something — a phone at a shelf or a
customer's shopping at a till — and neither can afford a table. The full lot
list already lives in ProductModal, which is what a scan opens.

`/sales` search results carry the tag too, deliberately: a cart line does not
remember how it got there, so a product reached by typing must say the same
thing as one reached by beeping.

**`expiryTone()` now takes `warningDays`, and that fixed a real bug.** Phase 3
made the window per-store (`stores.expiry_warning_days`) and taught the
dashboard to read it, but `expiryTone` kept a hardcoded `EXPIRY_SOON_DAYS = 7`
— so a shop that set 14 would have seen the dashboard call a lot "expiring
soon" while the inventory list showed it neutral until day 7. Nothing surfaced
it because every store still holds 7, so the two agreed by coincidence.
`EXPIRY_SOON_DAYS` is gone. Every caller passes
`storeExpiryWarningDays(store)`; if you add a surface that tones an expiry,
pass it too rather than accepting the default.

**Phase 4 is display only.** An expired scan still adds to the cart and still
opens the edit form. Refusing to sell expired stock is a policy nobody has
asked for — a shopkeeper may well be selling it knowingly at a discount — and
`log_sale` was not touched.

### The app is installable, and the service worker caches NO authenticated HTML

Offline Phase 1 (2026-08-19) added `app/manifest.ts` (served at
`/manifest.webmanifest`), `public/sw.js`, `app/offline/page.tsx` and
`components/pwa/RegisterServiceWorker.tsx`. It makes the app installable and
caches static assets. **It queues nothing and replays nothing** — offline writes
are Phase 2+.

**The worker never caches a page a signed-in user sees, and that is a security
decision.** A grocery phone is shared between the owner and staff; a cached
`/dashboard` would show the next person the previous person's takings before the
network answered, and RLS cannot help because those bytes never reach the
server. So the fetch handler ignores every non-GET, every cross-origin request,
every RSC payload (`?_rsc=` / `RSC: 1`), and every navigation except to serve
`/offline` as a fallback. Only `/offline` is precached. **Do not add
network-first-then-cache for navigations** without re-deciding that.

**`putIfCacheable` clones the response BEFORE its first `await`, and the write
runs inside `event.waitUntil`.** Both are load-bearing, not style. Cloning after
`await caches.open()` throws because the page has already begun reading the
body — measured: assets fetched `200 / ok / basic` with correct content-types
while the cache held zero entries, silently, because the call was not awaited.

It also refuses to cache any response whose content-type is `text/html`. That is
the guard against the failure `proxy.ts` documents — an expired session
answering a `.wasm` or `.png` request with the sign-in page. Without it, one
transient auth blip would be cached and served forever.

**`/offline` must stay public.** `lib/supabase/middleware.ts` lists it beside the
legal pages. It returned 307 to `/login` when first built, which would have made
the worker precache the sign-in page as the offline document — a cashier who
lost signal shown a login form they cannot submit, on an already-signed-in
device. Signed in it returns 200 and looks perfect; only an unauthenticated curl
shows it.

**`manifest.webmanifest` and `sw.js` are in `proxy.ts`'s matcher exclusion list**
for the same reason `wasm`, `mp4` and `opengraph-image` are. Served through auth
they come back as HTML, which makes the site report no manifest and makes worker
registration fail on MIME type.

**Lighthouse cannot report a PWA score any more** — measured on 12.8.2: the
categories are `performance, accessibility, best-practices, seo` and every PWA
audit is absent, the category having been removed in Lighthouse 12. Check
installability against Chrome's criteria directly instead.


### Offline reads: IndexedDB by store, and /offline is a STATIC FILE

Offline Phase 2 (2026-08-19). The cached product list lives in **IndexedDB
keyed by `storeId`** (`lib/offline/db.ts`, `lib/offline/snapshot.ts`), never in
the service worker's HTTP cache. The key IS the tenancy rule: no code path reads
"the snapshot" without saying whose, so a caller cannot forget a filter that
does not exist. Verified adversarially - two stores on one device sharing a
barcode, and neither list can see the other's product.

**`CachedProduct` is an ALLOWLIST of ten fields**, not a convenience type.
Persisting the whole `Product` would be shorter and would quietly keep every
selected column forever on a shared shop phone. Reports, sales history,
customers, suppliers and staff are never cached. Adding a field must be a
deliberate edit to that type.

**`public/offline.html` is a plain static document - do not turn it back into a
route.** As `app/offline/page.tsx` it loaded offline, showed the right title,
and then rendered an error boundary: hydrating an App Router page needs its RSC
payload, and the worker refuses to cache RSC payloads so no signed-in page data
is stored on a shared device. The static file removes the conflict rather than
carving an exception into that rule. It reads IndexedDB in vanilla JS and
renders the list, so the offline goal survives the architecture.

That file **restates three rules in plain JavaScript** because it cannot import
TypeScript: the barcode shape test, exact barcode matching, and
expired/expiring-soon. Each is marked in the file. Change them together with
`lib/validation/product.ts`, `lib/offline/barcodeLookup.ts` and `lib/expiry.ts`.

**`offline.html` is in `proxy.ts`'s matcher exclusion list** - the sixth member.
`.html` is not among the listed extensions, so without it the worker's precache
request is answered with a redirect to `/login`, and the worker caches THE
SIGN-IN PAGE as its offline document.

**`lookupBarcode` is the single entry point** for "what product has this
barcode", online and off. `isValidBarcode` is now exported and shared; the
Server Action carried its own inline copy of that regex until this phase.
Callers branch on `source`, deliberately: a cached product can NAME something
at a shelf but not sell it, so Inventory's scan refuses a cache hit rather than
opening a form whose Save would fail.

**Auth offline, both decided by the owner:** an expired session keeps serving
cached reads (a token the device cannot refresh proves nothing but absent
signal), and signing out wipes the cache - `signOutEverywhereLocal` clears
IndexedDB BEFORE `logout()`, because that action ends in a `redirect()` which
throws and never returns.

**When a cache write appears to do nothing, suspect hydration first.** Phase 2
lost most of a session to `OfflineStatus` "not writing" - measured
`hydrated: false`, in a Chrome tab that was not the active tab in its window.
Activate the tab, and the same build writes immediately. `lib/offline/db.ts`
logs its failures now precisely so this is distinguishable next time.

### Environment variables (`stockpulse/.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project, used by all three client variants (see below).
- `SUPABASE_SERVICE_ROLE_KEY` — service-role client (`lib/supabase/admin.ts`), used server-side only for privileged operations (e.g. inviting staff) that must bypass RLS.
- `GEMINI_API_KEY` — powers the AI assistant (`app/api/ai/chat/route.ts`); the endpoint degrades gracefully (200 with an explanatory message) if unset.
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for auth redirects and metadata; falls back to `VERCEL_PROJECT_PRODUCTION_URL` (see `lib/site.ts`).
- `STORE_TIMEZONE` — used for reporting period boundaries (`lib/reportingTimezone.ts`).

## Architecture — `stockpulse/`

**Route structure.** Public routes (`app/page.tsx` landing, `app/login`, `app/signup`, `app/forgot-password`, `app/reset-password`, `app/auth/*` for Supabase auth actions/OAuth callback) sit alongside the authenticated product surface under the `app/(dashboard)/*` route group: `dashboard`, `inventory`, `sales`, `analytics`, `reports`, `customers`, `suppliers`, `staff`, `monitoring`, `audit`, `settings`, `profile`, `help`. `app/(dashboard)/layout.tsx` is the shell that loads the current user once and wraps children in `ToastProvider` → `AIAssistantProvider` → `CommandPaletteProvider`, plus renders `Sidebar`/`Topbar` (desktop) and `MobileHeader`/`MobileTabBar` (mobile).

**Auth & session refresh is a proxy, not a middleware.** This Next.js version (16.2.12) renamed `middleware.ts` to **`proxy.ts`** — `stockpulse/proxy.ts` is the actual session-refresh entry point (its `matcher` deliberately excludes `api`, static assets, and media extensions so crawlers and the hero video aren't redirected to `/login`). It delegates to `lib/supabase/middleware.ts#updateSession`, which redirects unauthenticated requests to `/login` and signed-in requests away from the auth pages to `/dashboard`. `stockpulse/AGENTS.md` warns generally that this Next.js build has breaking API/convention changes from what you'd expect — check `node_modules/next/dist/docs/` before assuming standard Next.js behavior.

**Multi-tenant data model & authorization is enforced twice, deliberately.** Every table (`products`, `sales`, `customers`, `suppliers`, `shifts`, ...) is scoped by `store_id`, and Postgres RLS is the real enforcement boundary (see `stockpulse/supabase/schema*.sql` and `migrations/`). `lib/permissions.ts` (`canManage`, `isOwner`, `canViewReports`) mirrors the database's `can_manage()` function so Server Actions can reject with a readable message instead of an opaque RLS error — **the two must be changed together**, the code comments call out a specific past bug where they drifted. Roles are `owner` > `manager` > `staff`; `lib/nav.ts`'s `NAV_ITEMS` is the single source of truth for both the sidebar and the command palette, and its `roles` arrays must stay in sync with each route's own guard (a documented past bug: the DB/permissions gained `manager` in migration 0002 but `NAV_ITEMS` wasn't updated, so managers got an empty sidebar).

**Supabase has four client variants**, each for a specific execution context — use the one that matches where the code runs: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (RSC/Server Actions, cookie-based), `lib/supabase/middleware.ts` (the proxy, above), `lib/supabase/admin.ts` (service-role, server-only, bypasses RLS).

**Data fetching/mutation pattern.** `lib/data.ts#getCurrentUser` is `React.cache`-memoized per-request and fetches profile+store in one round trip via a PostgREST embed; it's the standard entry point for "who's signed in" across pages and the layout. Writes go through `'use server'` Server Actions (e.g. `app/(dashboard)/inventory/actions.ts`), not client-side Supabase calls — this is intentional so `revalidatePath` can run (client-only writes left the Router Cache stale) and so `canManage`/validation checks can't be bypassed by a crafted request; `store_id` is always taken from the session server-side, never trusted from the caller.

**AI assistant.** `app/api/ai/chat/route.ts` streams Gemini responses via `@google/genai`, rate-limited per-user (`lib/rateLimit.ts`, in-memory — noted in its own comments as per-instance on serverless, not a global guarantee). Tool calls are declared and dispatched in `lib/gemini/tools.ts`; `OWNER_ONLY_TOOLS` gates revenue/staff data by role, and the system prompt (built per-request in the route) also tells the model what the signed-in role may ask about.

## Root prototype (`src/`)

Vite + React 19 + Tailwind 4, single `App.tsx` state machine (`PageView`: `'landing' | 'login' | 'signup' | 'dashboard'`) swapping between marketing sections and mock views — no routing library, no backend calls, no real data. Useful for cross-referencing visual/copy intent against `designs/*.png`, not as a code dependency for `stockpulse/`.

```
npm install
npm run dev       # vite --port=3000 --host=0.0.0.0
npm run build     # vite build
npm run lint       # tsc --noEmit
```
