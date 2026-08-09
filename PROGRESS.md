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
