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
- `proxy.ts`'s matcher must exclude every static extension served from `public/`. `wasm` was added for the barcode decoder after measuring 307→`/login` on `/wasm/zxing_reader.wasm` without a session; the file's own comments record the same bug for `mp4` (a black hero) and `opengraph-image` (blank link previews). If you add a binary asset type, curl it unauthenticated before assuming it is served.
- No test suite is configured in this project.
- Database schema/migrations live in `stockpulse/supabase/` (`schema.sql` + `schema_phase2-4.sql` for the base schema, then `migrations/0001`–`0013`) — run these in the Supabase SQL editor, there's no migration CLI wired up. There is also **no DDL path from an agent**: no `psql` on this machine, no `pg`/`postgres` driver in the project, and the service-role key reaches PostgREST, which is the data plane only. Applying a migration is always a request to the owner.

**Do not trust a doc about which migrations are applied — measure.** `PROGRESS.md` carried "0009 NOT APPLIED" for weeks after it had in fact been applied, and this file briefly repeated it. The storage API and PostgREST both answer the question directly in one call, so the check costs nothing:

```
node -e "fetch(process.env.U+'/storage/v1/bucket',{headers:{apikey:K,Authorization:'Bearer '+K}}).then(r=>r.json()).then(console.log)"
```

As of 2026-08-09, verified by measurement rather than by reading: `0001`–`0013` are all applied. `0009`'s bucket exists AND its write policies hold (own-store upload 200, other-store 403, staff 403).

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
