# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout — two separate projects

This folder is not itself a git repository. It bundles two independently-versioned projects; know which one you're in before running any command:

1. **Root (this directory)** — a static marketing/landing-page prototype (`react-example`, Vite + React 19), generated in Google AI Studio to mock up the "Stock Pulse" visual design (`src/App.tsx` renders the whole single-page site: hero, features, pricing, testimonials, an in-page `FullDashboardView` mock, etc., all from static/hardcoded data in `src/types.ts`-typed components). It is not wired to any backend — the `@google/genai` and `express` deps in its `package.json` are unused scaffolding from the AI Studio template.
2. **`stockpulse/`** — the real product: a Next.js 16 App Router application with a Supabase backend. It is **its own git repository** (`stockpulse/.git`), with its own `stockpulse/CLAUDE.md` (which imports `stockpulse/AGENTS.md`). `.claude/launch.json` at the root points `npm run dev` at this subfolder, confirming it's the primary app for day-to-day development, not the root prototype.

Nearly all feature work happens inside `stockpulse/`. The root prototype is a frozen design reference; `designs/*.png` holds the original mockups it was built from.

**Current working-tree caveat:** as of this writing, `stockpulse/` has uncommitted local changes where `package.json`, `tsconfig.json`, `README.md`, and `.gitignore` were overwritten with the root prototype's versions (`git status`/`git diff` inside `stockpulse/` shows this), and copies of the root prototype's own files (`src/`, `index.html`, `vite.config.ts`, `metadata.json`, `bun.lock`) landed inside `stockpulse/` as untracked files. The commands below reflect the **real, git-committed** Next.js app (`git show HEAD:package.json` in `stockpulse/`). If `npm run dev` in `stockpulse/` unexpectedly launches Vite instead of Next, run `git status` there — the fix is restoring the tracked files and removing the stray untracked ones (confirm with the user before discarding anything).

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
- No test suite is configured in this project.
- Database schema/migrations live in `stockpulse/supabase/` (`schema.sql` + `schema_phase2-4.sql` for the base schema, `migrations/0001`–`0005` applied afterward) — run these in the Supabase SQL editor, there's no migration CLI wired up.

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
