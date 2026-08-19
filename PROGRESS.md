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

## Follow-up round (2026-08-08, after the deploy)

- **Analytics folded into Reports; `/analytics` retired.** Reports now compares
  each range against the equally-long period before it — and unlike the old
  Analytics page, that works for custom ranges, not just 7/30/90 presets.
  `WINDOW_DAYS` went 90 → 180 because a 90-day report needs 180 days in hand to
  compare against anything; `windowStartIso` reaches the client so a range at
  the edge of the window says "outside compared window" rather than reading a
  half-empty prior period as a collapse in revenue. Route, client and loading
  state deleted; `NAV_ITEMS`, `robots.ts`, the dashboard quick actions and five
  help articles repointed. Verified: `/analytics` 404s, and zero `/analytics`
  links or "Analytics" strings remain in the rendered HTML of `/dashboard`,
  `/staff`, `/reports` or `/help`. See D20.

- **Leave added to the Staff module.** `Record Leave` on the rota takes a
  person, a first and last day (both inclusive, so one date twice is a single
  day off), a type (holiday/sick/unpaid/other) and an optional note. It draws
  as a warning-toned band across the top of the affected day columns —
  deliberately *not* a block on the hour grid, since a day off has no start or
  end time — and the availability rail gains a third state, because "not
  scheduled" and "on leave" otherwise look identical.

  **Shift assignment is blocked in `saveShift`, not in the form.** `ShiftModal`
  warns as soon as you pick a person and a date, but a tab left open while
  someone else recorded the leave knows nothing about it, and both fields
  arrive from the browser. See D21.

  **`0011_staff_leave.sql` is NOT APPLIED — see the table below.** The app is
  built to ship ahead of it: `/staff` was loaded against a database without the
  table and renders the rota exactly as before, because 42P01 is treated as "no
  leave on record". Only `saveLeave` reports the missing table, and it names the
  file to run.

- **Leave verified end to end, and the verification found a bug.** `0011` was
  applied, then every path was exercised against the real table by invoking the
  Server Actions over HTTP with a live session.

  **The bug:** `saveLeave` returned `{ok:true}` and wrote the row correctly, but
  the rota showed nothing. `staff_leave` has *two* foreign keys to `profiles`
  (`staff_id` and `created_by`), so `profiles(full_name)` is ambiguous and
  PostgREST answers PGRST201 with a 300. Worse, the result was handled as
  `error?.code === '42P01' ? [] : (data ?? [])`, so **every** error but a
  missing table silently became an empty list — the page rendered perfectly
  with no leave on it and nothing saying why. Fixed in `267002c`: the embed is
  named, and only 42P01 stays special-cased.

  | Checked | Result |
  |---|---|
  | Two-day range renders on the rota | 2 bands, one per day |
  | Assign on a leave day | refused, field error on the date |
  | Assign on a free day (control) | saved |
  | Day before / day after the range | both allowed |
  | First / last day of the range | both blocked — inclusive, no off-by-one |
  | Edit the range | block moves with it |
  | End before start · unknown kind · 732-day span · staff id from another store | each rejected with the right field error |
  | Unassigned shift on a leave day | allowed, which is correct |
  | Delete the leave | day frees up again |

  Test rows were all removed afterwards; `shifts` and `staff_leave` are back to
  empty.

  **Not verified:** the availability rail's "on leave today" state, which is
  gated on `useLocalToday()` and therefore only appears after client hydration.
  The Browser pane in this environment never hydrates React (confirmed: no
  `__react` props on any DOM node), so every UI check here was against
  server-rendered HTML and the Server Actions directly. The rail's server-side
  render is correct; its hydrated state is unexercised.

## Phase 1 — palette and dashboard (2026-08-08, branch `ui/palette-round`)

Branch cut from `main` at `b91ab2a`. Held off `main` deliberately: production
was broken in a way unrelated to this work (authenticated pages stuck on their
loading skeleton), and stacking a visual round on top of an outage makes the
outage harder to reason about.

- **The palette was reversed mid-round, and that is the important part.** The
  first pass (`f28d73b`) tinted the whole page beige, `#ede2cf`. It measured
  well — page-to-surface contrast went 1.043 → 1.262 — and it was still wrong:
  it turned an accent into a page fill, so every card sat on a coloured field
  instead of reading as paper on a desk.

  `a916c07` reverted the page to the near-white it had on `main` (`#fbfaf8`,
  cards `#ffffff`) and demoted gold `#8a6206`, coffee `#d6c3a3` and deep red
  `#8f2a1c` to accents only — hairlines, icon tiles, KPI values, active states,
  focus rings, **never a page or card fill**. Separation now comes from a
  coffee hairline (1.72:1 against the card) plus a soft two-layer shadow. Dark
  mode was left alone.

- **The previous round's "layered shadows" claim was false.** All 23 elements
  carrying a Tailwind `shadow-*` class computed to `rgba(0,0,0,0)` — they
  painted nothing at all. Replaced with a plain-CSS elevation ladder
  `sp-e1/e2/e3`; 23 of 23 now paint. See D22.

- **Dashboard hierarchy.** "Today's Sales" became the hero at 40px (52px from
  `lg`) gold across 2 of 5 columns; the other three dropped to a 24px near-black
  secondary tier. Three-step scale (11px uppercase label / numeral / 12px
  caption), vertical rhythm moved onto 8px, `CountUp` reserves its final width
  in `ch` with `tabular-nums` so counting cannot shift layout.

  Every measured pair clears AA — light: hero gold on card 5.48, secondary
  18.93, label 6.05, body 18.15. Dark: 8.76 / 14.08 / 5.15 / 16.62.

- **Six review defects fixed and measured** (`f0d6af6`): a 525×179 hero card
  holding ~300px of nothing (now a 180px inline-SVG sparkline); the sidebar
  pill using text-grade gold as a fill, which reads coffee-brown (split into
  `--accent` for text and `--accent-fill` `#c9a227` for surfaces, ink 7.8:1);
  Quick Actions measured `[3, 1]`, an orphan row, now `auto-fit
  minmax(9.5rem, 1fr)` measuring `[4]`; **six `images.unsplash.com` loads that
  were already 404**, replaced with canvas-drawn gradients; `CountUp`'s own ch
  reservation clipping numerals on a 390px card; and a flat line of seven
  zeroes rendering as a broken panel.

- **The focus ring was never gold.** Measured `rgb(74,65,57)` — `currentColor`
  on the nav link. The `outline` shorthand with `!important` was not carrying
  its colour; the longhand is now repeated after it. Verified with real
  `Input.dispatchKeyEvent` Tab presses, because `el.focus()` does not reliably
  trigger `:focus-visible`.

- **The toggle bug was not where it looked** (`70e1f2a`). The reported "toggles
  overflow their card" was real, but the button sat 1px *inside* the card at
  every width — the knob was escaping its own track, because it was absolutely
  positioned with no inline anchor and resolved against its static position
  (22px) with the translate stacked on top. ON measured `leftInset 42px in a
  44px track, rightOverflow +18px`. `left-0.5` anchors it; now 2px inside at
  both ends. A second defect surfaced in the same screenshot: the OFF track was
  `--surface-muted #2f2118` on a `#241a12` card, so an unset switch in dark was
  very nearly invisible.

- **Fabricated station data removed from the product** (`7dc5d12`). "Set Up 4
  Stations" was inserting invented live trade: baskets mid-scan totalling
  $148.00, a weight-mismatch alert and an age-verification hold. Those rows
  surfaced on the dashboard as real activity in a shop with no products and no
  sales, and that is what shipped to a client review. The seeder now writes four
  available counters with every session field zeroed and every alert field null.

  The four fabricated rows in the live store were deleted with the service-role
  key — 16 rows existed across all stores, 4 in the target store, 4 removed, 12
  in other stores untouched. The app itself could not remove them, which is how
  the missing DELETE policy was found.

  The rest of the app was swept for invented values: every other `.insert()`
  writes user-supplied form data, and no hardcoded currency, percentage,
  customer or transaction literals exist outside `components/marketing`.

- **Copy.** "N checkouts pending" implied queued work sitting unattended; it
  actually counts counters that are not free. Now "N of M counters busy", and
  when M is 0 the clause is not rendered at all rather than printing "0 of 0".

- **`seed_demo.sql` quarantined** to
  `supabase/dev-only/seed_demo.DO-NOT-RUN-AGAINST-PRODUCTION.sql`, with a header
  explaining that its fabricated products, sales, customers and suppliers become
  indistinguishable from a shop's real trading history. Moved, not deleted, so a
  scratch database can still be seeded. See D23.

## Phase 2 close-out (2026-08-08, branch `ui/palette-round`)

- **Migration 0012 applied.** `checkout_stations` went from 3 policies to 4;
  the new one is `managers can delete stations · DELETE · ((store_id =
  current_store_id()) AND can_manage())`. Applied through the SQL editor.

- **The delete policy had no UI to exercise it** — 0012's own header says so.
  Added `Remove Counter` to each station card, owner/manager only, and only for
  a station that is free or already offline so a live basket cannot be deleted
  out from under the customer at it.

  The delete asks for the removed ids back (`.select('id')`). Without that, RLS
  refusing is indistinguishable from success — 200, no error, zero rows — which
  is the exact silent no-op 0012 fixes.

- **Two defects found by running it, both invisible to `tsc`/`eslint`/`build`:**

  1. `Button` carries `shrink-0`, so two `fullWidth` buttons in the confirm row
     could not shrink and Cancel sat **+237.3px** past the card's inner edge,
     where the card's `overflow-hidden` clipped it away entirely. The control
     was unreachable. Now `flex-1 min-w-0`; re-measured at −31px.
  2. The zero-row guard blamed the migration for *any* empty result. Driving
     the flow headless hit the other cause: after a removal the board shows the
     stale card until `router.refresh()` lands, so a second click deletes an
     already-deleted row and the UI told the shopkeeper to go and run SQL. Now
     names both causes and refreshes.

- **Seed then delete, both proved.** Four counters inserted: all `available`,
  `items_scanned 0`, `current_total 0`, `session_started_at null`, all four
  alert fields null — **4/4**, read from PostgREST, not from the page. Then all
  four removed through the UI's own buttons: DB rows **4 → 0**, board ended on
  the empty state.

  (The table holds 16 rows across 4 stores; the 12 fabricated ones belong to
  three *other* stores and were not touched.)

- **Harness matrix, 16 measurements** — `/dashboard` and `/monitoring` × light
  and dark × 390 and 1440, run twice: once with 4 counters, once with none.

  | | |
  |---|---|
  | CLS | **0** in all 16 |
  | Console errors/warnings | **0** in all 16 |
  | Network failures | 0 real; every one was an `ERR_ABORTED` on a `?_rsc=` prefetch |
  | Card overflow offenders | 0 |
  | Horizontal page overflow | none at 390 or 1440 |
  | Focus rings | every tab stop gold, 0 ringless, 0 non-gold |
  | `N of M counters busy` | `"0 of 4 counters busy"` in all 4 dashboard states with counters; correctly absent in all 4 with none |
  | Monitoring empty state | present in all 4 states with none, with `Set Up 4 Stations`; absent in all 4 with counters |

  **Harness auth is now a dedicated test account**, not a lifted session
  cookie: `harness@stockpulse.test`, created via the Admin API, owner of
  `sandal local store`. Repeatable with nobody in the loop, which Phase 3's
  11-route sweep needs. Setup and its three Windows/Git-Bash traps are written
  up in the scratchpad's `HARNESS-AUTH.md`. **The account still exists** —
  `node harness-auth.js --destroy` removes it.

  **Account scope measured, not assumed.** `scope-check.js` signs in with the
  anon key so RLS applies, and compares against service-role ground truth: of
  4 stores / 8 profiles / 12 stations / 6 products / 6 sales / 14 customers /
  6 suppliers in the project, it sees 1 store, 2 profiles and **zero rows
  belonging to any other store**. A `PATCH` aimed at another store's station
  returned HTTP 200 with 0 rows affected and the row unchanged. Inside its own
  store it is a full owner, which is not the same as harmless — that is exactly
  why it could run the counters test.

- **The harness had been measuring the wrong page and reporting it as green.**
  This is the most dangerous thing found this round, because it fails upward.

  `SP_COOKIE_FILE="$PWD/cookie.txt"` looks correct and is not: `$PWD` in Git
  Bash is `/c/Users/...`, which Node on Windows cannot stat. The file read as
  absent, no cookie was set, the app bounced to `/login`, and the harness
  measured the **sign-in page** while labelling every number `/dashboard`. CLS
  0, console 0, no overflow — a clean report about a page nobody asked about.

  It cost three wrong theories (cookie encoding, CDP `setCookie` semantics, a
  corrupt Chrome profile) before the diagnostic that settled it: a `[diag]` line
  printing how many cookie pairs were parsed, which printed nothing at all
  because the count was zero.

  Two fixes, both in the harness: use `$(pwd -W)` for Windows paths, and
  **hard-fail when `location.pathname` is not the requested path**. A run that
  measures the wrong page must look broken rather than green. Had this stayed
  hidden, every Phase 3 number across 11 routes would have been a measurement
  of `/login`.

  A third Git Bash trap sits next to it: bare `node harness.js /dashboard`
  rewrites the argument to `C:/Program Files/Git/dashboard`. Always prefix
  `MSYS_NO_PATHCONV=1`. The previous session left a
  `result-CProgramFilesGitsettings-light.json` behind as evidence of the same
  bug going unnoticed.

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
| ~~Run `0009_product_images_bucket.sql`~~ | **APPLIED — this row was wrong.** Corrected 2026-08-09 by measuring rather than reading: the bucket exists and is public, and its write policies hold. See the Phase 4 close-out. |
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

## Phase 3C-i — overlay focus, complete (2026-08-09, branch `ui/palette-round`)

Three app defects fixed in `fb4d07e`, three harness defects fixed alongside
them, and the matrix run to completion.

### The app defects

| Overlay | Before | After |
|---|---|---|
| AI panel | `trap=ESCAPED x14` `return=LOST` | trapped, returns to trigger |
| Mobile drawer | `trap=ESCAPED x1` -> "Export CSV" | trapped, returns to trigger |
| Modal (Add Customer, Add Supplier) | `return=LOST -> BODY` | returns to trigger |

The Modal one is the one worth reading twice. It failed on exactly **two of
eight** route modals, and those two are the only two whose first field carries
`autoFocus`. `Modal` recorded `previouslyFocused` in a passive effect, which
runs *after* React commits the panel — and `autoFocus` fires during that
commit. So it faithfully recorded a field inside the dialog as the thing to
return focus to, then focused a detached node on unmount. Reading during render
instead fixes it for all nineteen call sites, not the two that trip it today.
See D29 and D31.

### The matrix

36 runs — `/inventory` `/sales` `/suppliers` `/customers` `/staff` `/reports`
`/audit` `/monitoring` `/profile`, both themes, 390 and 1440 — **104 overlay
instances**.

| Dimension | Result |
|---|---|
| `trap` | correct in 104 of 104 |
| `escape` | closed in 104 of 104 |
| `return` | trigger in 104 of 104 |
| `ringless` | 0 in 104 of 104 |
| `nonGoldRing` | 0 serially; not trustworthy in parallel — see D30 |

`/profile` was never run before this round. It is now covered in all four
configurations, including Edit Profile and Change Password.

**`nonGoldRing` is reported honestly rather than as a pass.** Run eight
concurrent Chromes and it scatters 1..10; run the same configurations one at a
time and the three worst — 10, 7, 7 — all measure 0. The values it produced
under load were the focus ring's own 150ms transition caught mid-flight
(`rgb(136,97,7)` against a gold of `rgb(138,98,6)`). D30 records why polling for
a settled value does not fix this and what does.

### The harness defects, which mattered as much

Two of the four things the probe flagged were the probe.

1. **It was clicking a `display:none` bell.** `Topbar` is wrapped in
   `hidden lg:block`, and `el.click()` fires React's handler on a hidden button
   perfectly happily. At 390 the probe "opened" a 0x0 notification popover,
   walked fourteen tab stops that were all on the page behind it, and reported
   `return=LOST` about a control no phone user can reach. Now bounded to
   `minWidth: 1024`, and a zero-size container reports a loud `INVISIBLE`
   instead of being measured. (That the phone has no notifications affordance at
   all is real, and is logged in FOUND-ISSUES as a product gap.)
2. **`Change Password` was declared by the modal's title, not the button's
   label.** The button reads "Update". Four consecutive runs reported
   `NO TRIGGER` for a control that was on screen the whole time.
3. **The `return` verdict could not tell two worlds apart** — see D31. That is
   what `return-probe.js` exists for.

### Still open

- **`Add Shipment` (`/suppliers`) is unmeasurable on this fixture.** The
  control needs at least one supplier row to exist; `NO TRIGGER` is the probe
  being correct. Needs a seeded supplier before it can be checked.
- **`nonGoldRing` under parallelism** — instrument limitation, recorded in D30,
  not an app defect.

## Phase 3C-ii — Settings, Support, Help Centre (2026-08-09, branch `ui/palette-round`)

The last batch of Phase 3. Three routes, four paths (`/help/[slug]` shares
`SupportRequestForm`, so it is measured too), 16 harness states.

### Three app defects, none of which tsc/eslint/build could see

1. **Settings' three labels pointed at nothing.** Store Name, Primary Address
   and Contact Phone were hand-rolled `<label>` elements with no `htmlFor` and
   inputs with no `id`. Clicking a label did nothing and a screen reader landed
   on three unnamed fields — on the one screen in the app that is entirely a
   form. `Field` wires label, control, hint and error by `useId`, so this class
   of drift cannot recur at a call site that uses it.

2. **The address textarea could not show two rows.** It carried `control-h`,
   which is `height: var(--control-h)` — a fixed 40px — alongside `rows={2}`.
   The height won. `Field`'s `Textarea` uses `min-h-24 resize-y` instead.

3. **An empty store name saved successfully.** `stores.name` is `not null`, and
   `not null` is not `not blank`: clearing the field wrote `''`, the header
   then rendered "Configuration and operational parameters for ." and every
   other surface printing the shop's name went blank with it. New
   `lib/validation/storeSettings.ts` — required name, optional address and
   phone with length bounds and a deliberately permissive phone shape — plus
   trimming on the way out so `" "` cannot pass a check that ran against `""`.

Also: **the last two raw palette classes in the app.** Both range sliders were
a zinc-900 accent, which does not follow the theme — in dark mode the filled
track and thumb were near-black on a near-black card, the same disappearance
the toggle's OFF state had before Phase 1. Now `--accent-fill` (D22's
surface-grade gold). Verified in the built CSS: `accent-color:var(--accent-fill)`
present, `accent-color:var(--color-zinc-900)` gone.

The gone half needed a second look. Tailwind scans **comments** too, so the
first draft of the comment explaining the removal spelled the class name out
and regenerated the very rule it documented. Spelled around now, and the
rebuild confirms the rule is absent.

### What landed, per route

| Route | Change |
|---|---|
| `/settings` | 3 fields → `Field`/`Input`/`Textarea` with inline errors and `aria-invalid`; Discard/Save → `Button` secondary + primary; theme control → a real segmented control (`rounded-sm` inside a `rounded-lg` track — matching the outer radius leaves a sliver of track at each corner); 2 × `rounded-xl` inner panels → 10px; stagger on 4 cards; "Manage team" onto Button's secondary skin |
| `/support` | filter pills → `Button` ghost/secondary; row action → `Button` secondary with `loading`; stagger on request cards |
| `/help` | the search control onto the `Field` skin; category cards → card radius + `sp-e1` + stagger; result rows the same |
| `/help/[slug]` | inherits `SupportRequestForm`'s two `rounded-xl` → 10px |

**The Support filters were wearing the primary skin.** Selected meant
`bg-foreground text-surface` — the same near-black as a Save button — so the
loudest control on a triage screen was the one that only changes what is
listed. Secondary-when-selected, ghost-when-not, `aria-pressed` unchanged.

**One high-emphasis button per screen is read as a ceiling, not a floor.**
`/settings` has Save. `/help` has Send request. `/support` has none, and that
is correct: it is a triage list with no create action, and its one real action
(`Mark resolved`) appears once per row — N primary buttons is the same as none.
See D32.

### The 16-state matrix — /settings /support /help /help/[slug] × light,dark × 390,1440

Run serially, per D30.

| Dimension | Result |
|---|---|
| CLS | **0** in all 16 |
| Console errors | **0** in all 16 |
| Horizontal page overflow | none at 390 or 1440 |
| Card-overflow offenders | 0 in all 16 (after a harness fix — below) |
| Focus rings | `gold == tabStops` in all 16 (20–22 stops), `nonGoldRing` 0, `ringless` 0 |
| Requested vs landed | 16/16 exact — `/settings`×4, `/support`×4, `/help`×4, `/help/setting-up-your-store`×4 |
| Network failures | 0 real; all 36–38 per run are `ERR_ABORTED` on `?_rsc=` prefetches, classified rather than assumed |

**Phase 2's notification toggles re-confirmed**, by the harness's own knob
probe rather than by eye: ON `leftInset 22 / rightOverflow −2` in a 44px track,
OFF `leftInset 3 / rightOverflow −21`, every toggle `−1px` inside its card at
both widths and both themes. Identical to the Phase 2 post-fix figures.

### Two harness defects, one of them mine

1. **The first 16-state run was void and its numbers are not reported.** I ran
   `npm run build` while `next start` was already serving, so chunk hashes moved
   under the running server: 500s and 404s on `_next/static/chunks/*.js`, and on
   `/help/[slug]` the **stylesheet** failed to load. That run reported
   `gold=0 nonGoldRing=22` and CLS 0.0214 on that route — which is not an app
   defect, it is a page with no CSS painting Chrome's default black ring on
   every control. Server restarted against the current build, matrix re-run.
   D26 again: the instrument must not be measuring one build while the report
   names another.

2. **`offenders=1` on /settings in all four states was the probe.** It reported
   `button: right +12px left +12px` — a perfectly symmetrical 12px, which is
   the button's own `px-3`. The overflow probe finds a control's card with
   `el.closest('.sp-e1')`, and `closest()` matches the element *itself*; the
   theme control's active segment legitimately carries `sp-e1`, so it became
   its own card and was measured against its own padding box. Now
   `el.parentElement.closest('.sp-e1')`. Re-run: 0 offenders in all four.
   That is the third round running in which something the probe flagged was the
   probe — see D31.

`toggle-check.js` was written for the toggle re-confirmation and then not
needed: `harness.js` already measures knob-against-track and control-against-
card. Left in the scratchpad, unused.

### Open-state traversal on the three routes

These routes introduce **no overlay of their own** — no `Modal`, no
`role="dialog"`, nothing that mounts on interaction. Verified by grep, not
assumed. So there was nothing new to add to `overlay-probe.js`'s `OVERLAYS`
array.

The probe was run anyway, because FOUND-ISSUES named `/settings`, `/support`
and `/help` as the routes where the four *global* overlays had never been
measured in their open state. Light, 1440, serially:

| | command palette | AI panel | notification popover |
|---|---|---|---|
| `/settings` | trapped · closed · trigger | trapped · closed · trigger | n/a · closed · trigger |
| `/support` | trapped · closed · trigger | trapped · closed · trigger | n/a · closed · trigger |
| `/help` | trapped · closed · trigger | trapped · closed · trigger | n/a · closed · trigger |

**9 of 9 correct on trap, escape and return; `ringless` 0 and `nonGoldRing` 0
in all nine.** The popover's `trap=n/a` is by declaration — it is not a modal
dialog and must not trap, but it must still close on Escape and return focus,
and it does. The mobile drawer is bounded to widths below 1024 and so is
correctly absent from a 1440 run.

That closes the "not yet measured" list in FOUND-ISSUES for these three routes.

### Still open, carried forward deliberately

- **`Add Shipment` on `/suppliers`** needs a seeded supplier row before it can
  be measured. Phase 8, unchanged from 3C-i.
- **No notifications affordance below 1024px.** A product decision about what
  belongs on a phone header, not a focus bug. Phase 7, unchanged from 3C-i.
- **`nonGoldRing` under parallelism** — instrument limitation, D30.

### Phase 3 is complete

3A (Inventory, Sales, Suppliers, Customers), 3B (Reports, Staff, Activity,
Monitoring), 3C-i (overlay focus, 104 instances) and 3C-ii (Settings, Support,
Help Centre) between them cover every route in the app.

---

# PHASE 3 — CLOSED (2026-08-09, branch `ui/palette-round`)

Four batches. Every route in the app is now on one control family, one
elevation ladder, one radius scale and one button ladder, and every one of them
has been measured rather than eyeballed.

## What each batch covered

| Batch | Routes | Headline |
|---|---|---|
| 3A | Inventory, Sales, Suppliers, Customers | 8 toolbar controls that disagreed on radius, background and focus behaviour brought onto one skin (D28); `sp-lift` deliberately withheld (D27) |
| 3B | Reports, Staff, Activity, Monitoring | the last off-family control; the implicitly focusable scroll container found and named |
| 3C-i | all 9 overlay-bearing routes | overlay focus: **104 instances** on trap, escape, return, ringless |
| 3C-ii | Settings, Support, Help Centre (+ `/help/[slug]`) | the Field family, the button ladder, and three Settings defects |

## Totals measured across Phase 3

- **104 overlay instances** (3C-i) — trap, escape and return correct in 104 of
  104; `ringless` 0 in 104 of 104.
- **16 harness states** (3C-ii) — CLS 0, console errors 0, horizontal overflow
  none, focus rings `gold == tabStops`, requested-vs-landed 16/16 exact.
- **9 further overlay instances** (3C-ii) — the four global overlays against
  `/settings`, `/support` and `/help`, which FOUND-ISSUES had listed as never
  measured in their open state. 9 of 9 correct.
- Ring dimensions measured **serially throughout**, per D30.

## App defects Phase 3 found, by batch

Every one of these was green through `tsc`, `eslint` and `next build`.

| Batch | Defect |
|---|---|
| 3B | A scroll container Chrome made keyboard-focusable on its own, with no `tabindex`, so it fell outside every selector in the focus rule and painted the black UA ring — and announced nothing, being an unlabelled `div` |
| 3C-i | The AI panel was an `aria-modal` dialog with **no trap** — 14 of 14 tab stops landed on the page behind it |
| 3C-i | The mobile drawer moved focus in and let Tab walk back out onto a page hidden behind a scrim |
| 3C-i | `Modal` lost focus on close for exactly 2 of 8 route modals — the only two whose first field carries `autoFocus`. An effect-ordering bug wearing a focus-restore bug's clothes |
| 3C-ii | Settings' three labels had no `htmlFor` over inputs with no `id` — none pointed at its own control, on the one screen that is entirely a form |
| 3C-ii | The address `<textarea rows={2}>` carried `control-h`, a fixed 40px, so it rendered as a single line |
| 3C-ii | **An empty store name saved successfully** — `not null` is not `not blank`. Now logged as a *pattern* to sweep in Phase 7, not a one-off |
| 3C-ii | Both range sliders used a zinc-900 accent — near-black does not invert, so in dark mode the filled track and thumb were near-black on a near-black card |

## Harness defects Phase 3 found — and the pattern in them

**Three consecutive rounds in which something the probe flagged was the probe.**
This is the most transferable thing Phase 3 produced, so it is stated as a
count rather than left implicit:

| Round | What it flagged | What it actually was |
|---|---|---|
| 3C-i | `return=LOST` on a notification bell | It was clicking a `display:none` bell — `el.click()` fires React's handler on a hidden button quite happily, so it "opened" a 0×0 popover at 390 and walked 14 stops on the page behind |
| 3C-i | `NO TRIGGER` for Change Password, four runs running | The overlay was declared by the modal's *title*; the button reads "Update" |
| 3C-i | `return=LOST -> BODY` | Ambiguous by construction — a stale marker and a genuinely lost focus produce identical output (D31). Needed a second instrument holding a direct node reference |
| 3C-ii | `offenders=1` on `/settings` | `closest('.sp-e1')` matches the element *itself*, and the theme control's active segment legitimately carries an elevation class, so a button became its own card and was measured against its own padding box. The tell was the symmetry: `right +12px left +12px` is exactly its `px-3` |

Plus one that was neither app nor probe but procedure:

**The first 16-state run of 3C-ii is void and its numbers were never reported.**
`npm run build` was run while `next start` was already serving, so chunk hashes
moved under the running process — 500s and 404s on `_next/static/chunks/*.js`,
and on `/help/[slug]` the **stylesheet** failed to load. That run reported
`gold=0 nonGoldRing=22` and CLS 0.0214 on that route, which reads exactly like
a design-system regression confined to one page and was in fact a page
rendering with no CSS, painting Chrome's default black ring on every control.
Restart the server after any rebuild, before measuring.

The rule these all point at is D26's, from both sides: an instrument that
cannot tell you it is broken (the `/login` mislabel), one that cannot tell you
it is *early* (D30's ring sampling), and one measuring a build the report does
not name. **Before believing a probe's failure, ask whether a healthy system
could have produced that output.** Four times in two rounds, it could.

## Phase 3 leaves open, deliberately

- **`Add Shipment` on `/suppliers`** — unmeasurable without a seeded supplier
  row. The probe reporting `NO TRIGGER` is the probe being correct. Phase 8.
- **No notifications affordance below 1024px** — `Topbar` is `hidden lg:block`
  and the bell lives only there. A product decision about what belongs on a
  phone header, not a focus bug. Phase 7.
- **`nonGoldRing` under parallelism** — instrument limitation, D30. Run the
  ring dimension serially and it measures 0.
- **`not null` is not `not blank`** — the cross-cutting sweep, Phase 7.

See **D34** for the four things in the finished result that look like
oversights and are decisions.

---

## Phase 4 — data-driven product categories (2026-08-09, branch `ui/palette-round`)

Commit `bc0b7ac`. **Migration 0013 is written and NOT APPLIED** — see the
blocker below. The app is built to run either side of it.

### The list was hardcoded in six places

Grepped before anything was claimed, because "the product form picks up new
categories without a code change" is only true if the form reads the database:

| Where | What |
|---|---|
| `types/index.ts:3` | the five-value `Category` union |
| `types/index.ts:72` | `CATEGORY_LABELS` |
| `lib/validation/product.ts:3` | `CATEGORIES` |
| `ProductModal.tsx:15` | a **second** `CATEGORIES`, duplicating the one above |
| `InventoryClient.tsx:24` | `CATEGORY_FILTERS`, labels re-typed by hand |
| `schema.sql:48` | the CHECK constraint |

Plus eight read sites of `CATEGORY_LABELS`. All six copies are gone; the only
list left in the codebase is `DEFAULT_CATEGORIES` in `lib/categories.ts`, which
exists solely as the pre-migration fallback (D37) and is unreachable once 0013
has run.

### What landed

- **`0013_categories.sql`** — table, composite restrict FK, backfill, RLS
  mirroring `can_manage()`, `check (length(trim(name)) > 0)`, and a down path
  with a guard that aborts rather than half-reversing. See D35.
- **`/settings/categories`** — list, add, rename, reorder, delete; guarded by
  `canManage`, signpost card on `/settings`. See D36.
- **Four Server Actions.** Every update and delete asks for its rows back with
  `.select('id')` per D24 — including the reorder, which is a loop of updates.
  Delete counts products server-side first and refuses with a sentence naming
  the number; the restrict FK is the belt to that braces.
- **Reorder renumbers 1..n rather than swapping two `sort_order` values.**
  A swap is a no-op whenever the two values are equal, and they can be: the
  column defaults to 0, 0013's defensive backfill writes 99, and the secondary
  sort is by name. A write that changes nothing and reports success is the
  failure shape this project keeps finding.
- **`lib/validation/category.ts`** — trims, rejects blank, rejects a name that
  slugs to nothing ("!!!"), and catches duplicates by name *and* by slug,
  because "Dairy & Eggs" and "Dairy Eggs" slug identically.

### Measured

`tsc --noEmit`, `eslint` and `next build` all green; `/settings/categories`
present in the route table.

**Role test, by flipping `ROLE` in `harness-auth.js`** — staff redirect,
manager and owner render, tracking `/customers` and diverging from `/settings`
and `/audit`. The first run of this reported staff getting 200 on the
owner-only `/settings`, which was the probe: it matched the `<title>`, not the
page body. Next returns HTTP 200 with a `NEXT_REDIRECT` payload for a Server
Component `redirect()`, so status code alone cannot tell a rendered page from
a refused one. Fourth round running in which something a probe flagged was the
probe. Role restored to `owner`; `scope-check.js` re-run per D25 and unchanged
from the 2026-08-08 baseline.

**16 harness measurements**, serial per D30 — `/settings`,
`/settings/categories`, `/inventory`, `/dashboard` × light/dark × 390/1440:

| Dimension | Result |
|---|---|
| CLS | 0 in 14 of 16; **0.0006** on `/dashboard` at 1440, both themes |
| Console errors | 0 in all 16 |
| Card-overflow offenders | 0 in all 16 |
| Horizontal page overflow | none at 390 or 1440 |
| Focus rings | `gold == tabStops` in all 16, `nonGoldRing` 0, `ringless` 0 |
| Network failures | 0 real; every one an `ERR_ABORTED` `?_rsc=` prefetch |
| Requested vs landed | 16/16 exact |

The 0.0006 is 1.2% of the 0.05 budget and is reported rather than rounded
away. It was 0 in the Phase 2 dashboard runs. **Not isolated** — the store has
zero products, so the low-stock table this change touches never renders, which
makes it unlikely to be Phase 4's doing.

### Blocked on the owner — migration 0013

There is no DDL path from here: no `psql`, no `pg`/`postgres` driver in the
project, no Management API token, and the service-role key reaches PostgREST,
which is the data plane. `categories` currently returns PGRST205. Same as 0011
and 0012 — it needs the Supabase SQL editor.

**Until it is applied, these are untested:**

- the RLS policies themselves (the `can_manage()` half of D36's pairing). What
  was measured is the app-layer guard; the database-layer mirror is unexercised.
- the functional pass: create three, rename one, reorder, assign a product,
  and confirm the delete refusal is readable. All four actions currently return
  "Categories are not set up on this database yet".

### Migration 0013 applied — 2026-08-09, and everything it blocked now measured

The owner applied it in the SQL editor. `category_count = 20`, `product_fks = 2`,
`old_check_remaining = 0`, all four policies present.

**20 is 4 stores x 5 defaults, which is exactly right.** Checked per store
before anything else, because a backfill that ran twice would also produce a
number larger than expected:

| Store | Categories | Dup slug | Dup name |
|---|---|---|---|
| Neighborhood Market | 5 | 0 | 0 |
| corner grocer | 5 | 0 | 0 |
| sital | 5 | 0 | 0 |
| sandal local store (harness) | 5 | 0 | 0 |

The backfill's second, defensive pass inserted nothing — correct, since the old
CHECK guaranteed every product already used one of the five.

#### Functional pass — 28 assertions, 28 passed

Driven through the **real Server Actions** over HTTP with a live session
(`cat-actions.js` / `cat-functional.js`), with every assertion checked against
PostgREST read using the service role rather than against what the action
returned. An action reporting success and a database that changed are two
different claims.

The four action ids are unlabelled in `server-reference-manifest.json`, so they
were identified **by behaviour** against a disposable row rather than guessed —
a wrong guess would have deleted a real category.

| Step | Result |
|---|---|
| Create three | `Frozen Foods` / `Bakery` / `Pet Supplies`, appended to the end, not inserted mid-list |
| Validation, server-side | blank · whitespace-only · duplicate · duplicate-different-case · punctuation-only · 41 chars — all six refused with the right message, zero rows created |
| Rename | name changed, **slug unchanged**, sort_order untouched |
| Reorder | moved up one place; sort_order renumbered `1..8` with no ties; moving the first row up is a no-op, not an error |
| Assign a product | inserted into a shop-created category, HTTP 201 |
| FK negative | unknown category refused `HTTP 409 · 23503` |
| **Delete with products** | refused, HTTP 200 `ok:false`, row still in the database, message: *"1 product still use this category. Move it to another category first, then delete this one."* |
| Delete empty | removed |
| Cleanup | back to the 5 seeded categories, 0 test products left |

#### RLS — the database half of the pairing, which the app-layer test could not reach

Asked directly with the anon key and a real user session, so the Server Action
is not in the path at all:

| | staff | manager | owner |
|---|---|---|---|
| SELECT | 200 · 5 rows | 200 · 5 rows | 200 · 5 rows |
| INSERT | **403 · 42501** | 201 | 201 |
| UPDATE | **200 · 0 rows** | 200 · 1 row | 200 · 1 row |
| DELETE | **200 · 0 rows** | 200 · 1 row | 200 · 1 row |

Staff read and cannot write — read access is deliberate, since they render
category names on `/inventory`, `/dashboard` and `/sales`. `lib/permissions.ts`
and the policies agree.

**This is D24 demonstrated rather than cited.** A refused UPDATE and a refused
DELETE are both **HTTP 200 with zero rows** — no error object, nothing to
branch on. That is precisely why every write in the actions asks for its rows
back with `.select('id')`.

`scope-check.js` gained `categories` in its table list: a new RLS-protected
table that is not measured means the blast radius silently stops covering the
schema. Re-run as owner — `categories 20 total, 5 visible, 0 outside own store`.

#### The manager's route through the product form

Driven in a real browser as a **manager**, not inferred:

```
/inventory landed on: /inventory     react hydrated: true
Add Product: clicked "Add Product"
link: href="/settings/categories" visible=true
      categoryOptions=[Produce, Dairy & Eggs, Packaged Goods, Beverages, Household]
after click: path=/settings/categories  h1="Product Categories"
             addCard=true  migrationWarning=false
```

No bounce to `/dashboard`. The dropdown options came from the database and the
migration banner is absent, which is the data-driven claim confirmed at the
form itself rather than at the layer above it.

The first run of this reported the modal never opening. That was the probe:
React had not hydrated, so a CDP click landed on a button with no handler
attached. Fifth consecutive round in which something a probe flagged was the
probe — logged in FOUND-ISSUES, along with the fact that the CDP harness *does*
hydrate React, contradicting an older note that said this environment never
does.

#### Still open

- **CLS 0.0006 on `/dashboard` at 1440**, both themes, versus 0 at the Phase 2
  baseline. 1.2% of budget, not isolated, logged for Phase 7's performance
  sweep rather than left to become the new baseline.
- `0009_product_images_bucket.sql` remains unapplied — unrelated to Phase 4.

#### `/settings/categories` re-measured post-migration

The Phase 4 harness pass measured this route in its **fallback** state — the
warning banner up, every control disabled — because 0013 had not been applied
yet. That page no longer exists, so the numbers were re-taken against the real
one, serially, both themes, 390 and 1440:

| | 390 light | 1440 light | 390 dark | 1440 dark |
|---|---|---|---|---|
| CLS | 0 | 0 | 0 | 0 |
| console errors | 0 | 0 | 0 | 0 |
| overflow offenders | 0 | 0 | 0 | 0 |
| tabStops = gold | 22 = 22 | 22 = 22 | 22 = 22 | 22 = 22 |
| nonGoldRing / ringless | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

`tabStops` rose from 20–21 to 22 in every state. That is the point: the rename,
move and delete controls are enabled now, so they are tab stops, and all of
them carry the gold ring. A measurement of the disabled page would have
reported a clean result about a screen nobody can use.

---

# PHASE 4 — CLOSED (2026-08-09, branch `ui/palette-round`)

Migration 0013 applied by the owner. Product categories are the shop's own
data: add, rename, reorder, delete, from `/settings/categories`.

**Branch policy, set by the owner 2026-08-09: do NOT merge to `main`.**
Phases 5–9 remain, and the live site stays on the current working version
until Phase 9. All Phase 4–8 work stays on `ui/palette-round`.

## The two numbers this phase turns on

### 1. Per-store category counts — 20 is 4 stores x 5 defaults

Checked before anything else, because a backfill that ran twice produces a
larger-than-expected number too, and "20 looks like a lot" and "20 is exactly
right" are indistinguishable without the breakdown.

| Store | Categories | Duplicate slugs | Duplicate names |
|---|---|---|---|
| Neighborhood Market | 5 | 0 | 0 |
| corner grocer | 5 | 0 | 0 |
| sital | 5 | 0 | 0 |
| **sandal local store** (the harness store) | **5** | **0** | **0** |
| **Total** | **20** | **0** | **0** |

Categories with no parent store: **0**. The backfill's second, defensive pass —
for in-use values the five defaults do not cover — inserted **nothing**, which
is correct: the old CHECK constraint guaranteed every product already used one
of the five.

Your store, in sort order: `1 produce · 2 dairy · 3 packaged · 4 beverages ·
5 household` — identical to the order the product form used to hardcode, so
nothing moved on the day the migration ran.

### 2. RLS — the database half of the can_manage() pairing

CLAUDE.md documents a past bug where `lib/permissions.ts` and the database
drifted. The route-guard test proved the app half only. This asks the database
directly, with the anon key and a real user session, so RLS is the only thing
deciding and the Server Action is not in the path at all. Role flipped via the
`ROLE` constant in `harness-auth.js`.

| Operation | staff | manager | owner |
|---|---|---|---|
| SELECT | 200 · 5 rows | 200 · 5 rows | 200 · 5 rows |
| INSERT | **403 · 42501** | 201 | 201 |
| UPDATE | **200 · 0 rows** | 200 · 1 row | 200 · 1 row |
| DELETE | **200 · 0 rows** | 200 · 1 row | 200 · 1 row |

Staff read and cannot write. Read access is deliberate, not an oversight: staff
render category names on `/inventory`, `/dashboard` and `/sales`, and a
narrower select policy would blank the label for them on three screens.

**This is D24 demonstrated rather than cited.** A refused UPDATE and a refused
DELETE are both **HTTP 200 with zero rows** — no error object, nothing to
branch on, indistinguishable from success. That is exactly why every update and
delete in `settings/categories/actions.ts` asks for its rows back with
`.select('id')`, including the reorder loop.

`scope-check.js` re-run as owner per D25, with `categories` added to its table
list — a new RLS-protected table it does not measure means the blast radius
silently stops covering the schema:

| table | in project | visible to harness | outside its own store |
|---|---|---|---|
| categories | 20 | **5** | **0** |

All other tables unchanged from the 2026-08-08 baseline. Role restored to
`owner`.

## 0009 was not a blocker — the doc was wrong

`0009_product_images_bucket.sql` had been listed under "Blocked on the owner"
as NOT APPLIED. Measured on 2026-08-09, it is applied and correct:

| Check | Result |
|---|---|
| bucket `product-images` exists, `public = true` | yes |
| owner uploads into its own `<store_id>/` folder | **200** |
| owner uploads into another store's folder | **403** RLS |
| staff uploads into its own store's folder | **403** RLS |

Both halves are live — the public bucket and the `can_manage()` +
`current_store_id()` write policies. **Product image upload is not broken on
the hosted project and 0009 does not need applying before or during Phase 8.**

The stale line had been copied forward into `CLAUDE.md` before it was checked.
Both are corrected, and `CLAUDE.md` now states that migration status must be
measured rather than read, with the one-line storage-API check. Logged in
FOUND-ISSUES; see D38.

## Everything else Phase 4 measured

- **28 functional assertions, 28 passed**, driven through the real Server
  Actions with every result verified against the database by service-role read.
  The delete refusal: *"1 product still use this category. Move it to another
  category first, then delete this one."* — HTTP 200 `ok:false`, row still
  present afterwards.
- **The manager's route through the product form**, driven in a real browser:
  modal opens, link visible with `href=/settings/categories`, click lands on
  the rendered page, dropdown carries the five DB categories, no migration
  banner.
- **16 harness measurements** across `/settings`, `/settings/categories`,
  `/inventory` and `/dashboard`, both themes, 390 and 1440, rings serial per
  D30 — plus `/settings/categories` re-measured after the migration, since the
  first pass had measured its disabled fallback state.
- **The six hardcoded copies of the category list are gone.** The only list
  left is `DEFAULT_CATEGORIES` in `lib/categories.ts`, the pre-migration
  fallback, now unreachable on this database.

## Phase 4 leaves open

- **CLS 0.0006 on `/dashboard` at 1440**, both themes, against 0 at the Phase 2
  baseline. 1.2% of budget, not isolated, logged S3 for Phase 7's performance
  sweep rather than allowed to become the new baseline silently.
- **`not null` is not `not blank`** — the cross-cutting sweep, still Phase 7.
  Phase 4 did not add to it: `categories.name` carries
  `check (length(trim(name)) > 0)` and is validated and trimmed on both sides.
- **Resend -> Supabase custom SMTP** — unchanged, still blocks invite delivery.

---

# PHASE 5 — in-app imagery and motion character (2026-08-09, `ui/palette-round`)

Commit `65c5a9c`. **Not merged to main** — per the branch policy, `main` stays
on the current working version until Phase 9.

## Files changed — 12

New: `components/ui/LineArt.tsx`, `components/dashboard/CrateMark.tsx`,
`components/dashboard/Crate3D.tsx`.
Edited: `app/globals.css`, `components/dashboard/Greeting.tsx`,
`components/ui/EmptyState.tsx`, `components/ui/ProductThumb.tsx`,
`components/inventory/ProductImageUpload.tsx`, and the four module clients
(`InventoryClient`, `SalesClient`, `CustomersClient`, `SuppliersClient`).

## Weight — measured before and after on the same tree

Phase 5 was stashed, rebuilt and weighed, then restored, rebuilt and weighed
again, rather than comparing against a figure quoted from an earlier phase.

| | before | after | delta |
|---|---|---|---|
| Shared JS (gz) | 169.3 KB | **169.3 KB** | **+0.0** |
| All chunks JS (gz) | 1041.6 KB | 1045.4 KB | **+3.8 KB** |
| CSS (gz) | 21.2 KB | 21.3 KB | **+0.1 KB** |
| JS files | 57 | 58 | +1 |

The +1 file is the 3D, isolated by content grep to a single chunk at **0.8 KB
gz** which is requested only after idle. Shared JS has still never moved from
169.3 KB.

## KPIs paint before the decoration loads

| | |
|---|---|
| FCP | **2496 ms** |
| `.sp-crate` first present in DOM | **3071 ms** |
| KPI text present | yes, and server-rendered — in the first paint by construction |
| JS requests, normal motion | 19 |
| JS requests, reduced motion | **18** — the 3D chunk is never requested |

## prefers-reduced-motion

| | |
|---|---|
| pulse `animationName` | `none` |
| pulse `stroke-dashoffset` | **0px** — frozen into a COMPLETE drawing, not an empty box (D18) |
| 3D crate mounted | **no** |
| static isometric crate present | **yes** |

## The 20-state harness — 5 routes x 2 themes x 2 widths, serial per D30

(The brief said 16; five routes at two themes and two widths is 20, and all 20
were run.)

| Dimension | Result |
|---|---|
| CLS | 0 in **18 of 20**; 0.0006 on `/dashboard` at 1440, both themes |
| Console errors | **0** in all 20 |
| Card-overflow offenders | **0** in all 20 |
| Horizontal page overflow | none at 390 or 1440 |
| `nonGoldRing` / `ringless` | **0 / 0** in all 20 |
| Network failures | 0 real; all `ERR_ABORTED` `?_rsc=` prefetches |

**The CLS 0.0006 is unchanged.** That was the specific risk of putting imagery
on that page, and the answer is that imagery did not move it — every new
element declares a fixed box, and the crate's two states fill the same 64px.

`/sales` at 390 reports `gold=20` against `tabStops=22` in both themes. That is
the harness's own accounting, not two missing rings — see FOUND-ISSUES.

## What was built

- **Greeting figure** — shopkeeper, counter, crate, gold pulse. The
  needs-attention signal moved from colour to tempo (1.6s / 2.8s). See D40.
- **Image slots, fallback first** — `.sp-img-slot`, a three-token gradient plus
  the photo drawing, in exactly the box a photo would occupy. Zero products in
  the project have an image, so this IS the app's resting appearance. Verified
  in the product modal at 79x79 with the gradient painting and the drawing
  present.
- **Four empty-state illustrations** — Inventory, Sales, Customers, Suppliers,
  on the "none yet" state only. Verified rendering on all four routes, which
  the empty harness store makes the default state.
- **One CSS-3D crate** on the dashboard. No WebGL, no dependency. See D39.

## Removing the 3D, if it is ever unwanted

Delete `components/dashboard/Crate3D.tsx` and `components/dashboard/CrateMark.tsx`,
and remove the import and `<CrateMark />` from `Greeting.tsx`. Nothing else
references either, and the CSS lives inside `Crate3D.tsx` so it leaves with it.

## Carried forward

- **CLS 0.0006 on `/dashboard` at 1440** — Phase 7 performance sweep, still not
  isolated.
- **`not null` is not `not blank`** — Phase 7 sweep, untouched by Phase 5.
- **Resend -> Supabase SMTP** — still blocks invite delivery.

---

# PHASE 6 — Privacy Policy and Terms (2026-08-09, `ui/palette-round`)

Commit `00a8419`. **Not merged to main** — `main` stays on the current working
version until Phase 9.

Both pages were placeholders that honestly said they were placeholders. They
are now full drafts. **They are AI-written and have not been reviewed by a
lawyer** — every page carries that warning in a banner outside the contents.

## Which email path is actually live — checked, not assumed

The brief asked me to write against whichever is real. Measured against the
live project:

| | Finding |
|---|---|
| **Resend** | Key authenticates (`GET /domains` returns 200) but **zero verified domains**, and `RESEND_FROM` is unset — so mail sends from Resend's shared `onboarding@resend.dev`, which only delivers to the Resend account owner |
| **Supabase Auth** | Still owns invite and password-reset mail. `mailer_autoconfirm: true`, so signup confirmation mail is not sent at all |

Resend is live for support notifications and is named as a sub-processor;
Supabase is named for auth mail. Both operational consequences are logged as
S1/S2 in FOUND-ISSUES rather than smoothed over in the policy.

## A fourth sub-processor the brief did not list

`app/api/ai/chat/route.ts` streams to Google's `gemini-flash-latest`, and
`lib/gemini/tools.ts` lets it return product names and stock levels, sales and
revenue summaries, and staff names. **Store trading figures and staff names
leave the system to Google whenever the assistant is used**, and nothing said
so. Now disclosed with what it receives, and with the plain note that the
assistant is optional. See D42.

## What the documents contain

**Privacy Policy** — 13 sections: who we are; the controller/processor split
and why it decides who you contact; what is collected and why; legal basis;
sub-processors named individually; where data lives; retention; your rights and
which you can exercise yourself; security; breach notification; cookies and
browser storage; children's data; how changes are announced.

**Terms** — 13 sections: parties; what the service is and is not; accounts;
staff roles and owner responsibility; acceptable use; data ownership;
availability with no uptime guarantee; fees; suspension and termination;
disclaimers; limitation of liability; changes; governing law.

**50 TODO placeholders** (24 privacy, 26 terms), each rendered as a marked
TODO. Legal entity, registered address, contact email, governing jurisdiction
and effective date are blank on purpose. Fees is blank too — nothing in the
software takes a payment, so inventing a price would have been the same error.

## Tested

**22 structural assertions, 22 passed**, across both routes: HTTP 200; exactly
one h1; 14 h2s; no h3 before the first h2; **every anchor resolves to a real
id** (14 + 13); every section appears in the contents; TODOs present; draft
banner present; last-updated present; both footer links resolve (2 links each
on the landing page).

**8 harness states**, serial per D30 — `/privacy` and `/terms` across light and
dark at 390 and 1440. (8 is right: 2 routes x 2 themes x 2 widths.)

| Dimension | Result |
|---|---|
| CLS | **0** in all 8 |
| Console errors | **0** in all 8 |
| Horizontal page overflow | none at 390 or 1440 |
| Focus rings | `gold == tabStops` 21/21 in all 8, `nonGoldRing` 0, `ringless` 0 |
| Network failures | 2-4 per run, all `ERR_ABORTED` `?_rsc=` prefetches |

One honest caveat: `controls=0` on both routes, because the card-overflow probe
looks for controls inside `.sp-e1` cards and these prose pages have none. So
`offenders=0` there is trivially true; the meaningful overflow signal is
`pageOverflowX=false`, which is real.

The server was confirmed to be the one started, per last phase's lesson: port
3100 was freed first, the log checked for `Ready` and for the absence of
`EADDRINUSE`, and both routes asserted on a string that exists only in this
build.

Warning-token contrast checked in both themes rather than assumed — light
`#8a5a06` on `#f7e7c6`, dark `#d9a13c` on `#322210` — and all four new classes
verified present in the built CSS by the D9 recipe.

## Carried forward

- **Email verification is off** (S1) and **support confirmations cannot reach a
  real submitter** (S2). Both are dashboard/config fixes, and both matter more
  now that the policy promises to email owners.
- **CLS 0.0006 on `/dashboard` at 1440** — Phase 7 performance sweep.
- **`not null` is not `not blank`** — Phase 7 sweep.

---

# PHASE 7A — verification and hardening (2026-08-09, `ui/palette-round`)

Commit `36e6ea3`. **Not merged to main.** 7B still to come.

## 1. Resend — what you need to do, and what changed in code

**Your part, in the Resend dashboard:**

1. Domains -> Add Domain, enter the domain you will send from.
2. Add the DNS records Resend shows you (an MX and two TXT for SPF/DKIM, plus
   an optional DMARC TXT) at your DNS provider. Verification is usually minutes.
3. Wait for the domain to show **Verified**. `GET /domains` currently returns
   an empty list, which is the state this is fixing.

**Your part, in env** — set in Vercel (Project -> Settings -> Environment
Variables, Production + Preview) and in `stockpulse/.env.local` for local runs:

    RESEND_FROM="StockPulse <support@yourdomain.com>"

The address must be on the verified domain. Optionally set
`SUPPORT_CONFIRMATION_EMAILS=1` afterwards to turn on submitter confirmations —
deliberately still a separate switch, because that is the one place the app
emails a member of the public.

**My part, done:** `sendEmail` no longer falls back to
`onboarding@resend.dev`. It returns `not-configured` and writes the reason to
`console.error`, naming the variable. The support request still saves; only the
notification declines. A misconfiguration that returns success is worse than
one that fails.

## 2. Email verification — what to change, and what it breaks

**The setting:** Supabase Dashboard -> Authentication -> Sign In / Providers ->
Email -> **Confirm email**. Turning it ON sets `mailer_autoconfirm` to false.
(`GET /auth/v1/settings` on the project currently returns
`"mailer_autoconfirm": true`, which is how this was found.)

**Do the SMTP first.** With Supabase's built-in SMTP you get a handful of
messages per hour and Supabase documents it as testing-only. Turning on
confirmation before custom SMTP is configured means new signups get throttled
into an opaque 429 and cannot confirm at all. Project Settings -> Authentication
-> SMTP Settings, pointed at Resend, using the same verified domain as above —
this is D8's plan, still unexecuted.

**What breaks, honestly:**

| Flow | Effect |
|---|---|
| Signup | `signUpOwner` currently redirects straight to `/dashboard` after `signUp`. With confirmation on, the session is not established until the link is clicked, so that redirect lands on a page that bounces to `/login`. **This needs a code change** — a "check your email" screen. Tell me when you have flipped it and I will do it. |
| Invites | Unaffected. `inviteUserByEmail` already sends a real email and the invitee already sets a password via `/reset-password`. |
| Password reset | Unaffected. |
| The harness | `harness-auth.js` creates its user through the Admin API with `email_confirm: true`, so it keeps working. |

I have not touched your auth config.

## 3. `not null` != `not blank` — the full sweep

36 not-null text columns enumerated across `schema.sql`, `schema_phase2/3/4.sql`
and `migrations/0001`–`0013`.

| Group | Count | Verdict |
|---|---|---|
| CHECK-constrained enums — `''` cannot be stored | 9 | **PASS** structurally |
| Written from a validator that trims and rejects blank | 14 | **PASS** |
| Nothing user-supplied reaches them (copied, templated, or literal) | 9 | **PASS** |
| **Unvalidated writers** | **4** | **FAIL — fixed** |

The four failures:

| Writer | Column(s) | Was |
|---|---|---|
| `signUpOwner` | `stores.name`, `profiles.full_name` | untrimmed, no blank check |
| `inviteStaff` | `profiles.full_name` | untrimmed, no blank check, admin client so RLS catches nothing |
| `EditProfileModal` | `profiles.full_name` | untrimmed, no blank check |

**`stores.name` had been fixed at the wrong end.** Phase 3C-ii fixed Settings,
which *edits* the name. `signUpOwner` *creates* it and was never examined — so
the app could still produce a nameless shop, just only once per shop.

Also fixed in passing: `EditProfileModal`'s three fields were hand-rolled
label+input pairs with no `htmlFor` over inputs with no `id` — the same defect
3C-ii found on Settings. Now `Field`/`Input`, which supplies the error slot the
name check needed.

## 4. Notifications below 1024px — fixed

`MobileHeader` now carries `NotificationBell`, seeded from the same server-side
unread count as `Topbar`, so the two headers cannot disagree about the badge.
Verified present in the served HTML at 390.

## 5. CLS — isolated, and it was worse than reported

`cls-probe.js` reads `entry.sources` instead of a total, with the observer
installed before document start. See D43.

**`/dashboard` at 390 measured CLS 0.21 — four times budget — where the harness
had reported 0 since Phase 2.** The greeting server-renders "Welcome back" and
corrects to "Good afternoon" at hydration; at 390 that wrapped the `<h1>` to a
second line and moved the stat tiles, the date row, "Quick Actions" and the
quick-action grid down 31px each.

Fixed by putting the name on its own line below `sm` (D44). Re-measured:

| | before | after |
|---|---|---|
| `/dashboard` 390 | **0.21** (harness said 0) | **0**, zero shift entries |
| `/dashboard` 1440 | 0.0006 | 0.0006, unchanged |

The 1440 residual is the greeting's text rect widening and the "Updated just
now" pill narrowing. Neither moves anything below it, which is why it is three
orders of magnitude smaller. 1.2% of budget, understood, documented, not
chased.

## Verification

`tsc`, `eslint` and `next build` green. Server confirmed as the one started:
port 3100 freed first, log checked for `Ready` and zero `EADDRINUSE`, and the
build asserted by a string only it contains (`block sm:inline`).

Harness after the changes — `/dashboard` and `/profile`, both themes, 390 and
1440: CLS 0 except the documented 1440 residual, console errors 0, overflow
offenders 0, no horizontal overflow, `gold == tabStops`, `nonGoldRing` 0,
`ringless` 0.

## Waiting on you before 7B

- Verify a Resend domain and set `RESEND_FROM`.
- Configure custom SMTP, then decide on **Confirm email** — and tell me, so I
  can add the "check your email" screen signup will need.

---

# PHASE 7B - measurement and cross-browser (2026-08-09, ui/palette-round)

Commit 9f7b1c0. Not merged to main.

## Blockers for Phase 9 handover - owner config, both waiting on a domain

**1. Resend - no verified sending domain.** Until one exists, support
confirmation replies NEVER reach the person who submitted the request; only
the operator notification works. sendEmail now refuses rather than sending from
the shared onboarding@resend.dev, so the failure is loud in the server log
instead of silent.
Needed: Resend -> Domains -> Add Domain; add the MX + SPF/DKIM TXT records;
wait for Verified; then set RESEND_FROM="StockPulse <you@yourdomain.com>" in
Vercel (Production + Preview) and .env.local. Optionally
SUPPORT_CONFIRMATION_EMAILS=1 afterwards.

**2. Supabase - email addresses are never verified** (mailer_autoconfirm true).
The privacy policy promises breach notification by email, and that promise is
only as good as the address. Needed in order: custom SMTP (Project Settings ->
Authentication -> SMTP Settings, pointed at Resend on the verified domain),
THEN Authentication -> Sign In / Providers -> Email -> Confirm email. Turning
confirmation on first throttles signups into an opaque 429. Signup will then
need a "check your email" screen - signUpOwner currently redirects to
/dashboard before a session exists. Invites and resets are unaffected.

## Lighthouse - authenticated routes

Desktop, three runs on /dashboard for variance: perf 96 / 92 / 94, LCP
1222 / 1314 / 1258 ms, CLS 0.0000. Steady, so these are measurements.

| Route | desktop perf | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| /dashboard | 97 | 464 | 1177 | 31 | 0.0000 |
| /inventory | 87 | 705 | 1463 | 155 | 0.0000 |
| /reports | 97 | 449 | 1133 | 40 | 0.0000 |
| /settings | 94 | 489 | 1407 | 40 | 0.0000 |

Mobile is NOT reproducible on this machine - perf 0 / 30 / 33 on the same
build, LCP 20838 / 13964 / 13925. Reported as indicative only; no before/after
claim drawn from it (D46). Indicative mobile: perf 36-62, LCP 2384-8187 ms,
TBT 1426-2169 ms, dominated by 2-3s of script evaluation under 4x CPU
throttling. No polyfill chunk is requested at all, so the long-standing
polyfill note earlier in this file is stale.

**Lighthouse vs the harness.** They measure different things rather than
disagreeing. The harness runs unthrottled on localhost and reports specific
facts; Lighthouse desktop agrees with it - both say CLS 0. The apparent
mobile gap is throttling plus machine contention. For regression work I trust
the harness and the direct probes, because "which element is the LCP" and
"which node moved" are facts a slow machine cannot distort.

## The dashboard LCP, isolated

vitals-probe.js reads entry.element, not a total. At 390 with 4x CPU the LCP
element was H1.sp-title - "Good evening, Harness" - at 5440ms: the greeting
arriving as a fresh LCP candidate AFTER hydration rewrote it.

Fixed by computing the greeting server-side from STORE_TIMEZONE
(storeGreeting()), the clock every other date in the app already uses. Verified
structurally: "Welcome back" absent from the served HTML, H1.sp-title no longer
among the LCP candidates.

## Accessibility - axe-core 4.12.1, 17 routes + 4 overlays

Injected from node_modules; no CDN, no new dependency. Overlays driven open
with 3C-i's traversal.

| Rule | before | after |
|---|---|---|
| aria-prohibited-attr | 19 | **0** |
| region | 19 | **0** |
| heading-order | 2 | **0** |
| label (critical) | 1 | **0** |
| color-contrast | 46 | **12** |
| total nodes | 87 | **12** |

The first two were one element: the toast container had aria-label on a
roleless div, so the name was ignored AND its content sat outside every
landmark. role="region" fixed both on all 17 routes - 38 of 87 findings from
one missing attribute.

Of the 46 contrast findings, 34 were the harness (reused Chrome profile
carrying stale localStorage; D45). The remaining 12 are REAL, reproduce in
Chrome and Edge, and are NOT FIXED: text-muted on the inverted bg-foreground
stat tiles, 3.13:1 against 4.5 required. Fix recipe in FOUND-ISSUES.

Focus traps, keyboard traversal and focus restore were measured in 3C-i (104
overlay instances) and re-confirmed here by every overlay opening, auditing and
closing cleanly.

## Cross-browser

| | tested | result |
|---|---|---|
| Chrome headless | yes | harness clean at 390 and 1440; axe as above |
| Edge headless | yes | IDENTICAL - CLS 0, console 0, no overflow, gold == tabStops, nonGoldRing 0, ringless 0; reproduces the same 1 contrast rule |
| Mobile widths 390 | yes | both engines, no horizontal overflow |
| Safari / iOS | NO | not installed, not installable on Windows. No Safari claim is made. WebKit behaviour for :focus-visible, lh units and preserve-3d is unverified. |
| Firefox | no | not attempted |

## Voice input - owner test steps

Open the AI assistant -> click the microphone, labelled "Ask by voice" -> allow
the permission prompt -> speak -> transcript fills live -> button becomes "Stop
recording". Chrome and Edge ask once per origin and remember; on the https
preview URL the prompt appears normally.

Every failure shows a VISIBLE message (rendered at VoiceInput.tsx:294, not
swallowed):

| Situation | Expected |
|---|---|
| Permission denied or dismissed | "Microphone access is blocked..." naming how to re-enable in site settings |
| Insecure origin (plain http) | "Voice input needs a secure connection..." - checked BEFORE asking, because the browser reports it as not-allowed, indistinguishable from a denial |
| No SpeechRecognition (Firefox, most Safari) | control renders as unsupported rather than failing on click |
| Nothing heard | "Didn't catch that - try again, a little closer to the microphone." |
| Service disabled | "Speech recognition is turned off in this browser's settings." |

Confirmed by reading the code, NOT by speaking into it. Headless Chrome has no
microphone and Chrome's SpeechRecognition sends audio to a Google service, so
nothing here could be faked into proving it works.

## Human-confirmed, 2026-08-09 (owner, on real hardware)

Two items move out of "unverified", partly. Recorded precisely, because the
difference between what was confirmed and what was not is the whole value.

**Voice input - the visible failure state is CONFIRMED.** The owner opened the
assistant in a real browser and exercised the microphone-permission failure.
It named the site, explained that permission is per-site, and said how to
re-enable it - matching what VoiceInput.tsx:294 was written to do. This is the
first human confirmation of that path; every previous statement about it came
from reading the code.

**Speech-to-text accuracy remains UNVERIFIED.** Nobody has confirmed that
spoken words are transcribed correctly, or that the transcript reaches the
assistant intact. What is proven is that the feature fails visibly rather than
silently. Do not upgrade this to "voice input works".

**Real phone - the gap is PARTLY closed.** The owner loaded the Vercel preview
on an actual phone at real mobile width and it renders fine. That retires
"nothing has ever been opened on a real device", which had been the largest
honest gap in the handover.

Still not closed by it: Safari/iOS specifically (the device browser was not
recorded), real-device performance numbers, and interaction testing on touch.
"Renders fine on a real phone" is a strong signal and is not a measurement.

---

# PHASE 8 - NOT STARTED (handover note, 2026-08-09)

Phase 8 was briefed and deliberately not begun: the session ran low on context
and the first deliverable writes real rows into the owner's live store. A seed
script abandoned halfway is worse than no seed script, so nothing was started.

## What Phase 8 asks for

1. **First-run onboarding** on an empty store - add your first supplier, first
   product, first sale. Dismissible, never blocking, and it must not reappear
   once the store has data.
2. **A separate, reversible Indian grocery seed** - ~40 products across
   categories, 5 suppliers, 3 staff, 30 days of sales. Acceptance testing only,
   NOT the client's live data. Teardown equally safe and scoped to one
   store_id. Kept well away from
   supabase/dev-only/seed_demo.DO-NOT-RUN-AGAINST-PRODUCTION.sql.
3. **Full owner journey at real volume** - add product, receive stock, log
   sale, low-stock alert, every report, export, invite staff, assign shift,
   approve leave, raise a support request. Report anything slow or badly
   readable; empty states have been hiding a lot.
4. **Teardown**, then confirm clean empty states and no orphaned rows.

Walkthrough as owner, manager and staff via the ROLE flip in harness-auth.js;
re-run scope-check.js per D25.

## Constraints that must carry into it

- **Seed and teardown must be scoped to the harness store_id and nothing else.**
  scope-check.js already proves that account reaches exactly one store of four;
  the seed must take the same care. `sandal local store`
  (e47fe6eb-8825-4612-965f-cb61b9be3864) is the harness store.
- The categories table now exists (0013), so seeded products must reference
  real category slugs per store - `products_category_fkey` is composite and
  will refuse anything else.
- Seeding suppliers finally unblocks **Add Shipment on /suppliers**, which
  3C-i logged as unmeasurable without a supplier row - the probe reporting
  NO TRIGGER was the probe being correct.
- D23 stands: a setup action creates the thing empty; only a clearly-labelled
  seed may invent trade. This IS that clearly-labelled seed, and it must stay
  labelled.

## Known-open items it should pick up alongside

- 12 color-contrast nodes, confirmed real, unfixed - text-muted on
  bg-foreground tiles, 3.13:1. Recipe in FOUND-ISSUES.
- overlay-probe.js does not yet cover the mobile notification bell
  (minWidth 1024 bound, and there are now two bells in the DOM).
- EditProfileModal writes profiles straight from the browser, so its
  trim/reject check is the only one.

---

# PHASE 9 — final, reduced scope (2026-08-09)

Scope was cut deliberately: this build goes to a recruiter, not a paying
client. Four items were dropped by name rather than quietly skipped —
**Supabase backup procedures, rate-limiting hardening, auth edge-case testing,
and HANDOVER.md**. None of them was attempted. None should be assumed.

## Done

**Seed data is KEPT, not torn down.** 41 products (40 seeded + 1 from the
owner journey), 5 suppliers, 3 staff, 379 sales over 30 days, 14 shifts, 1
shipment. The teardown script exists, dry-runs by default and has never been
run. An empty dashboard shows a reviewer nothing; this shows the app working.

Per D23 the data stays labelled: every seeded product carries an `ACC-` SKU,
visible in the UI and in every export, and `scripts/acceptance/README.md` says
in its first line that the folder writes real rows. Staff are
`@stockpulse.test` addresses, which RFC 2606 guarantees can never receive mail.

**Error boundaries** exist at three levels — `app/global-error.tsx`,
`app/error.tsx`, `app/(dashboard)/error.tsx` — which between them cover every
route, since Next resolves the nearest boundary up the tree. Verified by
deliberately throwing from `/customers`: the page rendered "Something went
wrong" with the error text, a Try again button and the sidebar still intact,
rather than a white screen. The throw was then reverted.

**Secrets audit, measured against the built bundle rather than the source.**
Grepping source for `SUPABASE_SERVICE_ROLE_KEY` only proves where the *name*
appears; what matters is whether the *value* reaches a file a browser
downloads. All five non-public values were searched for across 91 emitted
client assets:

| variable | in `.next/static` |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | ABSENT |
| `GEMINI_API_KEY` | ABSENT |
| `RESEND_API_KEY` | ABSENT |
| `SUPPORT_NOTIFY_EMAIL` | ABSENT |
| `VERCEL_OIDC_TOKEN` | ABSENT |

`git ls-files` shows only `.env.example` tracked. The three `NEXT_PUBLIC_`
variables are safe to be public by design: the Supabase URL and anon key are
meant to be shipped and are useless without RLS being wrong, and the site URL
is the public address.

**One hardening NOT done, and worth doing:** `lib/supabase/admin.ts` has no
`import 'server-only'` guard, so nothing but discipline stops a future edit
importing it into a Client Component and inlining the service key. The
`server-only` package is not installed and adding it is a new dependency, so it
was left out and recorded here instead.

**Demo account** — `demo@stockpulse.test`, owner of the seeded store, created
by `scripts/acceptance/ensure-demo-user.cjs` which resets the published
password on every run so the README, the login screen and the database cannot
drift apart. Owner was chosen because a lesser role hides half the product from
someone who only visits once; the cost is that the credentials are public and
that store's data is editable by anyone. Verified end to end from a browser
with cookies cleared: `/login` -> one click -> `/dashboard`, greeting
"Good afternoon, Demo", seed data rendering, 0 console messages.

**Root README** replaced. It was not missing — it was the Google AI Studio
boilerplate describing the frozen Vite prototype, which is arguably worse than
nothing for a reviewer.

## NOT VERIFIED — the honest list

Nothing below has been confirmed. Several are impossible on this machine; the
rest ran out of scope. They are listed so that no reader has to infer them.

| | Status |
|---|---|
| Safari / iOS | **Never tested.** Not installed and not installable on Windows. No claim is made about WebKit's `:focus-visible`, `lh` units or `preserve-3d`. |
| Real-device performance | **Never measured.** The owner confirmed the preview renders on a real phone; that is a signal, not a measurement. |
| Email delivery end to end | **Never confirmed.** Configuration is loud on failure; no mail has been observed arriving. |
| First-run onboarding | **Not built.** Needs an empty store, and this store is deliberately seeded. |
| Role walkthrough (owner/manager/staff) | **Not re-run** this phase. |
| `scope-check.js` re-run per D25 | **Not re-run** this phase. The last run was before the seed. |
| 12 colour-contrast nodes | **Open.** `text-muted` on inverted `bg-foreground` tiles, 3.13:1 against 4.5 required. Recipe in FOUND-ISSUES.md. |
| `EditProfileModal` | **Open.** Writes profiles straight from the browser, so its trim/reject check is the only one. |
| `palette via drawer` focus return | **Open, measured.** `return=LOST -> BODY`: the palette remembers the search row, which lives in a drawer that unmounts, so `.focus()` hits a detached node. |
| Journey steps not exercised | Export files actually downloading; invite staff; assign shift through the UI; approve leave; raise a support request. |
| Supabase backups, rate limiting, auth edge cases, HANDOVER.md | **Out of scope by decision**, not attempted. |

---

# LANDING HERO — real 3D products, and a correction to the record (2026-08-10)

## The correction, first

**Phase 5's "no WebGL, nothing installed" was about `CrateMark` on the
dashboard. It was never true of the landing hero.**

`components/marketing/ThreeGroceryVisual.tsx` is a `THREE.WebGLRenderer`
scene and `"three": "^0.185.1"` is a real dependency. Anyone reading D39 today
would conclude this app ships no WebGL, and that is wrong. D49 records the
correction; D50 records what was done about the gap it hid.

The landing page also uses CSS `preserve-3d` in nine OTHER components — the
card tilts on features, pricing, FAQ, testimonials and so on — which is why
the hero looks like part of the same CSS system. It is not.

## Products are now real geometry

The panels were flat: a thin box whose front face carried a canvas drawing.
They read as cutout paper, and the giveaway was that they stayed card-thin as
the scene rotated. Each product is now built from actual geometry with real
side and top faces, sitting ON the deck, in the same shadow pass and the same
group, so it turns with the scene:

| Product | Built from |
|---|---|
| Bottle x2 | cylinder body, tapered shoulder, narrow neck, wider brass cap, cream label band |
| Jar x2 | squat body, tapered shoulder, wide brass screw lid |
| Produce crate x2 | four walls and a base, open top, with tomatoes / onions / carrots / leaf blades standing proud of the rim |
| Carton x2 | box plus two slanted roof panels and a ridge — the gable is what makes it read as milk |
| Sack | tapered 9-sided body, gathered neck, brass tie, cardboard band |

Palette only, flat standard PBR, no textures, no images, nothing fetched.

## Weight

| | |
|---|---|
| three.js chunk | 548,102 bytes raw, **135,992 gz (133 KB)** |
| In the landing page's initial HTML | **No** — `grep -c` on the served document returns 0 |
| Fetched | only after `requestIdleCallback`, only on a machine that opted in |
| Total emitted JS | 4,097,861 -> 4,105,578 bytes (+7,717) for the product geometry and the static SVG |

The +7.7 KB is the honest total-bundle number. The number that matters to a
visitor is the other one: 133 KB gz left the critical path entirely, and a
reduced-motion or Data Saver visitor never downloads it at all.

## Gate verified with a control

Same production build, twice, differing only in the emulated media feature:

    normal   early{svg:true shelfCanvas:false} late{svg:false shelfCanvas:true} CLS=0 threeChunkFetched=true
    reduced  early{svg:true shelfCanvas:false} late{svg:true  shelfCanvas:false} CLS=0 threeChunkFetched=false

**CLS 0 in both.** An earlier reading of 0.0939 came from the dev server's HMR
and on-demand chunk compilation and does not exist in the production build —
worth recording because it looked exactly like a regression this work had
introduced.

Two probe artefacts, both mine, both caught before they became conclusions:
a canvas check that matched the shader-background canvas rather than the
shelf's, and an 11-second wait against a dev server that needed ~16 seconds to
compile the lazy chunk on demand. Neither was an app fault.

---

# BARCODE — Phase 1 of 4: data model and manual entry (2026-08-17)

Branch `hero/photo-shelf`. **Not merged.** Scope was data and manual entry
only: no camera, no scanning UI, no Inventory or Sales wiring.

## Migration 0014 — and it is 0014, checked rather than assumed

`ls supabase/migrations/` stops at `0013_categories.sql`, so `0014` is genuinely
next. `grep -rn "barcode" supabase/` returned nothing beforehand — no schema
file, migration or `fix_*.sql` had already added the column.

`0014_product_barcode.sql` adds three things and no RLS policy.

### It is `unique (store_id, barcode)`, NOT `unique (barcode)`

The brief said a unique index on `barcode`. A global one is wrong here and the
failure is not subtle: **EAN/UPC codes identify a product, not a
product-in-a-shop.** Two grocers both stocking Amul Whole Milk 1L scan the same
thirteen digits. Under a global index, whichever store typed it first would
permanently stop every other store on the platform from recording that product
— and the second shopkeeper would be told their barcode is "already used by" a
product they cannot see, in a shop they do not know exists.

Carrying `store_id` into the key is D35's reasoning reused: the same shape that
makes `products_category_fkey` composite, so one tenant's row cannot collide
with another's by construction rather than by remembering `.eq('store_id')`.

It is also what the later phases need. A scan resolves *within the current
store*, so the index enforcing uniqueness is the same index serving the lookup.
A global index could not serve that query.

Reversing it is one line and it is written in the migration. Do not, without
first deciding what a second shop stocking the same product should do.

### The index is PARTIAL, so "multiple NULLs allowed" is true by construction

The brief said to confirm rather than assume that multiple NULLs are permitted.
Confirmed, and then made independent of the answer.

Postgres unique indexes do permit multiple NULLs — two NULLs are never equal.
But **since PG15 that is a default, not a guarantee**: `NULLS NOT DISTINCT`
inverts it. `where barcode is not null` removes the question entirely — rows
with no barcode are not in the index at all, so no NULLS-handling setting can
make them collide. It also keeps the index to the rows that can conflict.

`toProductPayload` writes `null`, never `''`, for the same reason: under a
partial index a stored empty string is a *real value* competing for
uniqueness, so the second product saved without a barcode would collide with
the first.

### A CHECK as well as a validator, deliberately

`barcode ~ '^[0-9]{8,14}$'` in the database, the identical regex in
`lib/validation/product.ts`. 8-14 covers EAN-8, UPC-E expanded, UPC-A (12),
EAN-13 (13) and ITF-14 (14). Digits only, because a stray space or the
apostrophe Excel prepends to long numerics is the difference between a scan
matching and silently not matching — and the second failure looks like broken
hardware. The validator gives a readable message; the constraint makes the bad
row impossible. CLAUDE.md already records what happens when those two drift.

## THE MEASUREMENT THAT MATTERS: staff can write to products. They always could.

The brief asked me to confirm a staff barcode write "still returns the existing
zero-rows-affected behavior". **It does not, and it never did.** Measured with
the anon key and a real staff session so RLS is the only thing deciding, with
manager and owner as controls in the same run (D38 — a number with nothing to
compare against is a number):

| role | `PATCH /rest/v1/products` | rows affected |
|---|---|---|
| **staff** | **200** | **1** |
| manager | 200 | 1 |
| owner | 200 | 1 |

The cause is in `schema.sql` and was never rewritten by 0002:

    create policy "staff can update stock on sale" on products
      for update using (store_id = public.current_store_id());

No role test, no column list, no `WITH CHECK`. Permissive policies are OR'd, so
this one alone lets any store member update any column of any product in their
own store. It exists so a sale can decrement `stock`, and it grants far more
than that.

**Barcode inherits exactly this and opens nothing new** — which is what the
brief actually asked me to guarantee, and that guarantee holds. But the
baseline it assumed is not the baseline that exists. Where the zero-rows
expectation comes from is clear: `categories` really does refuse staff writes
with 200 · 0 rows, and Phase 4 measured that. **One table's policy is not
another's.**

Not fixed here. The brief said not to write a new policy, and a new policy
could not have fixed it anyway — an added permissive policy can only widen
access. The fix is to *narrow* the existing one, which lands on the sale path,
and that is its own change with its own blast radius. Logged, not smuggled in.

Through the UI, staff are stopped by `canManage()` in `inventory/actions.ts` —
the app layer, not the database.

## What landed in the app

| File | Change |
|---|---|
| `types/index.ts` | `Product.barcode: string \| null` |
| `lib/validation/product.ts` | `barcode` on `ProductInput`/`ProductPayload`; the 8-14 digit rule; `'' -> null` |
| `components/inventory/ProductModal.tsx` | one `Field`, full width under Brand/SKU, hint "Optional · 8-14 digits" |
| `app/(dashboard)/inventory/actions.ts` | duplicate detection naming the product; 23505 backstop; 23514; PGRST204 |
| `components/inventory/InventoryClient.tsx` | barcode under the SKU in the row, a `Barcode` CSV column, and searchable |
| `lib/importCsv.ts` | header aliases, `EMPTY`, within-file duplicate check |
| `components/inventory/ImportProductsModal.tsx` | recognised-headers line, preview row |
| `scripts/acceptance/acceptance-seed.cjs` | `ean13()` + placeholder barcodes |

### The duplicate error is checked twice, on purpose

A `SELECT` before the write produces the friendly sentence in the common case.
It is **not** the guarantee — two saves racing both pass it — so the `23505`
branch stays as the real backstop and does its own lookup to name the product.
Two people adding stock at one counter is an ordinary Saturday, not a
hypothetical.

Both paths fall back to "already used by another product in this store" when
the lookup finds nothing, which is genuinely reachable: the conflicting row can
be deleted between the failed write and the read. Vague and true beats a name
that was invented.

The error is returned as `errors.barcode` **and** as `message`, so it lands on
the field's own inline slot rather than only in the banner at the top of a
ten-field form.

### The dead SKU branch, found in passing

`saveProduct` has always had `UNIQUE_VIOLATION -> "A product with that SKU
already exists."` **There is no unique index on `products.sku`** anywhere in
`schema.sql` or migrations 0001-0013 — checked, not assumed. That branch has
never been reachable. `products_store_barcode_key` is the first genuinely
unique index on this table, which is why the 23505 handler now checks *which*
constraint fired instead of assuming SKU.

### CSV import was not in scope and could not be left alone

Adding a `Barcode` column to the export while the import ignored the header
would have made an export-edit-reimport round trip **silently drop every
barcode** — an unmapped column is never read, and the preview would show
nothing wrong. So `barcode`/`bar code`/`ean`/`upc`/`gtin` map to the field, and
a barcode repeated inside one file is reported the way a repeated SKU already
was.

## Placeholder barcodes for the seed — 40, not 41

**These are not real product barcodes and the seed says so in three places.**
Scanning a real tin of Amul ghee will not match the seeded row.

`ean13(i)` produces `200` + 9-digit index + a correctly computed check digit.
The prefix is the point: **GS1 reserves 02 and 20-29 for restricted
distribution** — codes a shop prints for itself, which by definition identify
nothing outside that shop. These are not merely unassigned; they sit in the
block guaranteed never to be assigned to a manufacturer. The check digit is
computed properly so a scanner accepts them as well-formed EAN-13 — a seed of
malformed codes would exercise the error path forever and the happy path never.

Verified before going near the database: 40 codes, **40 unique**, all 13
digits, **all with valid EAN-13 check digits**, all matching both the app regex
and the migration's CHECK.

    2000000000015  2000000000022  2000000000039  2000000000046 ...

**The brief said 41 seeded products; the seed owns 40.** Measured rather than
assumed: the harness store holds 41 products, of which 40 carry an `ACC-` SKU
and one does not — `Journey Test Masala 500g`, created by hand during the Phase
8 owner journey. The seed derives every id from a fixed namespace precisely so
teardown removes what it created and provably nothing else; having it reach out
and stamp a row it did not create would break that property to save one value.
The 41st gets its barcode through the product form, which is also the manual
save test.

## The PDF export does not gain a barcode column, and here is why

The brief said to show barcode in the CSV and PDF exports "the same way the
ACC- SKU is already shown". **SKU is not in any PDF.**

There is exactly one PDF in the app — `exportReportPdf` in `lib/pdf.ts`, called
only from `ReportsClient.tsx` — and it is a *sales* report: Revenue by day, Top
products, Category mix, Payment methods. Its product rows come from
`ReportItem`, which is `{ product_name, quantity, line_total, created_at }`:
no product id, no SKU, no join back to `products`. Nothing there to mirror.

Adding one would mean matching sale line items to products by name, and
`product_name` is a snapshot taken at the time of sale — a renamed product
silently stops matching. That is a new feature with a correctness question in
it, not an extension in place.

**So: CSV yes, PDF no, by measurement rather than by omission.** If product
identity is wanted in a report, the honest version is an Inventory PDF export
carrying SKU *and* barcode together — a small, separate piece of work.

## Verified

`tsc --noEmit`, `eslint` and `next build` all green; all 28 routes still in the
route table.

## 0014 applied and verified — 27 checks, 27 passed

Applied by the owner in the SQL editor. Confirmed by measurement, not by
reading the folder: the PostgREST OpenAPI document now lists **15** columns on
`products`, and `barcode`'s description is verbatim the `comment on column`
this migration writes — which also proves it was THIS file that ran and not
some other change.

### The database, tested behaviourally rather than by reading catalogs

A catalog row proves an object exists, not that it behaves. Every line below is
the result of trying the thing:

| | |
|---|---|
| multiple NULL barcodes coexist | 47 rows `IS NULL` |
| accepts a valid 13-digit barcode | 200, 1 row |
| CHECK rejects non-digits | 400 · **23514** |
| CHECK rejects 7 digits | 400 · **23514** |
| duplicate within a store | 409 · **23505** |
| **same barcode in ANOTHER store** | **200, 1 row — per-store, not global** |
| a different barcode, same store | 200, 1 row |
| clearing back to NULL | 200, 1 row |

The sixth row is the one that cannot be established by reading. It is the
difference between `unique (store_id, barcode)` and `unique (barcode)`, and
under the second this app would be broken for its second customer.

### The form, driven in a real browser — 12 of 12

| | |
|---|---|
| React hydrated before anything was clicked | fiber present, waited for as a fact |
| search filtered to the target row | `["Edit Journey Test Masala 500g"]` |
| Edit Product modal opened | `"Edit Product"` |
| Barcode field present, label wired by id | `{label:"Barcode", wired:true, maxLength:"14"}` |
| text field with numeric keypad | `type=null inputMode=numeric` |
| typed digits accepted | `4006381333931` |
| **saved through the form and persisted** | db = `4006381333931` |
| **visible after a full reload** | rendered |
| **friendly duplicate error** | *"This barcode is already used by Red Onions."* |
| **no raw Postgres error in the UI** | no 23505, no `duplicate key`, no index name |
| error attached to the field itself | `aria-invalid="true"`, `aria-describedby` -> that sentence |
| refused save left the row untouched | db unchanged |

The duplicate message is returned as `errors.barcode` as well as `message`, and
the last check confirms it lands on the control rather than only in the banner.

### Staff write, against `barcode` specifically

| role | `PATCH products.barcode` | rows |
|---|---|---|
| **staff** | **200** | **1** |
| manager | 200 | 1 |
| owner | 200 | 1 |

Identical to the `brand` baseline. **barcode inherits the existing policy
exactly and opens no new path** — which is what was asked. The pre-existing
opening is unchanged and is written up above.

### The CSV export — the actual bytes, not the column list

`URL.createObjectURL` was patched before the click so the Blob could be read
back. Reading the source would not have caught an off-by-one putting digits
under the wrong header.

    Name,Brand,SKU,Barcode,Category,Unit Price,Unit,Stock,Min Stock,Status
    Agarbatti Pack,Cycle,ACC-039,2000000000398,Household,1.35,pack,19,7,In Stock

3,357 bytes, Barcode at index 3 between SKU and Category, **40 of 41 rows
carrying 8-14 digits, all in the 200 block**. The 41st is the journey product,
restored to NULL after the form test.

### Backfill — 40, and why not a reseed

`acceptance-seed.cjs --yes` was deliberately NOT run. Its sales loop reads
`new Date().getDay()` to decide how busy each of the last 30 days was, and
every later PRNG draw shifts with it — eight days on from the original run it
would regenerate different sales, quantities and closing stock, rewriting the
whole demo shop to set one column. A targeted backfill wrote only `barcode`,
using a byte-identical copy of the seed's `ean13()` keyed off the SKU
(`ACC-007` -> `ean13(7)`), so a future full reseed reproduces exactly these
values instead of a competing set.

Result: 40 rows written, 40 distinct, all 13 digits, all `200...`.

## Four instrument failures, none of them the app

Recorded because D38 says to, and because three of the four produced output a
healthy system could also produce.

1. **`barcode present: false` while the project was DOWN.** The first probe run
   hit 521 from Cloudflare and 544 DatabaseTimeout from storage — the Supabase
   project had auto-paused. `definitions` was undefined, `Object.hasOwn({},
   'barcode')` is `false`, and "not applied" and "could not ask" were
   indistinguishable. Fixed by printing the column list beside the boolean, so
   an empty answer looks empty.
2. **`hasAddProduct: false` on a page that had the button.**
   `document.body.innerText` returned 340 characters because innerText reflects
   *rendered* text and the preview pane was not compositing. `textContent`
   found it immediately.
3. **The preview pane cannot verify interactive behaviour at all.** Not
   displayed means not compositing, which means no layout (`getBoundingClientRect`
   all zeros), no screenshots, and **no hydration** — every control had an empty
   React fiber, so a click lands on a button with no handler. This is D38 case 5
   recurring. The CDP harness from the earlier sessions hydrates properly and is
   the right instrument; the pane is not.
4. **`Server action not found`** — action ids were read from `.next/server/`
   (production) while the dev server was running, which uses
   `.next/dev/server/` with different ids. Its sibling reading, `PASS  no raw
   Postgres error leaked`, passed **because nothing ran** — a green line about
   an action that 404'd.

## Environment finding: `npm run start` cannot reach Supabase on this machine

Not a bug in the app, and it will bite again, so it is written here as a
standalone finding rather than as a note attached to a config file.

**Symptom.** Every authenticated route on a locally-served *production* build
307s to `/login` while holding a valid, freshly minted session cookie. The same
cookie works perfectly against `npm run dev`.

**Cause.** `package.json` differs between the two scripts:

    dev    cross-env NODE_EXTRA_CA_CERTS=./avast-root.pem next dev
    start  next start

Avast intercepts TLS on this machine, so without that CA bundle the *server's*
outbound HTTPS to Supabase fails. `proxy.ts` -> `updateSession` cannot validate
the session, treats the request as anonymous, and redirects. The failure is at
the server's own egress, which is why nothing about the cookie looks wrong.

**Why it reads as an auth bug and is not.** A 307 to `/login` with a good
cookie is exactly what an expired session looks like. The tell is that
re-minting does not help while `dev` keeps working on the same cookie — one
process trusts the Supabase certificate chain and the other does not.

**Fix when a production build needs to be exercised locally:**

    cd stockpulse && npx cross-env NODE_EXTRA_CA_CERTS=./avast-root.pem next start

or add `NODE_EXTRA_CA_CERTS` to whatever launches it. A `stockpulse-prod` entry
was tried in `.claude/launch.json` during this session and **deliberately not
kept** — it was incomplete without that variable, and shipping a launch config
that reproduces this exact confusion is worse than not having one.

**Consequence for this phase:** the UI verification above ran against the dev
server on port 3100, not a production build. The production bundle was
confirmed green by `next build` and its route table, but no authenticated
production route was exercised locally.

---

# BARCODE — Phase 2 of 4: camera scanning prototype (2026-08-17)

Branch `barcode/camera-prototype`, off `main` (`f0bb65b`). **Not merged, not
deployed.** Standalone prototype only: `/scan` reads a barcode and prints it.
No Inventory wiring, no Sales wiring, no database access of any kind.

Independent of Phase 1's PR #1 — this branch touches no product code, so the
two can be reviewed in either order. The seeded barcode used as a fixture is
referenced as a literal string, not imported.

## The decision that mattered: zxing-wasm everywhere, NOT BarcodeDetector

The brief flagged that WebKit has no Barcode Detection API. The obvious answer
is "native where available, library as fallback". **That was rejected.**

WebKit does not implement `BarcodeDetector` at all — not behind a flag, not
partially. So under a native-first design every iPhone, every iPad and desktop
Safari *always* take the fallback. The fallback is therefore the real
implementation for a large share of a grocery's staff while being the branch
nobody exercises on a Chrome laptop.

That is this project's recurring failure written a sixth time: measure one
world, ship another (D26, D38). Two decoders is two sets of quirks — different
`format` spellings, different behaviour on a blurred frame, different rotation
handling — and the set testable here would be the one iOS never runs.

So: **one decoder, `zxing-wasm` (reader build), on every browser.** The
behaviour verified here is the behaviour that ships everywhere. If native
detection is ever wanted for speed it should arrive as a measured optimisation
with the wasm path kept as the reference — never as the default with the wasm
path as an untested safety net.

Cost, measured: `zxing_reader.wasm` is **1,068 KB raw / 1,093,289 bytes as
served**, fetched only after someone presses Start camera on `/scan`, and only
once per session (the load *promise* is cached, not the module — two frames can
ask before the first fetch finishes, and caching the module would start a
second 1 MB download).

### The wasm is self-hosted, and that needed a build step

zxing-wasm fetches its binary from a CDN by default. Three reasons that is
wrong here: it is a third-party request inside the authenticated product (this
project already removed six unsplash loads and a CDN rendering library); a CDN
outage becomes a scanner outage in a shop; and D42 says an integration that
transmits anything is named in the privacy policy in the same change — a
decoder that phones out on first use is undeclared egress.

`scripts/copy-zxing-wasm.mjs` stages it into `public/wasm/` on `predev` and
`prebuild`. Copied rather than committed: it is a megabyte of build output, and
a committed copy would have to be re-committed on every version bump — a step
someone forgets, leaving a wasm that disagrees with the JS glue loading it.
`public/wasm/` is gitignored.

## FOUND AND FIXED: the proxy was about to break the decoder

`proxy.ts`'s matcher excludes static extensions from session handling, and its
own comment says why — with `mp4` missing, the auth middleware once answered
the hero video with the sign-in page as HTML and the hero rendered black.

**`wasm` was not in that list.** Measured, before and after:

    no session cookie, before:  307 -> /login
    no session cookie, after:   200  application/wasm  1,093,289 bytes

Signed in it returned the binary either way, so this would not have shown up in
casual use. But an expired session answers a 1 MB wasm request with HTML, and
the scanner then fails with a module-instantiation error that says nothing
about being logged out. One word in a regex; found by curling the path, which
is exactly how the mp4 case was found.

## Verified — decode logic, 3 cases, in Node

The EAN-13 fixture is generated by a **spec-based encoder written for this**
(`scratchpad/ean13.cjs`), deliberately not zxing's own writer: generating with
the library that decodes would mostly prove the library agrees with itself.
Two independent implementations agreeing on the symbology is a real check.

| case | result |
|---|---|
| seeded `2000000000015` (ACC-001, Red Onions) | **1 result, `text="2000000000015"`, `format=EAN13`, `isValid=true` — exact match** |
| noise frame, no barcode | **0 results** |
| QR code | 1 result, `format=QRCode`, text `https://example.com/not-a-product` |

The 95-module pattern was checked against the spec too: start guard `101`,
centre guard `01010`, end guard `101`, length 95.

**The three are distinguishable, which the brief required.**
`lib/barcode/decoder.ts` maps them to a discriminated union — `none` /
`unsupported-symbology` / `product` — rather than `{value?, error?}`, because
D17 records exactly how the optional-field shape fails to narrow. The UI
renders three different things: a quiet "Looking for a barcode…", a "That is a
QRCode, not a product barcode" with the decoded text, and the digits at 2xl
with the format beneath.

An unreadable frame is **never** an error state. It is the overwhelmingly
common case while somebody is still aiming, and showing an error for it would
train people to ignore errors.

## Verified — permission denied, in a real browser on the real page

Observed on `/scan` in headless Chrome, rendered by the actual component:

    Camera permission was refused
    Your browser is blocking the camera for this site. Open the padlock or
    camera icon in the address bar, set Camera to Allow, then reload this
    page. On iPhone: Settings → Safari → Camera → Allow.

Not a silent failure, and it names the remedy — which matters because the
browser will not prompt a second time once refused, so "try again" is a dead
end.

## NOT VERIFIED — and this is the honest part

**A live camera feed decoding a real barcode has not been observed.** Headless
Chrome in this environment refuses camera access under every combination tried:

| attempt | result |
|---|---|
| `--use-fake-ui-for-media-stream` + fake device + y4m file | permission refused |
| CDP `Browser.grantPermissions {videoCapture}` (page session) | permission refused |
| same, sent to the **browser** target instead | permission refused |
| `--auto-accept-camera-and-microphone-capture` | permission refused |

In every case `video.readyState` stayed `0`, `videoWidth`/`videoHeight` `0`,
and "frames checked" never appeared. The fixtures were built and are correct —
three 640x480 30-frame Y4M files, 13.5 MB each, showing the seeded EAN-13,
static, and a QR code — and Chrome will play a `.y4m` as a camera; it just
never got permission to.

So these remain **unverified and need a real device**:

- that `getUserMedia` returns a usable stream and the video element paints;
- that the sampling loop decodes a physical barcode held to a lens;
- that `facingMode: environment` selects the rear camera;
- that `playsInline` keeps iOS Safari from going fullscreen;
- **anything at all about Safari or iOS.** This branch chose its decoder
  specifically because WebKit lacks the native API, and that choice is still an
  argument rather than a measurement. It needs one real iPhone.
- the "No camera found" branch as *rendered*. Its copy and its code path are
  distinct from the denied branch, but a `NotFoundError` could not be produced
  while the environment insisted on `NotAllowedError`, so the two have not been
  seen side by side on screen.

One near-miss worth recording: the denied-permission check **passed on the
first run for the wrong reason.** Headless Chrome denies by default, so that
pass showed nothing about the CDP denial working. It only became evidence once
the grant path was proved to be the thing failing. A green check whose cause
has not been established is not a check — D45's shape, from the other side.

## CORRECTION (same day): the first version reported a working camera as refused

Reported from a real Android Chrome device on the preview deployment: Start
camera always produced "Camera permission was refused", with the camera
permission granted.

**The cause was in this component's error handling, not in the camera.**
`getUserMedia()` and `await video.play()` sat inside one `try`, and the single
`catch` ran both through `classifyCameraError`. `HTMLMediaElement.play()`
rejects with **`NotAllowedError`** under the autoplay policy — the same name
`getUserMedia` uses for a denied permission — so a successful camera open
followed by a rejected `play()` was reported as a permission refusal. On
Android Chrome the `await` on `getUserMedia` consumes the user activation from
the tap, which is what makes the following `play()` look like unprivileged
autoplay.

Four changes:

1. **The camera request has its own `try`/`catch` and nothing else is in it.**
   Only a `getUserMedia` rejection may produce a permission message. Stated in
   a comment on `classifyCameraError` too, because the next person to add a
   step to the start sequence will be tempted to widen that block again.
2. **A rejected `play()` is now non-fatal.** The element is already bound to a
   live track and Android Chrome usually plays anyway; the decode loop gates on
   `readyState`, so it waits rather than aborting a working camera. The
   rejection is surfaced as a warning, not an error.
3. **The raw `name: message` is always on screen** beneath the friendly copy.
   The friendly sentence is a guess at meaning; the DOMException is what
   happened. Without it this bug was undiagnosable from the screen — which is
   how it reached a device in the first place.
4. **A Diagnostics block**, collapsed, populated on Start: secure context,
   origin, in-an-iframe, `getUserMedia` presence, **Permissions API camera
   state**, video-input count, live `readyState`/dimensions, frame count, last
   error, user agent.

The permission copy was also wrong in substance. It said "your browser is
blocking the camera" and named only the browser's site permission — but Android
has **two independent permissions**, the OS permission for the Chrome app and
Chrome's own per-site permission, and granting one does not grant the other. A
user who had checked the OS one was being sent back to the same place. Both are
named now.

`video.muted` and `defaultMuted` are also set imperatively in an effect: React
sets `muted` as a property and does not reliably reflect the attribute, and the
autoplay policy inspects the element's muted state. Cheap, and it removes one
candidate cause rather than leaving it arguable.

Verified after the fix, in a browser: the raw `NotAllowedError: Permission
denied` renders, the two-layer remedy copy renders, and Diagnostics reports
`Permissions API camera state: denied` alongside `Video input devices: 1` —
precisely the pair that separates "the site permission is blocked" from "there
is no camera".

**Still not verified on a real device.** The fix is correct about the bug it
describes, but whether the Android symptom was this bug or Chrome's per-site
permission cannot be settled from here. Diagnostics answers that on the first
tap, which is the point of it.

## Verified — the rest

- `tsc --noEmit`, `eslint`, `next build` all green.
- `/scan` in the route table: **29 routes, up from 28.**
- **Not in `lib/nav.ts`.** An unfinished feature must not appear in the sidebar
  or the command palette. Same pattern as `/staff/team` (D15) and
  `/settings/categories` (D36): a real route, reached by URL, absent from
  NAV_ITEMS.
- **No role guard, deliberately.** Every guarded route in this app gates a
  shop's *data*. This page reads and writes nothing — it opens the camera on
  the viewer's own device and prints what it sees. Phase 3 adds a product
  lookup, and that is the point at which it needs `canManage`, because that is
  when it starts answering questions about inventory.
- The camera is released properly: `stop()` calls `track.stop()` on every
  track, not just `video.pause()`, so the hardware indicator actually goes out.
  Wired to unmount as well as to the button.
- Overlapping decodes are impossible — a `busyRef` guard drops a frame rather
  than queueing it, so a slow decode cannot build a backlog that stalls the tab.

---

# BARCODE — Phase 3 of 5: Inventory wiring (2026-08-17)

Branch `barcode/inventory-wiring`, off `main` (`b9e459f`). **Not merged.**
Scan from Inventory, resolve the code against this store, and land in one of
the two flows Inventory already has. No Sales wiring, no new write path.

## Nothing new was invented, which is the point

| | |
|---|---|
| entry point | a `Scan` button in the toolbar beside Import CSV / Add Product, behind the same `canWrite` gate |
| match | `setEditing(product)` + `setModalOpen(true)` — what the Edit button does |
| no match | `setEditing(null)` + `setModalOpen(true)` — what Add Product does, plus the digits pre-filled |
| unreadable / QR / wrong symbology | Phase 2's component, mounted as-is |

**There is no separate "adjust stock" screen in Inventory to reuse.** Checked
before building: a grep for adjust/restock/updateStock finds nothing, and the
only stock control anywhere is the `Quantity` field inside `ProductModal`. So
"take the user to update that product's stock" *is* edit-mode `ProductModal`,
which is why the match path is identical to clicking Edit.

The scanner component gained exactly **one** optional prop, `onDetected`. With
it omitted `/scan` behaves precisely as before. Everything else — the camera
faults, the "Looking for a barcode…" state, the QR message, the diagnostics
block — is reused rather than reimplemented.

## The lookup is a Server Action, not a filter over what is already loaded

`InventoryClient` already holds every product in memory, so a client-side match
would have been free. It would also have been wrong: that array is a snapshot
from page load, so a product added at the till thirty seconds ago is not in it.
The scan would then offer to *create* it, and the unique index would refuse the
save with a message naming a product not on screen.

`findProductByBarcode` takes `store_id` from the session and never from the
caller, writes `.eq('store_id')` explicitly even though RLS already scopes the
read — it is the pair `products_store_barcode_key` is built on, so this is an
index lookup — and returns a discriminated result, because `product: null` is a
**successful** answer meaning "no product has this barcode", not a failure.

Guarded by `canManage()` despite being a read: a scan can only end in create or
edit, both of which `saveProduct` refuses for staff, so an unguarded read would
be a path to a dead end — and it avoids adding a barcode-enumeration endpoint
no UI offers.

## Verified — the whole flow, in a browser, with a working camera

**Phase 2 could never open a camera in headless Chrome. That was never Chrome.**
`Permissions-Policy: camera=()` was sent by `next.config.ts` on *every*
response including the dev server's, so the document itself was denied. With
`camera=(self)` the fake-device path works, and Phase 3 got the end-to-end
verification Phase 2 could not:

    seeded   2000000000015 -> "Edit Product"  name="Red Onions"  stock=39
    unseeded 9990000000012 -> "Add Product"   barcode pre-filled, name=""

9/9 checks. The unseeded code was confirmed absent from **every** store first,
or the no-match case would prove nothing.

**Store scoping, measured across tenants.** A barcode was temporarily written
onto a product in a *different* store and looked up as the harness owner using
the anon key so RLS applied:

    scoped   (store_id + barcode): 200, 0 rows   <- NO MATCH, correct
    unscoped (barcode only)      : 200, 0 rows   <- RLS hides it independently

Two layers agreeing, not one. The foreign barcode was restored.

**Role gate, with controls (D38).** `profiles.role` flipped between runs;
`getCurrentUser` re-reads it, so the same session sees different UI:

| role | Scan | Add Product | Import CSV | Edit |
|---|---|---|---|---|
| staff | no | no | no | no |
| manager | yes | yes | yes | yes |
| owner | yes | yes | yes | yes |

Add/Import/Edit are the controls: Scan disappearing alongside them is the
consistent result. Scan alone differing would have been the finding.

**RLS on the write itself — unchanged, and still open.** Measured directly on
`products.stock` per D24, rows actually affected:

| role | `PATCH products.stock` | rows |
|---|---|---|
| **staff** | **200** | **1** |
| manager | 200 | 1 |
| owner | 200 | 1 |

Identical to the Phase 1 measurement. **Phase 3 adds no write path** — a scan
leads only to `saveProduct`, which refuses staff — but the pre-existing
`"staff can update stock on sale"` policy still lets staff PATCH `products`
directly through PostgREST. Unfixed, unchanged, still logged.

`tsc --noEmit`, `eslint` and `next build` all green.

## Three probe defects, all mine, none of them the app

D38 asks for the healthy scenario that produces the same output before
reporting a defect. All three had one:

1. **`video.readyState = null`** after a successful scan. The scanner modal
   *unmounts* when `ProductModal` opens, so there is no `<video>` left to
   query. The decode is itself the proof the camera worked — nothing else can
   open that dialog.
2. **`name = null`, `stock = null`** in the modal. My label regexes were
   `/^Name/` and `/^Stock/`; the real labels are **"Product Name"** and
   **"Quantity"**. `/^Barcode/` matched, which is what showed the extractor was
   sound and the patterns were not.
3. **`redirected /inventory -> /login`** — the harness session had expired. The
   instrument failing loudly rather than reporting a green "staff sees nothing"
   result is D26 working as designed.

## NOT verified — a real scan on a physical device

The camera here is a `.y4m` file played through Chrome's fake device. Nobody
has held a phone at a shelf and watched stock update. **Expected at this stage
and not a gap to close now** — the owner has since confirmed both `/scan` and
voice input work on a real Android device, so the remaining unknown is the
Phase 3 hand-off specifically, not whether the camera works at all.

**Closed 2026-08-17:** the owner ran the full loop on a real Android phone
against the preview — scanned an unknown product, got Add Product pre-filled,
saved it with name/price/quantity, rescanned it and got Edit Product with the
saved details. Phase 3 merged as `b88ed50`.

---

# BARCODE — Phase 4 of 5: Sales wiring (2026-08-17)

Branch `barcode/sales-wiring`, off `main` (`b88ed50`). **Not merged.**

## Scanning is an entry point, not a second path

The add-item flow lives in `components/sales/LogSaleModal.tsx`, and the single
function that puts anything in a cart is `addToCart(product)`. A scan calls
**that function**, so everything downstream is inherited rather than rebuilt:

| behaviour | why it is automatic |
|---|---|
| duplicate scan increments, capped at stock | `addToCart` already does exactly that (`Math.min(l.quantity + 1, product.stock)`) |
| price charged | `product.unit_price`, the current price, same as manual |
| stock deduction | `handleSubmit` maps the cart into the `log_sale` RPC — untouched, so a scanned line and a searched line are indistinguishable by the time they reach it |

Requirement 5 therefore needed **no code at all**: the scan never touches the
submit path.

**An unknown barcode is an error here, never an invitation to add inventory.**
Inventory's no-match opens the create form; Sales says "No product in this
store has the barcode NNN. Nothing was added." and adds nothing. At a till,
inventing a name and a price with a customer waiting is the wrong answer.

A scanned product with `stock <= 0` is also refused, because manual search
already filters to `stock > 0` — a scan must not be a way round that.

## The one thing that had to change outside Sales

`findProductByBarcode` lost its `canManage()` guard.

Phase 3 added that guard reasoning a scan could only lead to create or edit,
both refused for staff, so an unguarded read was a path to a dead end. **That
stopped being true the moment Sales was wired.** Measured, not assumed:
`/sales` has no role guard — `NAV_ITEMS` lists all three roles, the page does
not redirect, and Log Sale is ungated, because staff work the till. The guard
would have stopped a cashier scanning anything.

Removing it exposes nothing: RLS already lets any store member SELECT products,
so a staff session could always read that row. Inventory's Scan button stays
behind `canWrite`, so nothing there changes.

## Scanner mounted inline, NOT as a nested Modal

D29: two live focus traps fight, and the outer one drags focus back out of the
inner dialog. The scanner renders inside the existing sale modal instead —
which also lets the cashier watch the cart fill up while scanning.

Continuous scanning without touching the scanner component: `key={scanned}`
remounts `ScannerPrototype` after each hit, re-arming its one-hand-off-per-
session ref guard. Phase 2's component is unchanged.

## Verified — 13/13, in a browser with a fake camera

    scan once            Total 1.29   (unit_price, correct)
    scan same again      Total 2.58   (incremented)
    sale_items after     1 row, quantity 2, unit_price 1.29
    stock                39 -> 37

The duplicate question is answered by **`sale_items`, not the DOM**: one row
with quantity 2 can only come from one cart line being incremented. Two lines
of quantity 1 would total 2.58 as well, which is why the Total alone was not
accepted as proof.

Unmatched barcode: the message names the barcode, the cart stays empty, no
create form appears, the modal survives.

Every sale written was deleted and stock restored, verified by reading back.

## Role gate — D24, rows actually affected

| role | Scan button | `log_sale` | sale rows | stock |
|---|---|---|---|---|
| staff | shown | 200 | **1** | −1 |
| manager | shown | 200 | 1 | −1 |
| owner | shown | 200 | 1 | −1 |

All three identical, and that is **correct** — unlike Inventory, selling is
what staff are for. This is the same `"staff can update stock on sale"` policy
that reads as a gap on Inventory; here it is the policy doing its job.

`tsc --noEmit`, `eslint` and `next build` all green.

## Probe defects, and one real mistake

Four instrument faults, each with a healthy scenario that produced the same
output (D38): a `$`-anchored Total regex against a `₹` currency; a cart-line
counter that counted the success toast; a sales count read before the RPC had
committed; and a `signIn()` that reset the harness password mid-loop, revoking
the browser cookie the next role's UI check was using.

**And one genuine mistake, not a probe artefact.** The cleanup deleted
`recent[0]` — the newest sale — on the assumption it was the row the run had
just created. On a run where no sale was created, that deleted a real seeded
sale: **`165a1f77-a2e7-5818-be52-dce048fe9837` (`sale:375`), gone.** Harness
store only, one row of 379, nothing in a customer's data — but it is data loss
caused by exactly the reasoning D24 exists to forbid: acting on which rows you
*believe* were affected instead of which rows *were*. The cleanup now diffs the
id set captured before the run and deletes only ids absent from it.

The row is not recoverable as it was: its contents came from a PRNG sequence
seeded off the run date, so it cannot be reconstructed, and fabricating a
replacement is what D23 forbids. Re-running `acceptance-seed.cjs --yes` would
recreate `sale:375` by derived id, at the cost of regenerating every other
seeded sale's dates and quantities.

## NOT verified

No physical device. The camera is a `.y4m` file through Chrome's fake device;
nobody has scanned a real item into a real sale on a phone.

---

# BARCODE — CLOSED across all five phases (2026-08-17)

On `main`, deployed to production. `0001`–`0015` contiguous, no gaps.

| phase | what landed | merge |
|---|---|---|
| 1 | `products.barcode`, per-store unique index, manual entry, CSV | `f461dee` |
| 2 | `/scan` prototype, zxing-wasm on every browser, self-hosted | `b88ed50` (with 3) |
| 3 | Inventory: scan → edit stock, or create pre-filled | `b88ed50` |
| 4 | Sales: scan → `addToCart`, same duplicate/price/deduction rules | `2667f59` |
| 5 | `0015` drops the blanket staff UPDATE policy on `products` | `e738423` |

Plus the fix that made any of it work on a phone: `Permissions-Policy` was
`camera=(), microphone=()`, denying both to the app itself. See D52 — it cost
several sessions of device-level debugging that could never have found it.

## Verified on production (not localhost, not preview)

- `0015` on `main`; migration numbers `1..15`, **no gaps**.
- Deploy `success`; `/` and `/login` 200, `/inventory` and `/sales` 307 to auth.
- `/wasm/zxing_reader.wasm` → 200, `application/wasm`, 1,093,289 bytes.
- Authenticated `/inventory`: Scan button present, "Search name, SKU, barcode…",
  10 rows rendering `Barcode:`. `/sales`: Log Sale present.
- `products` reports 15 columns, `barcode` among them.
- RLS after 0015, rows actually affected (D24): staff `log_sale` 200 · 1 row ·
  stock −1, staff `PATCH products` 200 · **0 rows**; manager and owner 1 row.
- Console: no errors or exceptions captured.

The owner ran all six chain steps by hand on a phone against the preview —
scan unknown → create → rescan → Edit with saved details → Sales scan → same
item twice giving quantity 2 on one line → Complete Sale → stock −1.

## NOT verified — carried forward honestly

1. **Safari / iOS — never tested, at all.** The decoder was chosen *because*
   WebKit lacks `BarcodeDetector`; that reasoning is still an argument, not a
   measurement. Needs one real iPhone.
2. **Real-device performance.** Decode latency, battery, and behaviour on a
   cheap Android are unmeasured. The sampling loop is 8 fps against a 1 MB
   wasm; nobody has watched it run for an hour at a till.
3. **Email delivery** — unchanged from earlier phases and unrelated to
   barcodes, but still open: invitations depend on SMTP configuration.
4. **`products.sku` has no unique index.** Measured again: a duplicate SKU
   PATCH returns 200 · 1 row, so `saveProduct`'s "SKU already exists" branch
   has never been reachable. **The next step is the duplicate audit, not the
   index** — the SQL is in FOUND-ISSUES.
5. **One product with no barcode** — `Journey Test Masala 500g`, 1 of 42,
   cosmetic; the seed does not own that row so it will never gain one.

Also unclosed and deliberate: the automated production chain probe did **not**
pass. Its wait predicate keyed on `"Add Product"` in body text, which is also a
toolbar button always present for an owner, so it proceeded before any decode
had happened. That is a probe defect with a healthy explanation (D38), not an
app failure — but it means the joined chain on production is evidenced by the
owner's manual run and by each link being verified separately, not by an
automated end-to-end pass.

---

# EXPIRY TRACKING — Phases 1 and 2 of 4

## Phase 1 (merged, `5640672` / PR #6) — the summary this file was missing

`supabase/migrations/0016_product_batches.sql`, **applied and verified**. Schema
only: no UI, no change to `log_sale`.

| what | shape |
|---|---|
| `products` gains | `unique (store_id, id)`, so batches can carry a composite FK |
| new table | `product_batches(id, store_id, product_id, quantity, expiry_date, received_on, note, created_at, updated_at)` |
| `products.stock` becomes | a trigger-maintained mirror of `sum(product_batches.quantity)` |
| backfill | one lot per product that held stock, carrying that stock and that product's `expiry_date` |

Four decisions worth not relitigating, all argued at length in the migration's
own header:

1. **The FK is composite `(store_id, product_id) -> products (store_id, id)`**,
   the D35 shape. A batch pointing at another shop's product would be a
   cross-tenant stock leak that RLS could not catch, because the batch's own
   `store_id` would look perfectly correct.
2. **Derived by trigger, never reconciled.** A nightly reconcile means the
   number on screen is knowably wrong between runs; a generated column cannot
   reference another table.
3. **The trigger is `SECURITY DEFINER`, and that is load-bearing.** Since 0015
   dropped the blanket staff policy on `products`, a non-definer trigger would
   silently fail to update stock for any caller who cannot write `products` —
   and an RLS refusal is a successful statement affecting zero rows (D24), so
   the mirror would go quietly wrong rather than loudly.
4. **No `shipment_id` column, and no `shipment_items`** — D55. `shipments` is
   header-only, so shipment-sourced batches is a whole feature, not a foreign
   key. A batch is created ad hoc at the product.

Phase 1 shipped with **one gap it named in its own header**: `saveProduct` and
`importProducts` still wrote `products.stock` directly, so those writes set the
mirror to a number the batches did not support. Survivable only because nothing
read the batches yet. **Closing it is what Phase 2 is.**

## Phase 2 — Inventory UI (this branch)

**No new migration.** 0016 is applied and carries every index Phase 2 needs —
`(store_id, product_id)` for the modal's read and the partial
`(store_id, expiry_date)` for the perishables query a later phase will run. The
next number stays `0017` for whoever needs it.

### What changed, and why the write target had to move

The old modal had a `Quantity` field and one `Expiry Date` field, and
`saveProduct` wrote both onto the `products` row. Under 0016 that is an
absolute overwrite of a mirror.

`Quantity` + `Expiry Date` is now a **repeating pair** — one row per delivery —
in a `Stock & Expiry` fieldset, using the same `Field`/`Input` components and
the same two-column grid the single pair sat in. `Low Stock Threshold` moved up
beside `Price` and `Unit` to make room. `Total stock:` is shown, never typed.

| file | change |
|---|---|
| `lib/validation/product.ts` | `ProductInput.stock`/`.expiryDate` become `lots: LotInput[]`; `ProductPayload` loses `stock` and `expiry_date` entirely; `toLotPayloads`, `totalLotQuantity`, `describeProductErrors` added |
| `app/(dashboard)/inventory/actions.ts` | `syncProductLots()`; `saveProduct` and `importProducts` write lots and never `products.stock` |
| `components/inventory/ProductModal.tsx` | the lot rows, add/remove, live total |
| `app/(dashboard)/inventory/page.tsx` | one query, `select('*, product_batches(*)')` through the composite FK; `today` computed with `reportingDate()` and passed down |
| `lib/expiry.ts` | new — `nextExpiry`, `expiryTone`, `formatExpiry`, all on ISO strings, no clock |
| `components/inventory/InventoryClient.tsx` | sortable `Expiry` column, CSV column, `ExpiryValue` |
| `lib/importCsv.ts` | Stock/Expiry cells fold into one lot; new `replacesLots` |

### Three rules `syncProductLots` depends on

1. **A lot id is matched, never trusted.** An id that is not already a lot of
   this product in this store becomes a new lot, so a crafted request cannot
   repoint another product's batch.
2. **Unchanged lots are not rewritten.** A no-op UPDATE still fires the
   trigger, which recomputes stock as the batch sum — and the batches have
   never been decremented by a sale. Rewriting an untouched lot would quietly
   restore stock the shop has already sold. This is why editing a product's
   *name* cannot resurrect stock.
3. **Rows affected are checked (D24)**, even though `canManage` should make a
   refusal unreachable. "Should be unreachable" is the reasoning D24 exists
   about.

### Dates: past, far future, blank

- **Blank is valid and stays valid.** Most of what a kirana shop sells does not
  expire, and a forced date is worse than none because an invented date warns
  wrongly. Stored as `null`; the list shows an em dash.
- **Past is valid.** Refusing it would mean the one lot the feature exists to
  surface is the one lot it will not accept. Shown in red with `Expired`.
- **Far future is valid.** Stored and shown with no urgency invented.
- **Only the impossible is rejected**, year outside 2000–2100, because a year
  is typed into a four-digit spinner and `0202` is one keystroke from `2026`.
  The bound is absolute rather than "20 years from now" so the function stays
  pure and gives the same verdict on client and server.

### No definer function was needed, and that is not an oversight

The brief allowed for one on the 0015 pattern if staff needed to enter stock.
They do not, this phase: `saveProduct` is behind `canManage`, so staff have no
Inventory write path at all, and the RLS on `product_batches` that 0016 wrote
is exactly right as it stands. The definer function becomes necessary when
`log_sale` must decrement lots — the FEFO phase — and it belongs there.

### Verified — observed, not assumed

Against the hosted database, harness store `sandal local store`, dev server.

**RLS on `product_batches`, anon key, real sessions, rows actually affected (D24):**

| role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| owner | 200 · rows visible | 201 · 1 row | 200 · 1 row | 200 · 1 row |
| manager | 200 · rows visible | 201 · 1 row | 200 · 1 row | 200 · 1 row |
| staff | 200 · rows visible | **403 · 42501** | 200 · **0 rows** | 200 · **0 rows** |

Identical to the boundary 0016 wrote, and to the `products` table after 0015.
The control is the SELECT column: staff can read every lot, so a zero on
UPDATE is the policy working, not the session being broken.

**The write path, as the owner, through the real modal:**

- Edited `Bananas` (one backfilled lot, 18 @ 2026-08-12) to three lots —
  18 @ 2026-08-12 (past), 7 @ 2027-12-31 (far future), 5 @ blank. Modal showed
  `Total stock: 30`. After save the database held three rows and
  `products.stock = 30`; `products.expiry_date` was not written.
- **Hard reload:** list showed Stock 30 and `12 Aug 2026 / Expired`; reopening
  the modal repopulated all three lots, earliest expiry first, undated last.
- **Removed the 2027 lot, saved:** two rows left, `products.stock = 23`, and
  the two survivors **kept their ids** — the unchanged rows were not rewritten.
- **Typo year `0202-01-01`:** blocked with "Check the year — nothing expires in
  0202.", modal stayed open, nothing written.
- **Blank expiry on create:** new product, quantity 4, no date → one lot,
  `quantity 4`, `expiry_date null`, `products.stock = 4`, no error.
- **The mirror held throughout.** After every step:
  `select ... having p.stock <> coalesce(sum(b.quantity), 0)` over all 42
  products returned **zero drifted rows**.

**CSV export**, captured from the real download blob:

```
Name,Brand,SKU,Barcode,Category,Unit Price,Unit,Stock,Min Stock,Expiry Date,Status
```

`Expiry Date` is **index 9** (0-based), the tenth column — after the
Stock/Min Stock pair, before Status. 43 lines for 42 products. `Bananas` wrote
`2026-08-12` (ISO, so Excel sorts it); a product with no dated lot wrote empty.
The header is `Expiry Date` and not `Expires` because `lib/importCsv.ts` maps
that exact string back onto a lot — the same round-trip rule the Barcode column
follows.

**Staff on `/inventory`:** six columns, no Actions column, zero `Edit` buttons,
no Add Product / Import CSV / Scan — Export CSV only. The Expiry column is
readable, which is correct: staff need to see what is going off.

`tsc --noEmit`, `eslint .` and `next build` all green.

**Cleanup (D53):** only ids this session created were deleted — three probe
lots, one probe product, one extra `Bananas` lot. `Bananas` is back to stock 18
with its single backfilled lot, and the mirror check is clean.

### NOT verified, carried forward honestly

1. **`log_sale` still decrements `products.stock` and never touches lots.**
   That is Phase 1's stated scope and the FEFO phase's job. Consequence today:
   after a sale, `products.stock` is below `sum(quantity)` until some lot
   changes, and that change then recomputes stock to the batch sum, discarding
   the sale's deduction. Rule 2 above keeps an ordinary product edit from
   triggering it; **it does not eliminate it**, and only FEFO will.
2. **`syncProductLots` is not atomic.** Separate PostgREST calls, so a failure
   part-way leaves some lots written and returns an error saying so. Making it
   atomic means a definer function, which means a migration Phase 2 needs for
   no other reason. Retrying is safe — surviving lots keep their ids.
3. **The CSV import path was changed but not run end to end.** `replacesLots`
   is new behaviour: a file with a Stock or Expiry column replaces a product's
   lots, a file with neither leaves them alone. The second half of that is a
   fix — a missing Stock column previously became `Number('' || '0')` and wrote
   stock 0 over every matched product, silently.
4. **`products.expiry_date` is now neither read nor written.** 0016 copied it
   into the backfilled lot and the lots are the truth. Left in place rather
   than dropped: dropping is destructive, nothing depends on it, and a later
   phase can remove it once no branch references it.
5. **No phone.** Everything here is a 1707px desktop viewport.

### One instrument fault, no app defect behind it (D38)

The in-app Browser pane never composited a frame, so `requestAnimationFrame`
never fired, so React never revealed `/inventory` past its `loading.tsx` and
never hydrated it. Measured symptoms were a table whose every element had a
0×0 rect, a search box that did not filter, and a click on Edit that opened
nothing — the exact shape of PROGRESS's earlier "product modal never opening"
entry.

The healthy scenario that produces all of it is *a correct page in a window
that is not painting*, which is what it was. Re-measured in real Chrome, where
forcing a screenshot supplies the missing frame, everything worked first time.
Nothing was changed in the app on the strength of the first reading.

## Phase 3 — alerts and surfacing (this branch)

### Where the threshold lives, and the dead column it replaces

`stores.perishables_warning_hours integer not null default 48` has existed
since `schema.sql:14`. /settings has always shown a slider for it reading
"48 Hours". **Nothing has ever read it** — measured across the whole tree, the
only references were SettingsClient writing it back and two marketing
paragraphs promising the feature. A D5-shaped column: created in anticipation,
dead ever since.

So the threshold did not need a new home. It needed the one it already had,
connected, in the unit the data supports. `0017_store_expiry_warning_days.sql`
adds `stores.expiry_warning_days integer not null default 7`, CHECK 1–90.

Three things it does NOT do, each deliberate:

- **It does not convert the old value.** `greatest(1, round(hours/24.0))` looks
  respectful and is not: no query ever read that column, so no shop has ever
  seen a warning at 48 hours or formed an expectation about it. Converting the
  untouched default would ship every store a 2-day window while the feature
  they are being given is specified as 7. Preserving a number that never had an
  effect is inheriting a placeholder, not honouring a preference.
- **It does not drop `perishables_warning_hours`.** `main`'s SettingsClient
  still writes that column; dropping it would break saving settings on
  production for the whole window between apply and merge. One line, the moment
  nothing on `main` references it.
- **It is not hours.** `product_batches.expiry_date` is a `date`. There is no
  hour on it to compare against, so 12 hours and 23 hours were the same query.
  A unit finer than the data is a control promising precision it cannot
  deliver. The marketing copy that said "12 hours to a week" is corrected on
  this branch.

### The list is the low-stock list, not a parallel one

| low stock | expiring |
|---|---|
| `supabase.rpc('low_stock_products')` | `getExpiringStock()` in `lib/expiringStock.ts` |
| one scoped call, already ordered scarcest-first | one scoped call, already ordered earliest-first |
| `Archive` + "Low Stock Alerts" card | `CalendarClock` + "Expiring Soon" card |
| same table-collapses-to-cards shape | the same shape, one column swapped |
| `EmptyState` · "All products are well stocked" · "Items fall into this list once they drop to their low-stock threshold." | `EmptyState` · "Nothing is expiring soon" · "Items fall into this list once they come within N days of their expiry date." |
| capped at `slice(0, 6)` | capped at `slice(0, 6)` |

**One deliberate departure: it is a query, not an RPC.** `low_stock_products`
had to be a function because its test is column-to-column —
`stock <= low_stock_threshold` — which PostgREST's filter syntax cannot
express. This test is column-to-constant: the cutoff is computed in Node and
passed down. A function would have cost a second migration and bought nothing.

Undated lots fall out of the filter without a second condition, because
`null <= cutoff` is null rather than true — which also lets Postgres use
0016's partial index, whose `expiry_date is not null` predicate the comparison
implies. Zero-quantity lots are excluded: 0016 keeps them for their history,
and warning about stock that is not on the shelf is how a warning becomes
noise. Rows are grouped to one entry per product, carrying the **at-risk**
quantity rather than the product's total stock — 6 in a lot dated Friday is 6
at risk, and saying 40 would overstate every line.

### Where it surfaces, and the colour rule it inherits

`Today's Sales` keeps the hero and the only gold hairline in the app. The KPI
row goes from five columns to six: the hero still spans two, and **Low Stock
and Expiring Soon are now a pair**. Below `xl` they are one column each rather
than the full-width tile Low Stock used to be, so on a phone the two
"go and do something" figures land on the same row instead of stacking with
7-day revenue between them.

The zero rule is inherited verbatim from the comment already sitting on the
Low Stock tile — *"Deep red only when there is something to act on. Zero items
low on stock is the good outcome, and colouring it as an alert made an empty
store look like a failing one."* So:

| state | treatment |
|---|---|
| expiring soon, count > 0 | `sp-kpi-warning` (`--warning`) — it can still be sold |
| expiring soon, count = 0 | **no colour class at all** |
| already expired, count > 0 | `--danger` foot line, "N already expired" |
| already expired, count = 0 | no red at all — not even a reassuring "0 expired"; the foot line becomes the neutral "within N days" |

`ALERT_STYLES` gains **two** entries rather than one with a flag, for the same
reason: `expired` takes the danger border, danger icon field and a `CalendarX`;
`expiring` takes the warning border, warning field and a `CalendarClock`.
Giving both the warning triangle would make the state that still has a remedy
look like the one that does not.

### Reports — no natural place, and it is not forced in

Every panel on /reports is a **sales-period aggregate** over a range picker,
compared against the equally-long period before it: revenue by day, category
mix, payment methods, top products, four KPIs. `lib/reports.ts` is entirely
`ReportSale` / `ReportItem` over a from/to window.

Expiry is **point-in-time stock state**. It has no period, and no prior-period
comparison that means anything — "expiries in the last 30 days versus the 30
before" is not a question a grocer asks. Adding it would give either a panel
that ignores the date range the whole page is built around, or an invented
metric to justify the range. Both are worse than the dashboard surface it
already has, so nothing was added to /reports.

### Verified — observed, not assumed

**0017, all four post-apply checks (applied by the owner in the SQL editor):**

| check | result |
|---|---|
| column in PostgREST schema cache | `true` |
| every store = 7 | `true` — all four stores |
| bound bites | `0` → 23514 · `400` → 23514 · `91` → 23514 · `90` → 200·1 row · `7` → 200·1 row |
| RLS unchanged, rows affected (D24) | owner 200 · **1 row**; manager 200 · **0 rows**; staff 200 · **0 rows** |

No policy was added and none was needed — `stores` already carried the one
/settings saves through, and the new column inherits it. Manager and staff
getting zero rows is correct and matches `low_stock_threshold_units`: /settings
is an owner-only route.

**Buckets** (today 2026-08-18, window 7, cutoff 2026-08-25). The seed already
spanned all three ranges, so the added lot is a two-state control on the
boundary itself rather than bulk seeding:

| boundary lot | tile "Expiring Soon" | tile "already expired" |
|---|---|---|
| 2026-08-24 (inside) | 4 | 10 |
| 2026-08-25 (**exactly the cutoff**) | 4 | 10 |
| 2026-08-26 (one day past) | **3** | 10 |

The cutoff is inclusive, and the expired count never moves — the control
showing only the intended bucket changed. Products beyond the cutoff
(Fresh Curd 08-26, Salted Butter 08-27, Spiced Buttermilk 08-27) appear **0
times** in the rendered page. `Ghee` matches once, but that is `Pure Ghee
500ml` in the Low Stock table — a substring, not the 2026-09-24 Ghee lot.

**Empty state**, by moving all dated lots out of range and restoring: tile `0`,
the red foot line **absent** and replaced by the neutral "within 7 days", both
expiry entries gone from Recent Alerts, and *"Nothing is expiring soon — Items
fall into this list once they come within 7 days of their expiry date."*

**The zero-colour rule, with Low Stock as the control:**

| state | `sp-kpi-alert` | `sp-kpi-warning` |
|---|---|---|
| 4 expiring, 5 low | 2 | **2** |
| 0 expiring, 5 low | 2 | **0** |

Zero expiring carries no colour class. Low Stock stayed at 5 across both and
its count never moved, which is what makes the counting method trustworthy.

Every restore was verified row by row against the captured originals — 18/18
and 17/17, every row matching its own value, the probe lot deleted, and the
0016 mirror clean at 42 products / 0 drifted afterwards.

### The 20-state harness

Real Chrome, real keyboard, rings measured **serially** per D30 — focus one
element, read that element, move on; never focus-all-then-read.

Widths: **1439px** (target 1440; one pixel of window quantisation at 90% browser
zoom) and **400px** (target 390 — Chrome clamps its window at ~500 physical px,
so 400 CSS is the floor reachable without device emulation. Both sit below the
`sm` 640 breakpoint, so it is the same phone layout under test).

| # | route | w | theme | CLS | overflow | rings |
|---|---|---|---|---|---|---|
| 1 | /dashboard | 1439 | light | 0.0003 | 0 | 40/40 |
| 2 | /settings | 1439 | light | 0 | 0 | 31/31 |
| 3 | /inventory | 1439 | light | 0 | 0 | 58/58 |
| 4 | /dashboard | 1439 | dark | 0.0003 | 0 | 40/40 |
| 5 | /settings | 1439 | dark | 0 | 0 | 31/31 |
| 6 | /inventory | 1439 | dark | 0 | 0 | 58/58 |
| 7 | /dashboard | 400 | light | 0 | 0 | 32/32 |
| 8 | /settings | 400 | light | 0 | 0 | 23/23 |
| 9 | /inventory | 400 | light | 0 | 0 | 44/44 |
| 10 | /dashboard | 400 | dark | **0.004** | 0 | 32/32 |
| 11 | /settings | 400 | dark | 0 | 0 | 23/23 |
| 12 | /inventory | 400 | dark | 0 | 0 | 44/44 |
| 13 | /dashboard **expiry empty** | 400 | light | 0 | 0 | 24/24 |
| 14 | /dashboard **expiry empty** | 400 | dark | 0 | 0 | 24/24 |
| 15 | /dashboard **expiry empty** | 1439 | light | 0 | 0 | 32/32 |
| 16 | /dashboard **expiry empty** | 1439 | dark | 0 | 0 | 32/32 |
| 17 | / (signed out) | 1439 | light | 0 | 0 | 49/49 |
| 18 | / (signed out) | 1439 | dark | 0 | 0 | 49/49 |
| 19 | / (signed out) | 400 | light | 0 | 0 | 44/44 |
| 20 | / (signed out) | 400 | dark | 0 | 0 | 44/44 |

- **CLS**: worst state **0.004**, on the mobile dashboard. Everything else is 0
  or 0.0003. The "good" threshold is 0.1, so the worst state is 25x inside it.
- **Horizontal overflow**: **0px in all 20**, no offender element found in any.
- **Focus rings**: **751 / 751** focusable elements across the 20 states show a
  visible ring. Zero misses.
- **Console**: 26 messages across /login, /dashboard, /settings and /inventory,
  **all INFO/LOG** — React DevTools notice, `[HMR] connected`, `[Fast Refresh]`.
  Zero errors, zero warnings, zero exceptions.

`tsc --noEmit`, `eslint .` and `next build` all green.

### Three instrument faults, no app defect behind any of them (D38)

1. **Focus rings read 8/40.** Before touching anything: what healthy system
   produces that? This app styles focus with `:focus-visible`, and a
   programmatic `.focus()` does not set it in Chrome unless the last input
   modality was keyboard. One real `Tab` keypress, re-measure, **40/40**, and
   `document.activeElement.matches(':focus-visible')` is `true`. Every state
   above sends a real Tab first. Had this been "fixed" in the app it would have
   meant bolting always-on outlines onto a correct focus system.
2. **`sp-kpi-warning` reported absent in both states.** Low Stock is 5 and must
   carry `sp-kpi-alert`, so the probe was wrong. The RSC flight payload is
   chunked mid-token across `__next_f.push` script tags — the literal string was
   split as `"sp-kpi mt-2 sp"` + `"-kpi-alert"`. Reassembling the payload before
   counting produced the table above.
3. **"No console errors found."** The tool says tracking starts when it is first
   called, so an empty buffer is produced equally by a clean page and by a
   listener that was not running. Re-ran the routes with tracking live; the
   26 captured messages are the control that makes the zero meaningful.

Plus the one that cost the most: **both browser surfaces measured a correct app
as broken** because the window was minimised and then backgrounded —
`visibilityState: "hidden"`, `requestAnimationFrame` never firing, every element
0x0, hydration never completing. The foreground window was the Claude app
itself, which is the catch-22: the operator has to be in Claude to ask for the
run, and Chrome has to be in front for the run to be measurable. Resolved by
fronting Chrome from the Win32 API for the duration and restoring it after.

### NOT verified, carried forward

1. **`log_sale` still does not touch lots** — unchanged from Phase 2, closes
   with FEFO. Expiry warnings therefore read batch quantities that no sale has
   decremented, so a lot sold out today still warns until someone edits it.
2. **`perishables_warning_hours` is still on the table**, now unread by any
   branch except `main`'s SettingsClient. One line drops it once this merges.
3. **390px was not reachable** — 400px is Chrome's floor without device
   emulation, and the in-app pane that can emulate never composites.
4. **No phone.** Every state above is a desktop Chrome window.

## Phase 4 — the scan says what state the stock is in

### How the two scan flows actually work, before changing anything

Both flows are one lookup and then an EXISTING path. Neither introduces a
third.

| | Inventory | Sales |
|---|---|---|
| entry | `Scan` button (behind `canWrite`) mounts `ScannerPrototype` | `ScannerPrototype` mounted inline in `LogSaleModal` |
| decode lands in | `InventoryClient#handleScanned` | `LogSaleModal#handleScanned` |
| lookup | `findProductByBarcode` (Server Action) | the **same** Server Action |
| match | `ProductModal` in edit mode — which *is* how stock is changed | `addToCart`, the same function the search results call |
| no match | `ProductModal` in create mode, `initialBarcode` pre-filled | an **error** — never a create form with a customer waiting |

So there is exactly ONE place a scanned product's data is looked up:
`findProductByBarcode` in `app/(dashboard)/inventory/actions.ts`, shared by
both screens. That made the natural insertion point obvious — the lookup itself
now embeds the lots (`select('*, product_batches(*)')`, resolved through 0016's
composite FK), and both flows get expiry without a second round trip between
the beep and the answer.

The natural display points that follow from the table above:

1. **The scan toast**, on both screens — the one moment the reader is
   definitely looking at the phone.
2. **The cart row** in Sales, which outlives the toast. A cashier who scanned
   four things must still be able to see which one was the expired one while
   ringing up the fifth.
3. **ProductModal's Stock & Expiry fieldset** in Inventory, where a scan lands.
   The lot rows were already there from Phase 2; what was missing was the
   verdict — a reader had to compare a column of dates against today in their
   head to learn the one thing the scan was asking about.

`/sales` search results got it too, and that is deliberate rather than scope
creep: a cart line does not remember how it got there, so a product reached by
typing must carry the same information as one reached by beeping. Otherwise the
same milk shows a date when scanned and nothing when searched.

### One line, not a list — and why

A product can hold many lots. Both scan surfaces are places where someone is
standing holding something: a phone at a shelf, or a customer's shopping at a
till. Neither can afford a table.

So `ExpiryTag` shows the **nearest at-risk date only** — the same number
`nextExpiry` already feeds the inventory column and the dashboard tile, and the
same one a person acts on, because the earliest thing to go off decides whether
this item is sold, discounted or pulled. Extra lots are a **count, not a list**:
"+2 more lots" says a fuller picture exists without making anyone read it here.
That fuller picture already has a home — ProductModal lists every lot with its
own quantity and date, and a scan opens exactly that modal.

The count is of lots that hold stock AND carry a date, which is the set
`nextExpiry` chose from. Counting all lots would inflate the hint with the
sold-out rows 0016 keeps for history and with undated rows that can never be
the nearest expiry.

### A threshold bug Phase 3 left behind, found by trying to reuse it

Phase 4 was asked to use "the same thresholds Phase 3 established". It could
not, because there were two.

Phase 3 made the window a per-store setting (`stores.expiry_warning_days`,
0017) and taught the dashboard to read it — but `expiryTone()` in
`lib/expiry.ts` kept its own hardcoded `EXPIRY_SOON_DAYS = 7`. A shop that set
14 days would have been told "expiring soon" on the dashboard while the
inventory list showed the very same lot in neutral grey until day 7.

**Nothing surfaced it because every store still holds the default of 7**, so
the two numbers agreed by coincidence rather than by construction. `EXPIRY_SOON_DAYS`
is gone; `expiryTone(date, today, warningDays)` takes the window, every caller
passes `storeExpiryWarningDays(store)`, and `/inventory` now receives it from
its page the way `/dashboard` already did.

### Verified — observed, not assumed

`today = 2026-08-19`, `storeExpiryWarningDays = 7`, cutoff `2026-08-26`. Run
through the **shipped** `lib/expiry.ts`, transpiled with the project's own
TypeScript, against rows read from the live database:

| barcode | product | tone | rendered |
|---|---|---|---|
| 2000000000183 | Basmati Rice 5kg | EXPIRED | "Expired 12 Aug 2026 · 7 days ago" |
| 2000000000275 | Drinking Water 1L | — | "No expiry date" |
| 2000000000336 | Detergent Powder 1kg | — | "No expiry date" |
| 2000000000091 | Whole Milk 1L | SOON | "Expires 22 Aug 2026 · in 3 days" |
| 2000000000060 | Curry Leaves | EXPIRED | "Expired 10 Aug 2026 · 9 days ago" |
| 8906010366896 | Ghee | OK | "Expires 24 Sep 2026 · in 36 days" |

Curry Leaves and Ghee are controls that depend on no fixture of mine — one
naturally expired, one naturally beyond the window and therefore neutral.

Server-rendered `/inventory` page 1 (10 of 42 rows) shows the same states
through the real component path: six cells reading `—`, plus `10 Aug 2026`,
`16 Aug 2026` and two `12 Aug 2026`, each marked **Expired**. Six plus four is
ten, which is the page size — so every cell on the page is accounted for.

**RLS — staff can SEE expiry on scan and gained NO write access.** The SELECT
is the exact one `findProductByBarcode` now runs, and the writes report rows
actually affected (D24):

| role | `SELECT *, product_batches(*)` | INSERT lot | UPDATE lot | DELETE lot |
|---|---|---|---|---|
| staff | 200 · **1 lot visible** | **403 · 42501** | 200 · **0 rows** | 200 · **0 rows** |
| manager | 200 · 1 lot visible | 201 · 1 row | 200 · 1 row | 200 · 1 row |
| owner | 200 · 1 lot visible | 201 · 1 row | 200 · 1 row | 200 · 1 row |

Identical to the Phase 1 and Phase 2 matrices — embedding the lots in a read
that store members were always allowed to make widened nothing. Every write a
privileged role actually made during the probe was undone, and Basmati's lots
were confirmed back to `qty 2, 2026-08-12` afterwards.

`tsc --noEmit`, `eslint .`, `next build` green.

### Two expectations in the brief that the data did not match (D38)

Both were checked before being called defects, and neither is one.

1. **"Scan Basmati Rice 5kg — confirm it reads as expired (12 Aug 2026)."** It
   did not: its only lot was the 0016 backfill with `expiry_date = null`. The
   tempting conclusion is that Phase 1's backfill dropped the date. It did not
   — the control says so. **17 of 42 products carry a legacy
   `products.expiry_date`, and 0 of them lost it**: Pure Ghee 2026-08-14, Whole
   Milk 2026-08-22, Curry Leaves 2026-08-10 and Ghee 2026-09-24 all match their
   lot exactly. Basmati's legacy column is `null` too, across every store. It
   has simply never had an expiry date in this database. A lot dated 2026-08-12
   was seeded as a **labelled fixture** so the phone test reads as scripted; the
   table above says so rather than presenting it as found data.
2. **"For expiring-soon, no current product qualifies — seed one."** Three
   already did, on the day this ran: Free Range Eggs 08-21, Whole Milk 08-22,
   Fresh Curd 08-26. Nothing was seeded for that case, and Whole Milk was used
   as it stands. The premise was true on 08-18 for a cutoff of 08-25; the date
   moved and the window moved with it.

### NOT verified, carried forward

1. **`log_sale` still does not touch lots.** Explicitly out of scope here and
   still open: a lot sold out today keeps warning until someone edits it, and
   the cart's expiry line describes batch quantities no sale has decremented.
   This is the one gap that survives all four phases, and it needs FEFO.
2. **The rendered cart row and the ProductModal line were not observed in a
   browser.** The lookup returning lots is measured, the tone/wording is
   measured through the shipped code, and the component wiring type-checks and
   builds — but nobody has watched an `ExpiryTag` paint. Both Chrome and the
   in-app pane again reported `visibilityState: "hidden"` with rAF never
   firing, and the extension's tab lived in a Chrome window whose handle the
   Win32 calls could not front.
3. **No camera.** No barcode was decoded from a real label; the lookup was
   exercised by barcode value, not by a scan.
4. **No phone.**

---

# EXPIRY TRACKING — CLOSED across all four phases (2026-08-19)

| phase | what landed | merge |
|---|---|---|
| 1 | `0016` — `product_batches`, and `products.stock` becomes a trigger-maintained mirror | `6e46816` |
| 2 | Inventory UI: stock and expiry are entered as **lots**, not as a column | `ed2e25a` |
| 3 | `0017` — a per-store window, dashboard tile, alerts and the expiring list | `16a7b26` |
| 4 | The scan says what state the stock is in | this branch |

## What the four phases actually changed

`products.stock` used to be a number someone typed. It is now derived from
`product_batches`, one row per delivery, each with its own nullable expiry —
and every writer in the app goes through that table. The column survives
because five call sites in `InventoryClient` alone read `p.stock`, and removing
it would have made Phase 1 a rewrite of half the app.

Expiry then surfaces in five places, all reading the same `nextExpiry` and the
same per-store window: the inventory list column, the CSV export at index 9,
the dashboard tile and its Expiring Soon card, and — since Phase 4 — both scan
flows.

## The rules that took a phase each to learn

- **Nothing may assign `products.stock`.** `ProductPayload` has no `stock`
  field at all, so a call site cannot quietly reintroduce the overwrite. The
  type is the guard.
- **An unchanged lot is not rewritten.** A no-op UPDATE still fires the trigger,
  which recomputes stock as the batch sum — and `log_sale` decrements
  `products.stock` without touching lots, so rewriting an untouched lot would
  restore stock the shop has already sold. This is why editing a product's
  *name* cannot resurrect stock.
- **A blank expiry is valid and always will be.** Most of what a kirana shop
  sells does not perish. A past date is valid too. Only an impossible year is
  refused.
- **Zero is never coloured.** The Low Stock tile already carried the comment
  recording that colouring a zero made an empty store look like a failing one;
  the expiry tile follows it, dropping even the red "N already expired" line at
  zero.
- **Expired and expiring-soon are different states, not degrees.** Two
  `ALERT_STYLES` entries, two colours, two words. The one that can still be
  sold must not look like the one that cannot.
- **Every date comparison is on YYYY-MM-DD strings**, and `today` always comes
  from the server. `new Date('2026-08-24')` is UTC midnight and renders as the
  23rd anywhere ahead of UTC.

## The one gap that survives all four phases

**`log_sale` does not touch `product_batches`.** It decrements
`products.stock` as its owner, exactly as it did before Phase 1. So after a
sale the mirror is lower than the batch sum until the next batch write
re-syncs it, and expiry warnings read quantities no sale has decremented.

Every phase deliberately declined to fix it, and the reason did not change:
`log_sale` is the one function every sale depends on, and FEFO deduction — 
deciding *which* lot a sale consumes — is a feature, not a refactor. It needs
its own phase, a definer function for staff at the till, and its own
verification. It is the obvious next piece of work.

---

# OFFLINE MODE — Phase 1 of 5: investigate and propose (2026-08-19)

Minimal code by design: a service worker, a manifest and an offline page. No
queue, no replay, no offline writes. The rest of this section is the
investigation the later phases depend on.

## 1. What happens today when the network drops

**Measured, and the headline is that there is no offline story at all.** Before
this branch: `navigator.serviceWorker.controller === 0` in the running app, and
a tree-wide grep finds no `navigator.onLine`, no online/offline listener, no
Cache Storage use, and nothing persisted client-side except `sp-theme` in
localStorage. A navigation with no signal never reaches app code — the browser
shows its own error page.

**In-session writes fail softly, and nothing already typed is lost.** Measured
against an unreachable host with the project's own `@supabase/postgrest-js`:

    rpc('log_sale') -> RESOLVES (does not throw)
      data   = null
      error  = { message: "TypeError: fetch failed", code: "" }
      status = 0

`executeWithRetry` appears in the stack, so the client retries before giving up.
Tracing that through `LogSaleModal#handleSubmit`: `rpcError` is truthy, so it
calls `setError(...)` and `toast.error('Could not log sale', ...)` and returns —
**`onClose()` and `router.refresh()` are never reached, so the modal stays open
and the cart survives on screen.** A cashier can retry when signal returns. Two
problems: the message shown is the literal string `TypeError: fetch failed`, and
the cart lives only in React state, so a reload or a tab eviction loses the sale
silently.

**Server Actions are the worse path, and this one is NOT measured.**
`saveProduct`, `deleteProduct` and `importProducts` are called from
`startTransition(async () => { const result = await saveProduct(...) })` with
**no try/catch**. A Server Action whose POST cannot reach the server rejects,
which inside a transition is an unhandled rejection reaching the nearest error
boundary — losing the form. I could not drive the modal to confirm it, because
the harness browser would not render dialogs, so this is read from the code and
the Server Action contract rather than observed. **Phase 2 should confirm it
first.**

## 2. Which writes actually need offline support

| write path | needs offline? | why |
|---|---|---|
| `log_sale` (till) | **Yes — the only must** | A customer is standing there. The one write where waiting is not an option and failure loses money rather than time. |
| stock adjust via `saveProduct` | Useful, not urgent | Receiving a delivery can wait minutes. Worth having once a queue exists; not worth building one for. |
| product create/edit metadata | No | Naming and pricing a new line is desk work. |
| categories, suppliers, customers, staff, leave, settings, support, profile, monitoring, notifications, AI | **No** | Exactly the owner-editing-supplier-details case. Each one added to a queue is another conflict surface for no benefit a shop would notice. |

**Recommendation: Phase 2 queues `log_sale` and nothing else.**

## 3. The conflict question — I argue for server-authoritative replay of intents

The scenario: a sale goes through offline on the back-room phone while the same
last two units sell on the till. On reconnect, stock would go to -1.

**Queue the INTENT, never the resulting number.** The queued item is
"sold 2 x product X at 14:32", not "set stock to 3". This one choice decides
everything else, because stock is a **counter**, not a value.

- **Last-write-wins is wrong here, and not marginally.** Applied to a counter it
  discards one of the two sales outright: whichever device syncs second
  overwrites the other's decrement, and a real transaction that took real money
  vanishes from the ledger. LWW is defensible for a product's *name*. It is
  indefensible for money.
- **Reject-and-flag is also wrong**, for a reason easy to miss: the sale
  physically happened. The goods left the shop. Refusing it on reconciliation
  asks the shopkeeper to un-sell something they cannot un-sell, and leaves the
  takings understated.
- **Server-authoritative replay** applies each queued intent through `log_sale`,
  which is already `security definer` and already atomic. Both sales land. Both
  decrements apply.

**And then stock goes to -1, so say what happens next honestly.** Replay must
NOT refuse the sale. It should clamp the stock floor at 0 and write a
discrepancy row — product, expected, actual, both sale ids, the device — that
surfaces as a task in the app. That is the trade-off, stated plainly:

> The software cannot prevent the oversell, because it already happened in the
> physical shop before either device could know. It can only record it
> faithfully and put it in front of a human. Anything that "resolves" it
> automatically is inventing a fact about a shelf it cannot see.

Two consequences to accept up front. **Stock is briefly wrong** between the
offline sale and reconnection — unavoidable, since the authoritative count lives
on a server the device cannot reach. And **replay must be idempotent**: each
queued sale carries a client-generated UUID and the server refuses a duplicate.
Without that, one flaky reconnect deducts the same stock twice.

## 4. What to cache for offline reads, and how it stays fresh

**Cache** (the till's minimum): product `id`, `name`, `barcode`, `unit_price`,
`unit`, `category`, `image_url`, a **stock snapshot**, and the store's own
settings. That is exactly what `addToCart` and `findProductByBarcode` read.

**Do not cache**: reports, analytics, audit, sales history, customers,
suppliers, staff. A cashier needs to ring up a tin of ghee, not last month's
category mix, and every extra table is more to keep fresh and more to leak on a
shared handset.

**Where**: IndexedDB keyed by `store_id`, cleared on sign-out — **not** the
service worker's HTTP cache. That distinction is already enforced by this
phase's worker, which refuses to cache authenticated HTML at all: a grocery
phone is shared between owner and staff, and a cached `/dashboard` would show
the next person the previous person's takings before the network could answer,
with RLS unable to help because those bytes never reach the server.

**Freshness**: pull on sign-in, on regaining connectivity, and on app focus,
using an `updated_at` high-water mark so a refresh is a delta rather than 42
rows each time. **The cached stock number is advisory** — shown so the cashier
sees something, never used to authorise a sale; the server decides on replay
(section 3). The till should carry a quiet "prices as of 14:07" line, because a
shopkeeper who knows the data is ten minutes old can work around it, while one
who assumes it is live cannot.

## 5. Auth offline — the part most likely to bite

Supabase issues a short-lived JWT (about an hour) and refreshes it over the
network. A cashier mid-shift with no signal hits this sequence: the access token
expires, the refresh cannot reach Supabase, and `updateSession` in `proxy.ts`
would redirect to `/login` — except no request reaches the server anyway, so
this phase's worker shows the offline page instead.

Three rules the queue design must follow, all easy to get wrong:

1. **Queueing must not require a valid session.** The queue is local. A sale is
   written to IndexedDB with the user id captured **at the time of the sale**,
   not at replay time, so an expired token cannot block the till or misattribute
   the sale to whoever signs in next.
2. **Signing out must not silently discard unreplayed entries.** It is the one
   action guaranteed to destroy money and it is one tap away. It needs an
   explicit warning naming the count.
3. **Replay may need a fresh sign-in, and must survive it.** Refresh tokens
   rotate and expire; a device offline long enough comes back needing a real
   login. The queue must outlive that and replay afterwards, still attributed to
   the recorded user.

An honest limit: an offline device cannot verify a role. A staff member whose
access is revoked while offline will still ring up sales, and those sales will
replay. RLS catches it at replay time, not at the till — so the discrepancy
surface from section 3 must handle "rejected at replay" as well as "oversold".

## What actually shipped this phase

`app/manifest.ts`, `public/sw.js`, `app/offline/page.tsx`,
`components/pwa/RegisterServiceWorker.tsx`, four generated icons, and two
one-line changes to the auth path. Nothing else. The worker caches static
assets and serves an offline page; it queues nothing.

**The worker refuses to cache authenticated HTML, and that is a security
decision rather than a caching one.** A grocery phone is shared. Only `/offline`
is precached, and it is personalised with nothing.

## Verified — observed, not assumed

Production build on a real server, curled **unauthenticated**:

| path | status | content-type |
|---|---|---|
| `/manifest.webmanifest` | 200 | `application/manifest+json` |
| `/sw.js` | 200 | `application/javascript` |
| `/offline` | 200 | (after the fix below) |
| `/dashboard`, `/inventory`, `/sales` | 307 | auth boundary intact |
| `/`, `/login`, `/privacy` | 200 | unchanged |

In a real browser against the production build: worker `registered`, `active`,
`scope /`, and **`controller: true`**. After a controlled reload, 2 caches and 3
entries; `/offline` precached; **`authedHtmlCached: false`, `strayHtml: 0`**;
`/wasm/zxing_reader.wasm` cached at **1,093,289 bytes**, byte-for-byte the size
this repo already records for the decoder — so the cached copy is the real wasm
and not an HTML impostor.

**The offline test was real, not simulated**: the server process was killed,
`curl` confirmed the origin was dead, and a navigation to `/inventory` rendered
"No connection" with `document.title === 'Offline · StockPulse'`, served by the
worker.

`tsc --noEmit`, `eslint .`, `next build` all green.

## Two defects this phase found in its own work (D38)

1. **`/offline` returned 307 to `/login`.** Caught by curling it
   unauthenticated. Signed in it returns 200 and looks perfect, and the build
   reports the route as generated either way — so nothing upstream shows it.
   The consequence would have been silent and permanent: the worker precaches
   with `cache.add('/offline')`, so it would have cached **the sign-in page** as
   the offline document, and a cashier who lost signal would be shown a login
   form they cannot submit, forever, on an already-signed-in device. Fixed in
   `lib/supabase/middleware.ts`. This is the sixth instance of the bug class
   `proxy.ts` documents; two more (`manifest.webmanifest`, `sw.js`) were
   predicted from that comment and excluded before they could bite.
2. **The worker cached nothing at all.** `/icons/icon-192.png` and the wasm both
   fetched `200 / ok / basic` with correct content-types, and the static cache
   still held **0 entries**. The cause was in my own `putIfCacheable`: it awaited
   `caches.open()` **before** calling `response.clone()`, by which time the page
   had begun consuming the body, so the clone threw and the write never
   happened — silently, because the call was not awaited. Fixed by cloning
   synchronously and moving the write inside `event.waitUntil`. Re-measured:
   3 entries, wasm at the correct byte count.

## Lighthouse — the asked-for number does not exist any more

**Lighthouse 12.8.2 has no PWA category.** Measured: its categories are
`performance, accessibility, best-practices, seo`, and the
`installable-manifest`, `service-worker`, `maskable-icon`, `themed-omnibox`,
`splash-screen` and `apple-touch-icon` audits are all absent from this version —
the PWA category was removed in Lighthouse 12. Reporting a PWA score would mean
inventing one.

Chrome's installability criteria were checked directly instead, and all hold:
served over a secure origin (localhost); manifest parses as JSON with `name`,
`short_name`, `start_url`, `display: standalone`, `theme_color`, and 192px plus
512px icons in both `any` and `maskable` purposes; and a registered service
worker with a `fetch` handler that controls the page.

## NOT verified, carried forward

1. **Nothing was installed on a phone.** Desktop Chrome only, localhost only.
2. **The Server Action failure path is unmeasured** (section 1) — the harness
   browser would not render dialogs, so the unhandled-rejection claim is read
   from code, not observed.
3. **The barcode scanner was not run.** The wasm is cached at the right byte
   count and the decoder's route is untouched, but no barcode was decoded with
   the worker active.
4. **No cross-browser check.** Safari handles service workers and storage
   eviction differently, and it is the platform the decoder already carries an
   untested assumption about.

---

# OFFLINE MODE — Phase 2 of 5: offline reads (2026-08-19)

## The auth decision this is built on

Phase 1's section 5 was never actually picked, so it was put back to the owner
before any code was written. Both answers are implemented here:

- **An expired session offline keeps serving cached reads.** A token the device
  cannot refresh is not evidence of anything except no signal, and blocking
  would stop a till for a reason the cashier cannot fix. Accepted cost, stated
  plainly: a server-side revocation is not felt until signal returns.
- **Signing out wipes the cache immediately.** `signOutEverywhereLocal` clears
  IndexedDB *before* calling `logout()`, because that Server Action ends in a
  `redirect()` which throws to unwind the render - anything after it never runs.

## /offline is a plain static document, not an App Router page

It began as `app/offline/page.tsx`. Offline it loaded, showed the right
`<title>`, and then rendered **an error boundary**: hydrating an App Router page
needs its RSC payload, and the worker deliberately refuses to cache RSC payloads
so that no signed-in page data is ever stored on a shared shop phone.

Caching a data-less shell for it would have carved an exception into that rule.
`public/offline.html` removes the need for one - no React, no route, no server
data, just a file the worker caches whole and serves byte-for-byte.

It still does Phase 2's actual job: it opens IndexedDB in plain JavaScript and
renders the cached list, with search, barcode lookup and a staleness line.

**Declared duplication.** Three rules are restated in vanilla JS there, because
a static file cannot import the app's TypeScript: the barcode shape test
(`isValidBarcode`), exact barcode matching (`matchCachedBarcode`), and
expired/expiring-soon (`nextExpiry` + `expiryTone`). Each is marked in the file.
They must change together - the same standing hazard CLAUDE.md records for the
app-layer and database-layer barcode rules.

## What is cached, and what is not

An **allowlist**, not a convenience type. `CachedProduct` names ten fields:
`id, name, barcode, unit_price, unit, stock, category, image_url,
low_stock_threshold, batches`. Persisting the whole `Product` would have been
shorter and would have quietly kept every column the query happened to select,
forever, on a shared phone.

Not cached, deliberately: reports, analytics, audit, sales history, customers,
suppliers, staff.

Stored in **IndexedDB keyed by `storeId`** - not the worker's HTTP cache. The
key IS the tenancy rule: there is no code path that reads "the snapshot"
without saying whose, so a second store's data cannot be returned by a caller
that forgot a filter, because there is no filter to forget.

## The refresh policy

- **The server render is the sync.** Whenever `OfflineStatus` mounts with
  products from a server component, that list is written. There is no separate
  fetch loop, so the cache cannot disagree with what the page is showing.
- **Regaining connectivity calls `router.refresh()`**, which re-runs the server
  component, which rewrites the snapshot. One path, not two.
- **Nothing polls.** A till on a metered connection should not fetch a product
  list every thirty seconds to learn nothing changed.
- **An empty product list is never written.** A server render that produced
  nothing is not evidence the shop has nothing - it is also what a failed fetch
  looks like, and writing it would lose the list exactly when the network is
  flaky.

## One lookup, online and off

`lookupBarcode` is the single entry point. Online it *is* the Server Action;
offline it answers from the cache. It shares `isValidBarcode` with the action -
which carried its own inline copy of that regex until this phase - and applies
the same store scoping and the same discriminated result, where `product: null`
is a successful "no product has this barcode" rather than a failure.

Callers must branch on `source`, and that is deliberate rather than a leak: a
cached product is enough to NAME something at a shelf and not enough to sell it.
Inventory's scan refuses a cache hit with a sentence saying editing needs a
connection, instead of opening a form whose Save would fail.

## Verified — observed, not assumed

**The cache populates, with the app doing the writing:** 1 record, store
`e47fe6eb`, **42 products**, `syncedAt` set, `userId` recorded, and the fields
exactly the allowlist - `barcode, batches, category, id, image_url,
low_stock_threshold, name, stock, unit, unit_price`. No reports, staff, sales or
customers. All 42 carried expiry lots.

**Cross-store isolation, adversarially.** A second store's snapshot was planted
on the same device carrying **the same barcode** (legal since 0014 makes
uniqueness per store). My store's list held 42 products and did **not** contain
the other store's item; `2000000000183` resolved to `Basmati Rice 5kg` in my
store and to the other store's product in theirs.

**Offline render - the origin was genuinely killed, not simulated.** `curl`
confirmed the port dead, then navigating to `/inventory` produced:

| checked | result |
|---|---|
| served by worker | yes, title `Offline · StockPulse` |
| error boundary | **gone** |
| product rows from IndexedDB | **4 of 4** |
| staleness indicator | "Saved list from 13:22 · prices and stock may have changed since" |
| expired / soon / far-future | `Expired 12 Aug 2026`, `Expires 22 Aug 2026`, `Expires 24 Sep 2026` |
| other store's product visible | **no** |

**Barcode lookup offline**, in the same dead-origin state:

| input | result |
|---|---|
| `2000000000183` (exists in BOTH stores) | 1 row - **my** store's Basmati Rice; the other store's product not shown |
| `9999999999999` | "Nothing in the saved list matches that." |
| `123` (too short) | falls through to name search, no barcode match |
| `milk` | Whole Milk 1L |

**Restoring the network** dispatched `online`, and the offline page left itself
for the app: `/dashboard`, title `Dashboard · StockPulse`.

**No route regressed**, curled unauthenticated on a production build:
`/offline.html` 200 `text/html`, `/manifest.webmanifest` 200, `/sw.js` 200,
`/dashboard` `/inventory` `/sales` 307, `/` `/login` 200.

`tsc --noEmit`, `eslint .`, `next build` all green.

## The bug that was not a bug, and the two that were

**"The cache never populates" was the instrument, not the app.** `OfflineStatus`
was not running because the page had not HYDRATED - measured `hydrated: false`
on the React fiber, in a Chrome tab that was not the active tab in its window.
With the tab activated, the same build wrote the snapshot immediately. This is
the same background-throttle fault that has recurred across this project's
harness work, and it cost most of a session before being named.

**Three of my own probes were wrong before the app ever was.**
`indexedDB.open(name)` on a missing database **creates** it, so early checks
pre-empted the app's own upgrade and left a schema-less v1 database that then
made every real write fail silently. `lib/offline/db.ts` now logs its failures
rather than swallowing them: a cache that never writes must not look identical
to one that works.

**And one real defect, found by measurement:** the worker precached the offline
document but never its JavaScript, because those chunks are only requested when
somebody visits `/offline` - which normally happens only when already offline.
`router.prefetch('/offline')` was tried and did **not** fix it, which is what
narrowed the cause to the RSC payload and led to the static-document rewrite.

## NOT verified, carried forward

1. **The offline banner inside the app was not seen rendering.** The cache write
   it performs is measured; the amber bar itself was never observed, because the
   harness tab would not hydrate on demand.
2. **The rendering test used a seeded snapshot**, not one written by the app in
   the same unbroken run. Both halves are measured - the app writes the correct
   record, and the page renders that record shape - but not end to end at once.
3. **No phone, and no real barcode scanner** with the worker active.
4. **Safari is untested**, and it treats service workers and storage eviction
   differently.

---

# OFFLINE MODE — Phase 3 of 5: queueing sales offline (2026-08-19)

## Where this phase's code had to live, measured first

The question was whether `/sales` loads from an app-shell cache offline (so this
phase adds queueing to a working React page) or falls back to the static
document. **Measured: it falls back.** With the origin killed, a cold navigation
to `/sales` kept the URL but served `offline.html` — no React root, no Log Sale
button. The worker's navigation branch is network-only by design, because
Phase 1 and Phase 2 both refused to cache authenticated HTML.

The consequence decided the architecture: **a cashier who opens the app with no
signal never reaches React at all.** Queueing implemented only in
`LogSaleModal` would be unreachable in the common case — a phone in a back room
with no bars. So:

- the queue lives in **IndexedDB**, reachable from both worlds;
- the **till lives in `offline.html`**, because that is where an offline sale
  actually happens;
- `LogSaleModal` **also** queues, for the narrower case where the page was
  already open when signal dropped.

## Durability first, because a queued sale is money

`stockpulse-offline` goes to **version 2**, adding a `queue` object store keyed
by the sale's client-generated id and indexed on `storeId` and `createdAt`. The
upgrade is additive — `snapshots` is untouched — so a device that already holds
a product cache keeps it rather than re-downloading over a connection it may not
have.

Four decisions that exist because losing a record here loses a real transaction:

- **`idbClear` does NOT clear the queue.** Sign-out wipes snapshots only.
  Unsent sales are money the shop has already taken, and sign-out is one tap
  away on a shared handset.
- **Signing out with sales pending asks first**, naming the count. It still
  does not delete them; it only makes sure nobody walks past them.
- **Every write is read back before success is claimed.** "The put did not
  throw" is not "the record is there" — a quota refusal can surface late.
- **A failed queue write is loud.** Both callers show *"could NOT be saved —
  write it down before the customer leaves"* and keep the cart. The one
  unacceptable outcome is a sale that exists neither on the server nor on the
  device while the cashier is told it is safe.

## What a queued sale carries, and why

`{ id, storeId, userId, createdAt, paymentMethod, total, items[] }`, each item
`{ product_id, product_name, quantity, unit_price }`.

- **`unit_price` is the price CHARGED**, copied per line. Replaying against
  whatever the product costs at sync time would silently re-price a completed
  transaction: raise a price on Tuesday and Monday's queued sales would quietly
  increase.
- **`product_name` is copied** so the queue stays legible to a human after a
  rename or a delete.
- **`userId` is captured at sale time**, not at sync time, so an expired session
  or a shift change cannot reattribute somebody's takings.
- **`id` is client-generated** — a v4 UUID from `crypto.randomUUID`, with a
  `getRandomValues` fallback rather than `Math.random`, because a collision here
  is a duplicate transaction. Phase 4 hands it to the server so a replayed queue
  cannot deduct stock twice.

## Optimistic stock, marked as such

Pending units are **derived from the queue** rather than kept as a running
total, so they cannot drift: remove a queued sale and the number is right again
with no bookkeeping. The till shows `7 left (3 pending)` in the warning colour —
never a bare adjusted figure, which would read as the truth, and never below
zero, because a negative on a till reads as a bug.

**This phase does not sync.** The banner and the offline page both say so
outright; a cashier who assumed otherwise would stop checking.

## Verified — observed, not assumed

The origin was **killed**, not throttled: `curl` confirmed the port dead before
every offline step.

**Three sales made through the offline till**, cold, on the static document:

| | |
|---|---|
| cold nav to `/sales` | served `offline.html` — 3 products, 3 Add buttons, Complete button |
| after sale 1 (2x Basmati) | `8 left (2 pending)` |
| after sale 3 | `7 left (3 pending)` |
| queue header | `3 sales waiting to sync · ₹40.45` |
| confirmation | "Saved on this device · ₹13.45 · will sync when back online." |

**Survived a reload while still offline** — read back from IndexedDB, not the
DOM:

| check | result |
|---|---|
| sales still queued | **3** |
| ids unique | true |
| ids valid UUID v4 | true |
| ordered by `createdAt` | true |
| carries every replay field | true |
| contents distinct | `2x Basmati Rice 5kg` · `1x Whole Milk 1L` · `1x Basmati + 1x Drinking Water` |
| optimistic stock after reload | `7 left (3 pending)` |

**Id uniqueness at scale**, using the same generator the till uses: **20,000
generated, 20,000 distinct, 0 collisions**, all matching the v4 shape, and
`crypto.randomUUID` was the path taken.

**Nothing reached the database.** With three sales completed offline, the store
had **0 `sales` rows in the previous 30 minutes**, and its total row count stood
unchanged at 381.

`tsc --noEmit`, `eslint .`, `next build` green. The offline document's inline
script is syntax-checked separately with `node --check`, since no bundler sees
it.

## A real defect this phase walked into

**The precached `offline.html` is never revalidated.** The till was built, the
build was fresh, the worker was serving the document — and `#cart` was null,
because the cached copy was the previous version. A browser re-runs a service
worker's `install` only when `sw.js` itself changes, so a deploy that touches
only `offline.html` leaves returning devices on the old page. That now matters
much more than in Phase 2: the offline document is where sales are made and it
writes a queue the app reads. Recorded in FOUND-ISSUES.md with three fixes;
until one lands, a deploy touching `offline.html` must also touch `sw.js`.

## NOT verified, carried forward

1. **The in-app queue banner was never seen rendering.** `OfflineStatus` gained
   an itemised pending list, and it type-checks and builds, but the harness tab
   reported `hydrated: false` again — the same background-throttle that has
   dogged this project's browser work. The queue it reads is verified; the amber
   bar is not.
2. **`LogSaleModal`'s offline branch is unverified for the same reason.** The
   React till could not be driven. The code path is small and shares
   `enqueueSale` with the offline document, which IS verified — but it has not
   been run.
3. **A browser restart and a phone restart were not tested.** A reload was.
   IndexedDB is durable across both by specification, but that is a claim about
   the platform rather than an observation of this app.
4. **`total` is a float.** `13.450000000000001` appeared in a queued record.
   Harmless today — the figure is display-only and Phase 4 will let the server
   recompute from the lines — but it must not become the number a shop is paid.

---

# OFFLINE MODE — Phase 4 of 5: sync and conflict resolution (2026-08-19)

## Why this needed migration 0018

Measured against the live schema before any code was written. `log_sale` could
not be reused, for four reasons:

1. `sales` had **no key to dedupe on** — a retried replay would insert a second
   sale, so scope item 1 was impossible without a column.
2. It computes every line from `v_product.unit_price` — **the price today**.
   Replaying through it would re-price completed transactions.
3. It **raises `Insufficient stock` and aborts**, discarding a real sale rather
   than surfacing the shortfall.
4. It stamps `sold_by = auth.uid()` and `created_at = now()`, so a replay would
   credit whoever synced, dated today.

**`log_sale` is not modified.** It is the function every online sale depends on;
a replay path with different rules got its own function.

## The three decisions inside `replay_sale`

**Idempotency is a unique index, not a lookup.** A "does this client_id exist?"
check would let two devices — or one device retrying while the first request was
still in flight — both pass and both insert. The index on
`(store_id, client_id)` makes the database refuse the second; the function
catches that and reports `duplicate`. The lookup survives only as a fast path.

**An oversell is recorded, never raised and never hidden.** The sale lands (the
money was taken, the goods are gone), stock floors at 0, and every clamp writes
a `stock_discrepancies` row carrying `units_sold`, `stock_available` and
`shortfall` — and returns it, so the cashier is told at that moment. This is
where the owner's brief overrode the Phase 1 proposal, correctly: clamping
quietly would bury a real inventory problem.

**Prices come from the client, which is the one place this app must trust one.**
The server cannot reconstruct what a customer was charged last week. Exposure is
bounded: prices only compute this sale's own total, they are rounded to
`numeric(10,2)` and negatives refused, `store_id` comes from the session, and
`p_sold_by` must be a member of that store or the call raises.

**The server-price column discussed before applying did NOT land.** Measured:
`sale_items` is unchanged at `id, sale_id, product_id, product_name, quantity,
unit_price, line_total`, and `stock_discrepancies` carries no price column. The
PostgREST spec fetched cleanly and shows everything else from 0018, so this is a
real negative rather than a stale-cache false one. Recording the server's own
price alongside the client's remains an open, cheap hardening — it rejects
nothing and turns "did someone tamper with a price?" from unanswerable into a
query.

## The sync engine

`lib/offline/sync.ts`. Four rules, each with a reason:

- **Idempotency is the database's job.** This module never decides "I think I
  already sent that" — it sends and believes the answer. A client-side guess
  would be wrong exactly when it matters: a request that timed out may well have
  committed.
- **Oldest first, sequentially.** Sales replay in the order the shop made them,
  so when stock runs short it is the LATER sale that records the shortfall —
  what actually happened on the shelf. Parallel replays would race on the same
  product and produce discrepancy rows describing an order of events that never
  occurred.
- **One failure does not stop the rest.** A sale that cannot be sent stays
  queued, annotated with a readable reason, `lastTriedAt` and an `attempts`
  count, and is retried next time. Halting the queue on one bad row would hold
  good money hostage to it.
- **Removed only after the server confirms.** If the delete then fails, the sale
  is replayed and answered `duplicate` — harmless. The opposite order would
  delete a sale that never landed.

**Nothing resolves silently.** A discrepancy raises an error toast naming the
product and the shortfall; duplicates are reported as "already recorded" rather
than folded into the success count, because a cashier watching the queue drop
deserves to know why; failures name their reason and say the sales are still
saved. The reason is stored ON the queued sale as well, so it survives the
reload a cashier will do before asking why one is stuck.

## Verified — observed, not assumed

### 0018, all seven post-apply checks

| check | result |
|---|---|
| 1 · column + index | `sales.client_id` present; the index proven behaviourally by check 3 |
| 2 · existing data untouched | 382 sales, **0** with a `client_id` |
| 3 · **idempotency** | first `created`, second `duplicate`, **same sale_id**, **1** row |
| 4 · **oversell** | stock 1, sold 3 → sale landed (15.00), stock **0 not −2**, one discrepancy `units_sold=3 stock_available=1 shortfall=2`, returned to the caller |
| 5 · **precision** | total `13.45` exactly; line sum equals stored total |
| 6 · RLS | staff INSERT **403·42501**, UPDATE **0 rows**; manager/owner UPDATE **1 row**; INSERT refused for every role — only the definer writes |
| 7 · cross-store | `sold_by` from another store → **400** "is not a member of this store" |

### The sync engine, run for real

The shipped `lib/offline/sync.ts` was executed against the live database. Only
two things were substituted, both named: `@/lib/offline/db` became an in-memory
Map (IndexedDB does not exist in Node; Phase 3 verified that layer in a
browser), and `@/lib/supabase/client` became a PostgREST call on a real
signed-in session. The loop, its ordering, its D24 confirmation checks and its
failure handling are the shipped code.

| scenario | result |
|---|---|
| **A** three queued, come online | attempted 3, **created 3**, duplicates 0, failed 0; **3 rows**; queue emptied; totals sent in order **10, 20, 10** |
| **B** re-run the same queue | **0 created, 3 duplicates**; still **3 rows** — no duplicates |
| **C** interrupted mid-sync | 1 created, 2 failed, **2 stayed queued** with *"No connection. It will be sent when you are back online."*; **retry → 2 created, 0 duplicates, 3 rows total** |
| **D** one sale forced to fail | **2 created, 1 failed**; the failed one stayed queued with its reason and `attempts: 1`; only **2 rows** landed |
| **E** engineered conflict | server had 2, device sold 3 → sale landed (**12.00**), stock **0 not −1**, discrepancy `units_sold=3 stock_available=2 shortfall=1`, surfaced in the report the UI raises |
| **F** precision through the engine | queued float `13.450000000000001` → stored **13.45**, line sum equal |

Every run restored what it touched: sales 382 → 382, stock 196 → 196.

### Roles, and D25's scope check

| role | `replay_sale` | rows | `sold_by` correct |
|---|---|---|---|
| staff | 200 `created` | 1 | yes |
| manager | 200 `created` | 1 | yes |
| owner | 200 `created` | 1 | yes |

Staff can sync, which is required — staff work the till.

`scope-check.js` is not a file in this repo; D25 defines what it does, and that
measurement was re-run directly: signed in with the anon key so RLS applies,
**every role sees 1 store of 4, with 0 sales rows and 0 products from any other
store.**

`tsc --noEmit`, `eslint .` and `next build` all green.

## What the cashier is told, and when

| situation | message |
|---|---|
| sales sent | "Offline sales synced — N sent" |
| some were already there | "· N already recorded" — never folded into the success count |
| stock was short | **error** toast naming each product: "sold 3, only 2 left … the sale went through and stock is now 0 — please check the shelf" |
| a sale failed | error toast with the reason, plus the reason pinned to that sale in the queue list |

## NOT verified, carried forward

1. **None of the UI was seen running.** The toasts, the "Sync now" button and
   the per-sale failure lines type-check and build, but the harness still cannot
   hydrate a backgrounded tab — the same limit that hid two Phase 3 defects. The
   engine beneath them is verified; the surface is not.
2. **The conflict was engineered on one device, not two.** Scenario E set the
   server's stock to 2 and replayed a sale of 3, which is the same arithmetic a
   second online client would have produced — but two real clients were never
   run against each other.
3. **`p_created_at` backdating was exercised but not asserted.** Queued sales
   carried timestamps minutes in the past and the rows were accepted; nothing
   checked that `sales.created_at` matched them.
4. **The server-price hardening is still absent** (see above).

---

# OFFLINE MODE — Phase 5 of 5: end-to-end verification (2026-08-19)

All four offline phases are on `main`. This is the first pass over the chain as
a whole, and alongside barcode and expiry.

## Bugs found, and where they were fixed

### BUG 1 — a sale queued from the offline till could never sync (FIXED)

`public/offline.html` stamped `userId: snapshot.userId || 'unknown'`. That value
goes to `replay_sale`'s `p_sold_by uuid`. **Measured:**

    p_sold_by="unknown" -> HTTP 400 "invalid input syntax for type uuid: \"unknown\""

So a sale made on the offline till, on a device whose snapshot carried no user,
would sit in the queue **forever** — retried on every reconnect, failing every
time, showing a shopkeeper raw Postgres. It is the exact failure the queue
exists to prevent: money recorded nowhere the shop can reach.

Fixed in the file that owns it — `offline.html` now writes `null`. Measured:
`p_sold_by=null` returns `status="created"`, so the sale lands. It lands
**unattributed**, which is a far smaller loss than a sale that never syncs.

### BUG 2 — a null `p_sold_by` is not defaulted to the caller (FOUND, NOT FIXED)

The same measurement showed `sold_by set to caller: false`. `replay_sale` does
not `coalesce(p_sold_by, auth.uid())`, so a sale replayed without a user id is
stored with no seller.

**Not fixed here, deliberately.** It needs a migration to `replay_sale`, and
this phase was scoped to investigation and bugfix rather than schema change.
It is a data-quality gap, not a loss: the sale, its lines, its total and its
stock effect are all correct. Recorded in FOUND-ISSUES with the one-line fix.

### Hardening in `lib/offline/sync.ts` (the file that owns sending)

- `p_sold_by` is sent only if it matches a UUID, else `null`. Defence in depth:
  the offline till is fixed, but any future writer that invents a placeholder
  cannot strand a sale.
- `readableReason` gained two cases: `invalid input syntax for type uuid`
  (should now be unreachable, named because the version that reached a phone
  showed raw Postgres) and expired-JWT, which now reads *"Your session expired.
  Sign in again and this will be sent."*

## Question 3 — a queued sale when the session expired offline

Traced through the code and confirmed against the storage layer. **The sale is
not lost.**

- The queue lives in the `queue` object store. `idbClear` — the only wipe —
  operates on `STORE = 'snapshots'`, so signing out clears the product cache and
  **leaves the queue untouched**. Verified by reading the store constants.
- `signOutEverywhereLocal` additionally warns, naming the count, before signing
  out with sales pending.
- On reconnect with a dead session, supabase-js attempts a token refresh. If the
  refresh token still lives, the replay proceeds normally. If it does not, the
  RPC returns an auth error, the sale **stays queued with a readable reason**,
  and it replays after the next sign-in — `sp-last-store` and the record's own
  `storeId` both survive.

The one real degradation: `router.refresh()` also fires on reconnect, so a dead
session bounces the user to `/login`. The queue survives that, and syncs once
they sign back in.

## Question 2 — interaction with barcode and expiry

Data confirmed present for every branch of the offline path, against the live
store: **12 expired** products with barcodes (e.g. Pure Ghee 500ml, 2026-08-14),
**3 expiring-soon** inside the 7-day window (Whole Milk 1L, 2026-08-22, barcode
`2000000000091`), and **23 with no expiry at all**. Barcode `9999999999999` is
absent from the store, so the unknown-barcode path is testable on a phone.

The cached record carries `batches`, and `offline.html` restates `nextExpiry` +
`expiryTone` in plain JS, so an expiring item shows from cache with the same
tone rule as online. **That rendering was verified in Phase 2; it has not been
re-verified since the queue and sync landed.**

## D25 scope check, re-run

| role | stores visible | foreign sales | foreign products | foreign discrepancies |
|---|---|---|---|---|
| staff | 1 of 4 | 0 | 0 | 0 |
| manager | 1 of 4 | 0 | 0 | 0 |
| owner | 1 of 4 | 0 | 0 | 0 |

`stock_discrepancies` is included now that 0018 exists; no role sees another
store's rows.

`tsc --noEmit`, `eslint .` and `next build` green. The inline script in
`offline.html` was extracted and `node --check`ed, per the standing rule that it
has no bundler or type checking.

## VERIFIED vs NOT VERIFIED — the honest list

**Verified by measurement, this phase:**
- Bug 1 reproduced (HTTP 400) and the fix confirmed (`status="created"`).
- The queue survives sign-out — `idbClear` touches only `snapshots`.
- Expiry/barcode data exists for expired, expiring-soon, no-expiry and unknown.
- D25 scope, all three roles.
- tsc, eslint, build, and the inline script's syntax.

**Verified in earlier phases, still standing:**
- `replay_sale` idempotency, oversell handling, price precision, RLS (Phase 4).
- Cross-store cache isolation, offline render, offline barcode match (Phase 2).
- Queue durability across reload, and its record shape (Phase 3).

**NOT VERIFIED — and this is the whole of it:**
1. **The full chain has never been run end to end.** Scan → cache hit with
   expiry → complete → queue → reload → reconnect → sync → stock, as one
   unbroken sequence, has not happened once. Each link is verified in isolation.
2. **No UI in any offline phase has been seen running.** The harness cannot
   hydrate a backgrounded tab; this hid two Phase 3 defects that a phone found
   in minutes, and Bug 1 above is a third of the same kind — found by reading,
   not by running.
3. **No real barcode has ever been decoded** by anything but a phone.
4. **The two-device conflict has never been run** with two real devices.
5. **Safari and iOS remain untested**, including storage eviction, which can
   delete a queue holding real money.

---

# OFFLINE MODE — CLOSED across all five phases (2026-08-19)

On `main`, deployed to production. `0016`–`0019` contiguous, no gaps.

| phase | what landed | merge |
|---|---|---|
| 1 | Investigation, plus an installable PWA shell: manifest, service worker, `/offline` | `39ef2ee` |
| 2 | Offline reads — IndexedDB snapshot by store, offline indicator, one barcode lookup online and off | `9260f29` |
| 3 | The sale queue — durable in IndexedDB, optimistic stock, a visible queue, and the offline till | `2010542` |
| 4 | Sync — `0018` `replay_sale`, idempotent replay, discrepancy recording; `0019` server price | `2855e14` |
| 5 | End-to-end verification, and the bug that verification found | `48a44a5` |

## What the five phases actually built

A cashier with no signal can open the app, look up a product by name or
barcode, see its price and expiry, complete a sale, and have it reach the
database exactly once when signal returns — with any stock shortfall recorded
rather than hidden.

Three separate stores, and keeping them separate IS the design:

- **The service worker's HTTP cache** holds static assets and the offline
  document. It caches **no authenticated HTML and no RSC payload**, because a
  grocery phone is shared and a cached `/dashboard` would show the next person
  the previous person's takings with RLS unable to help.
- **IndexedDB `snapshots`**, keyed by `storeId`, holds an allowlist of ten
  product fields. The key IS the tenancy rule: no code path reads "the
  snapshot" without saying whose.
- **IndexedDB `queue`** holds sales that have not reached the server.
  `idbClear` touches only `snapshots`, so signing out clears the product cache
  and leaves the money.

## The rules that took a phase each to learn

- **A client cannot decide whether it already sent something** (D56).
  Idempotency is a unique index on `(store_id, client_id)`; the client sends
  and believes `created` / `duplicate`. A `duplicate` is a SUCCESS.
- **When physical reality has already diverged, record it — do not reconcile
  it** (D57). An oversell lands, stock floors at 0, and the shortfall is
  written down and surfaced.
- **Prices are copied into the queue, never referenced.** Replaying against
  today's price would silently re-price a completed transaction.
- **A queue write is read back before success is reported.** "The put did not
  throw" is not "the record is there", and this store is the only copy of the
  money.
- **Never put a placeholder where a `uuid` goes.**
- **`/offline` is a static file, not a route.** An App Router page cannot be
  served offline from a precached document, because hydrating one needs the RSC
  payload the worker refuses to cache.

## The real bugs, and where each was fixed

| bug | found by | fixed in |
|---|---|---|
| `/offline` returned 307 to `/login`, so the worker would have precached **the sign-in page** as its offline document | curling it unauthenticated, Phase 1 | `lib/supabase/middleware.ts` |
| The worker cached **nothing** — `putIfCacheable` awaited `caches.open()` before `response.clone()`, so the clone threw silently | Phase 1 measurement | `public/sw.js` |
| Offline page rendered an **error boundary** instead of the cached list | Phase 2 offline test | rewritten as `public/offline.html` |
| Scanning offline in Log a Sale did nothing — `handleScanned` called the network-only Server Action, showing "Failed to fetch" | **the owner's phone** | `components/sales/LogSaleModal.tsx` |
| The decoder chunk is never precached, so a first scan offline failed | **the owner's phone** | wasm precached in `sw.js`; JS chunk warmed in `OfflineStatus.tsx` |
| The offline till queued sales that **could never sync** — `userId: 'unknown'` against `p_sold_by uuid` | Phase 5 code review | `public/offline.html`, hardened in `lib/offline/sync.ts` |

**Three of six were found on a phone, not by any harness**, and the reason is
one fact: the browser harness cannot hydrate a backgrounded tab, so no offline
UI was ever seen running here. Every phase carried that as an explicit NOT
VERIFIED item, and the defects landed precisely in it. The lesson is not that
the harness is weak — it is that **a carried-forward "not verified" on a path a
shopkeeper actually uses is a bug waiting for a human to report it.**

## Verified on production, by measurement

- `0016`–`0019` all applied; migration numbers contiguous.
- `/manifest.webmanifest`, `/sw.js`, `/offline.html` all 200 with correct
  content types; `/dashboard`, `/inventory`, `/sales` still 307 to auth.
- `replay_sale` idempotency, oversell handling, `numeric(10,2)` precision, and
  cross-store `sold_by` rejection — all seven 0018 post-apply checks.
- `0019`: 1122 `sale_items` rows carrying no server price, a replayed sale
  adding exactly 2 non-null, and a pre-0019 row still reading as null.
- D25 scope, all three roles: **1 store of 4, zero foreign rows.**

### The two-device conflict, confirmed in the database

Run by the owner on a real phone against a second device, then verified at the
database level rather than from the toast:

    Black salt   stock = 0        negative stock anywhere in store: 0
    discrepancy  units_sold 3 · stock_available 2 · shortfall 1 · resolved null
    sales rows with that client_id: 1   (qty 3, total 141)
    every sale touching the product: 2  (online qty 8, then the replay qty 3)
    sales created after it: none · discrepancies after it: none

The online sale of 8 left 2 on the shelf; the replay took those 2 and recorded
1 unaccounted for. **The sale landed, stock floored at 0, the shortfall was
recorded honestly, and the client id kept it to exactly one row.** A second
attempt was blocked client-side before any RPC, leaving no partial server
record.

## STILL NOT VERIFIED — on the record

1. **Safari and iOS have never been tested, at all.** This matters more here
   than anywhere else in the project: **the queue holds real money, and WebKit
   evicts IndexedDB** under storage pressure and after a period of inactivity.
   A queue silently evicted before it syncs is a shop's takings gone, with
   nothing on screen to say so. Nothing in the current design detects that
   eviction or warns about it. Needs one real iPhone and a deliberate eviction
   test before the app is used on iOS in a shop.

2. **`replay_sale` does not default `p_sold_by` to the caller.** A sale
   replayed with a null user id lands with no seller. Bounded — the sale, its
   lines, its total and its stock effect are all correct, and the owner's live
   test attributed correctly — but it is a hole in the audit trail. **One line,
   in a NEW migration** (0018 and 0019 are applied and must not be edited):

       coalesce(p_sold_by, auth.uid())

Also unclosed and unchanged: no automated end-to-end run of the whole chain
exists, and every offline UI verification to date has come from the owner's
phone rather than from this repository's harness.
