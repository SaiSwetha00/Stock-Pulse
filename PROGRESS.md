# StockPulse overhaul — progress

Branch `feature/overhaul`. Rollback point is `37132d2` on `main`.
Working doc for the phased overhaul driven by `stockpulse-master-prompt.md`.
Decisions and their reasoning live in `DECISIONS.md`; unlisted bugs found along
the way live in `FOUND-ISSUES.md`.

**A fresh session should read this file, then `DECISIONS.md`, then
`FOUND-ISSUES.md`, before touching anything.**

---

## Operating rules currently in force

1. Commit after every item, message clear enough to bisect against.
2. `tsc --noEmit`, `eslint`, `next build` must all pass before any commit.
3. Never rewrite a file from scratch. Smallest change that works; log the
   temptation in `DECISIONS.md` instead.
4. Every commit leaves the branch deployable.
5. Record budget numbers here after each phase.
6. Interrupt the owner only for: a migration to run, a credential or dashboard
   setting, or a design decision whose wrong guess costs a whole phase.
   Batch those rather than asking repeatedly.

## Performance budget

| Metric | Budget |
|---|---|
| Shared client JS | < 200 KB gzipped |
| Lighthouse Performance | >= 90, landing and dashboard |
| LCP | < 2.5 s |
| INP | < 200 ms |
| CLS | < 0.05 |
| Per 3D scene | <= 150 KB gz, lazy, 0 KB added to shared |

Measured by gzipping built chunks from `.next/build-manifest.json`
(`rootMainFiles` + `polyfillFiles` + `lowPriorityFiles`).

| After phase | Shared JS | All chunks | Notes |
|---|---|---|---|
| 1.1 Help Centre | 169.3 KB | — | baseline established |
| 1.2 AI assistant | 169.3 KB | 998.7 KB | -8.3 KB vs before; chunk reshuffle |
| Voice input | 169.3 KB | 1000.1 KB | |
| 1.3 + 1.4 | 169.3 KB | 1001.4 KB | |
| Invite UI | 169.3 KB | 1001.8 KB | |
| Staff tokens + S1 | 169.3 KB | 1001.8 KB | styling only |
| Phase 4 (tokens) | 169.3 KB | 1001.8 KB | |
| Phase 5 (landing tokens + copy) | 169.3 KB | 1001.7 KB | |
| Phase 7 | 169.3 KB | 1001.3 KB | CSS 18.7 KB gz |
| Greeting + images (final) | **169.3 KB** | 1006.5 KB | CSS 19.7 KB gz |

Shared JS never moved from 169.3 KB across the entire overhaul, including the
dashboard's animated mark — that ships in the dashboard route's own chunk. The
+5 KB in all-chunks is the crop component and the image upload paths, which
only load on the routes that use them.

Shared JS never moved from 169.3 KB across the entire overhaul — 85% of the
200 KB budget, of which **38.7 KB is polyfills** and 130.1 KB is
`rootMainFiles`. That is the single biggest remaining performance lever and
nothing in this work touched it.

**Not measured, and not measurable from here:** Lighthouse Performance, LCP,
INP, CLS. Every one of those needs a real browser session against authenticated
routes. The bundle figures above are gzipped byte counts from the build output,
which is a different thing and should not be reported as if it were a Lighthouse
score.

Shared has not moved from 169.3 KB across all of Phase 1. That is 85% of the
budget consumed before any route adds anything — polyfills are 38.7 KB of it.
Audit scheduled before Phase 6.

---

## Done

- **Phase 0 — audit.** Established live deploy == committed code, which
  reframed all of Phase 1. `FOUND-ISSUES.md` created with 8 unlisted issues.
- **Phase 1.1 — Help Centre.** 10 categories, 12 articles, real search over
  full article bodies, support request form + `0006` migration.
- **Phase 1.2 — AI assistant.** `0007` schema (owner-blind by design),
  thread history, New/Clear chat, mute preference, server-side turn
  persistence.
- **Voice input.** Rebuilt: live transcription, idle/listening/processing,
  origin-aware permission errors, 3 languages (en-IN default).
- **Phase 1.3 — Profile photos.** `0008` avatars bucket, per-user write
  policies, upload/replace/remove control.
- **Phase 1.4 — Settings.** Theme template-literal bug fixed (both branches),
  derived dirty state, Discard, unload guard.
- **Invite blocker documented.** `inviteStaff` was already correct; the
  failure is SMTP. Logged S1, `.env.example` documents the fix.
- **Phase 1.5 — dropped** by agreement, after the ~8x render claim was
  disproved.

- **Invite management UI.** `resendInvite` / `revokeInvite`, owner-gated and
  restricted to pending invites; `InviteActions` per row.
- **Phase 2 (part) — staff rota tokens.** S3 closed; last 6 raw palette
  classes in `components/staff` removed.
- **Phase 3 (part) — manager badge.** S1 closed; `ROLE_STYLES` was missing
  `manager`, now typed `Record<Role, string>` so the next role breaks the
  build rather than the badge.

## Hardcoded colour audit (for Phase 4)

Counted per file, matching palette classes
(`bg|text|border|ring|from|to|via|fill|stroke|shadow|outline|accent|decoration|divide`
× the full Tailwind palette incl. white/black):

| Area | Palette classes |
|---|---|
| App + shared components (24 files) | **116** |
| `components/marketing` (landing) | **116** |
| Hex literals in `.ts`/`.tsx` | **262** |

Worst offenders: `components/auth/AuthUI.tsx` 30, `MonitoringClient.tsx` 20,
`app/not-found.tsx` 9, `lib/notifications.ts` 8.

`lib/notifications.ts` matters more than its count suggests — colour decided in
a lib file rather than a component means the token system cannot reach it from
the markup.

- **Phase 4 foundation — gold accent, both themes.** Seven token values in
  `:root` and `.dark`, all eleven pairings measured against WCAG AA. Light gold
  is `#8b6508`, not the requested `#B8860B` — that value is 3.25:1 on white and
  fails AA. Charts moved to the gold family. Verified present in the built CSS,
  old green verified absent.

- **Phase 4 — COMPLETE for dashboard surfaces.** Palette classes on dashboard
  and shared components went **116 -> 0** (the 2 remaining grep hits are a
  comment describing what was removed). Added `--success` / `--success-bg` /
  `--success-ink` because green had been the accent and was doubling as the
  healthy-state colour; with a gold accent, in-stock items would have rendered
  gold. Verified live in the browser that tokens flip between themes:
  `accent #8b6508 <-> #e3b341`, `success #157a3a <-> #4ade80`.

  **Read DECISIONS.md D9 before writing token classes** — `/opacity` modifiers
  on these tokens compile, build, and emit nothing. D9 also carries the correct
  built-CSS verification recipe (`grep -oF`, no leading dot).

- **Phase 5 — honest copy.** Removed three claims the product cannot back,
  each checked against the codebase first: the FAQ's "94.2% predictive accuracy
  from computer vision and ethylene models", step 03's auto-generated and
  dispatched purchase orders with SLA scoring, and step 04's "84% spoilage
  reduction" with markdown sync. None of those features exist anywhere outside
  the marketing copy. Replaced with what is actually built.
- **Phase 7 — polish.** Seven dead `href="#"` footer links removed or pointed
  at `/help`; a fake pulsing "US-East Cloud Active" status light and a
  fabricated "Version 4.8.2-Release" removed.

- **Phase 5 — COMPLETE.** Dark-fixed `.sp-landing` token scope; palette classes
  across the whole app went **232 -> 14** (the 14 are alpha scrims and gradient
  stops on built-in colours, which tokens cannot express — see D9). All
  invented copy removed after grep-verifying each claim: RFID, optical tags,
  cold-chain probes, freezer telemetry, ethylene tracking, POS/ERP connectors,
  offline SQLite buffers, multi-store sync, the 14-day hardware pilot, the
  spoilage predictor, and a capped 2,500-SKU pricing tier. The newsletter form
  — which captured an address, claimed "Subscribed!", and did nothing — is gone.
- **Phase 7 — COMPLETE.** Seven dead footer links, a fake "US-East Cloud Active"
  status light, a fabricated version string, an invented pricing tier, and the
  dashboard preview's fake probe-temperature column. `/privacy` and `/terms`
  added as honest placeholders and made public in the proxy. "Stock Pulse
  Technologies Inc." -> "Stock Pulse".

- **Dashboard greeting.** Time-of-day greeting in Cinzel using the profile's
  first name, one line of live context from real data, and a sub-1KB inline-SVG
  pulse mark on CSS keyframes. Shared bundle measured 169.3 KB before and after,
  so it added nothing.
- **Image adjuster.** One shared crop + zoom component for the profile photo and
  product images. Square 512px WebP output; a 4MB camera JPEG lands around 40KB.
- **Product images.** Bucket migration `0009`, upload with crop, `image_url`
  threaded through `ProductInput`/`ProductPayload` (it was absent, so the save
  would have silently dropped it), and `ProductThumb` in the inventory list and
  sales picker with an initials placeholder.

## Final round (2026-08-08)

- **Item 1 — Staff management moved out of Settings.** New `/staff/team`,
  owner-only, joined to the rota by a `StaffTabs` strip. Carries the roster,
  Add Staff, Edit (name / job title / role), Deactivate & Reactivate, and
  resend/revoke for pending invitations. `components/settings/AddStaffModal`
  and `InviteActions` were `git mv`'d into `components/staff` — moved, not
  copied, so there is no second version to drift. Settings now runs no staff
  query at all and keeps one signpost card. See D15, D16, D17.

- **Item 2 — Depth and motion.** 53 cards across every module were
  `rounded-2xl bg-surface shadow-sm` with **no border at all** — the two-layer
  shadow scale was already in place and had nothing to sit against, which is
  what made them read as tinted rectangles. All 53 given `border border-border`
  plus `sp-rise`, additively (see the note in globals.css for why a `.sp-card`
  shorthand would have been a specificity trap).

  New in `globals.css`, all CSS: `sp-rise` + `sp-delay-1..6` (mount entrance
  and stagger), `sp-lift` (hover elevation and press, press also on touch),
  `sp-collapse` (0fr→1fr height transition), `sp-settle`, `sp-check`/
  `sp-check-path` (the tick that draws itself), `sp-accent-edge` (the one
  decorative use of gold, on the one card that answers the page's question).
  Every entrance uses `animation-fill-mode: backwards`, so an animation that
  never runs never hides anything.

  `CountUp` is the single piece of JavaScript — IntersectionObserver to start,
  rAF to step, and it writes to the DOM over a rendered final value rather than
  holding the in-flight number in state, so the correct figure is on screen
  even if the effect never runs. See D18.

  Help Centre was the last page inventing its own frame (`max-w-[1100px]
  px-6 py-10`, hand-rolled eyebrow, bold Inter h1); it is now
  `sp-page`/`sp-eyebrow`/`sp-title` like everything else.

  **Shared JS measured 169.3 KB before and after — unchanged.** CSS 19.7 → 20.4
  KB gz. All seven new classes verified present in the built CSS by the D9
  recipe.

- **Item 3 — Phase 7, completed rather than sampled.**

  | Item | State |
  |---|---|
  | Page titles | 15 routes had none. All now titled; the 4 auth pages get theirs from a new segment `layout.tsx` because a client component cannot export `metadata`. Every `(dashboard)` route also carries `robots: { index: false }`. |
  | Loading states | 8 route-specific `loading.tsx` added (analytics, reports, customers, audit, monitoring, support, settings, profile) so each reserves its own geometry rather than the generic group fallback. 15 in total now. |
  | Error boundaries | `app/error.tsx` added. The landing, `/login`, `/signup`, `/privacy` and `/terms` previously had **none** — `(dashboard)/error.tsx` covers only the authenticated group and `global-error.tsx` only fires when the root layout throws. |
  | Empty states | Audited all 15 modules. All covered; the two gaps found were the staff availability rail (no team yet) and monitoring (already had a bespoke "Set Up 4 Stations" state, left as-is). |
  | Favicon | Was still create-next-app's default — 25,931 bytes of the Next.js mark. Replaced with a generated 16/32/48px ICO (1,283 B) and a 180px `apple-icon.png`, both the gold pulse mark. |
  | OG image | Did not exist; link previews rendered as blank cards. `app/opengraph-image.tsx` added and **verified serving as `image/png`, 70 KB**. |
  | 404 | Returns a real 404 with the right page. See the caveat below. |
  | Focus rings | Global `:focus-visible` rule confirmed present in the shipped stylesheet, along with `.skip-link` and 7 `prefers-reduced-motion` blocks. |
  | Mobile 390px | All 15 routes measured `scrollWidth === 390` — no horizontal overflow anywhere. Two non-reflowing tables (Reports' revenue-by-day, the CSV import preview) were given `overflow-auto` so they scroll inside their own box. |

  Three bugs that only running the production server could find — `tsc`,
  `eslint` and `next build` were green through all of them:

  1. **The dashboard crashed at request time.** `DashboardView` is a Server
     Component and `format={formatCurrency}` passed a *function* to a Client
     Component. `CountUp` now takes a format *name*.
  2. **The OG image was redirected to `/login`.** Next serves it from an
     extensionless route, so the proxy matcher's extension rules missed it and
     every scraper got the sign-in page as HTML.
  3. **`/help` rendered "Help Centre · StockPulse · StockPulse"** — the page
     spelled out a suffix the layout template already appends.

  Bundle after all of it: shared JS **169.4 KB** (+0.1 KB), CSS 20.4 KB gz.

- **Item 4 — Merged and deployed.** `main` at `31e5c90`, live at
  **https://stock-pulse-mu.vercel.app**.

  **There were two Vercel projects, and the repo was linked to the wrong one.**
  `stockpulse/.vercel/project.json` pointed at `stockpulse` (created 8d ago,
  Root Directory `.` — i.e. the repo-root Vite prototype, not the Next app —
  and missing `RESEND_API_KEY`, `SUPPORT_NOTIFY_EMAIL` and `STORE_TIMEZONE`).
  The credentials had been added to `stock-pulse` (Root Directory `stockpulse`,
  all 8 env vars). Confirmed with the owner, then relinked. The relink is
  local-only: `.vercel` is in `stockpulse/.gitignore:43` by Vercel's own
  convention, so it cannot be committed without un-ignoring it.

  Verified live: `/`, `/login`, `/signup`, `/privacy`, `/terms` all 200 and
  hydrate; `/opengraph-image` serves `image/png` 70 KB (the proxy fix holds in
  production); favicon and apple-icon serve; `robots.txt` and `sitemap.xml`
  carry the right absolute domain, which also confirms `NEXT_PUBLIC_SITE_URL`
  is correct for the live host; `/dashboard` 307s when signed out; no
  horizontal overflow at 390px. One more doubled-suffix title bug found on the
  deployed pages (`/privacy`, `/terms`) and fixed in `31e5c90`.

## Could not verify this session

- **Authenticated routes on the *live* domain.** Signing in means typing a
  password, which this agent will not do. All 15 authenticated routes were
  verified against the identical production build (`next build` + `next start`,
  same commit, same Supabase project) using the existing local session: every
  one returned 200 with the right title, no error boundary, `sp-rise` present,
  and `scrollWidth === 390` at a 390px viewport. That is strong evidence, not
  a substitute for signing in on the live URL.
- **Supabase redirect URL allow-list.** No read-only endpoint exposes it — the
  obvious probe (`/auth/v1/authorize`) returns `provider is not enabled`
  because no OAuth provider is on, so it cannot discriminate. Needs the
  dashboard. The value that must be listed is
  `https://stock-pulse-mu.vercel.app/reset-password` (invites and recovery both
  target it) plus `https://stock-pulse-mu.vercel.app/auth/callback`.
- **Support email actually arriving.** Requires a real submission.
- **Invite delivery and anything needing a second account** — including
  Deactivate/Reactivate against a real staff member. The action is owner-gated
  and refuses self and owner targets, but it has not been exercised end to end.
- **Lighthouse, LCP, INP, CLS.** Unchanged from the previous session: these
  need a real browser run against authenticated routes.
- **Screenshots.** The Browser pane could not composite frames this session, so
  everything visual was verified through the DOM and the shipped stylesheet
  rather than by eye.

## Known caveat

- **A signed-out visitor hitting an unknown URL gets `/login`, not the 404
  page.** `updateSession` redirects any non-public path when there is no
  session, and it cannot know which paths exist. Signed-in users get a proper
  404 with status 404. Left as-is deliberately: changing it late means
  touching the auth redirect, and bouncing an anonymous visitor to sign-in is
  defensible behaviour. Flagged rather than fixed.

## Known remaining, deliberately not done

- **14 palette classes remain, all intentional.** Alpha scrims (`bg-black/40`
  on modals, drawers, the command palette) and gradient stops
  (`via-black/95`, `from-white`). Both need `/opacity` on a built-in colour,
  which our tokens cannot express (D9), and both read correctly on either
  theme already. Converting them would make them worse.
- **Nothing else.** The two dead functions in `ThreeGroceryVisual.tsx` were
  removed; eslint now reports zero lines across `app`, `components` and `lib`.
- **Two product surfaces intentionally have no image**, both reasoned:
  Sales "Top Selling Items" is an aggregate (`{ name, units }[]`) with no
  product id, and it is a report rather than a picker; suppliers/purchase
  orders never pick individual products, so there is no product row to put an
  image on.

## Left

- Phase 2 — rest of the Staff module
- Phase 3 — rest of roles / audit (needs SMTP configured to test end to end)
- Phase 4 — typography and colour; semantic tokens, light + dark, WCAG AA
- Phase 5 — landing rhythm and honest copy
- Phase 7 — polish

## Deferred, not dropped

- **Phase 6 — 3D scenes.** Deferred by the owner on 2026-08-07, in favour of
  shipping a fast, consistent, polished app rather than one carrying eleven 3D
  scenes. Nothing about it has been judged unworkable and no code has been
  removed; `components/marketing/ThreeGroceryVisual.tsx` still exists and still
  renders.

  If it is picked up later, the constraints the owner set still stand: every
  scene lazy-loaded, 0 KB added to the shared bundle, <= 150 KB gz each, DPR
  capped at 1.5 on mobile, loop paused off-screen, lighting read from the
  active theme tokens — and any scene costing more than 5 Lighthouse points
  gets cut. The shared-bundle audit was a prerequisite for it and remains
  worth doing on its own merits.

## Blocked on the owner

| What | Why |
|---|---|
| Run `0009_product_images_bucket.sql` | **NOT APPLIED.** Product image uploads report "storage is not set up" until it is run |
| Run `0008_avatars_bucket.sql` | Applied |
| Resend -> Supabase custom SMTP | Invitations cannot be delivered; blocks Phase 3 |

## Could not verify without the owner

- Lighthouse on authenticated routes — needs a logged-in Chrome with
  `--remote-debugging-port=9222`.
- Per-route JS attribution — `@next/bundle-analyzer` is inert under Turbopack,
  `next experimental-analyze` produced nothing, and Next 16 no longer emits
  `app-build-manifest.json`. Three dead ends; plan is the browser network panel.
- Anything requiring a real microphone, a real invite email, or a second user
  account.
