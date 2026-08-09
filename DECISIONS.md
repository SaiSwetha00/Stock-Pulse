# Decisions

Calls made without the owner in the room, and why. Newest last.

The point of this file is that a decision which looks arbitrary six months from
now had a reason at the time. If you are about to reverse one of these, the
reasoning is here to argue with — that is cheaper than rediscovering it.

---

## D1 — AI conversations are owner-blind

`0007_ai_threads.sql`. Every policy on `ai_threads` / `ai_messages` is
`user_id = auth.uid()`. No `can_manage()` branch, no owner override — an owner
has no more access to a staff member's chat history than a staff member does.

Every other table in the schema widens with role, so this reads like an
oversight. It is not. The assistant is where somebody types "how do I fix the
mistake I made on yesterday's stock count". If the owner can read that, people
stop asking and the feature is dead. The business facts an owner genuinely
needs are already in `audit_logs`, which they do read.

Stated as a feature in the "Who can do what" help article, so a buyer meets it
as a promise rather than a surprise.

## D2 — Turn persistence lives in the chat route, not a Server Action

An earlier plan had the browser call `appendMessage` after the stream ended.
That loses the answer whenever someone closes the panel mid-reply, leaving a
question in history with nothing under it. The route's stream runs to
completion regardless, so `lib/ai/persistTurn.ts` writes there instead.

Consequence: `appendMessage` was deleted rather than left as dead code.

## D3 — Voice input is independent of the speaker/mute control

Mute governs what the assistant says aloud. Voice input governs what the user
says to it. Someone who does not want the app talking back on a shop floor
still needs to talk to it with their hands full, so the two never share state
and `VoiceInput` cannot read the mute preference even by accident.

## D4 — Voice language lives in `localStorage`, not `user_preferences`

The microphone belongs to the device someone is standing at, not to their
account. A shared till in the shop and a phone in the stockroom can reasonably
want different languages. Storing it per-device also means no migration.

## D5 — Notification toggles stay on `stores`, not `user_preferences`

Settings writes `stores.critical_stock_alerts` and friends. `0007` created
`user_preferences.notify_*` in anticipation of moving them.

Not moved. These are store-level policy — "does this shop send critical stock
alerts" — and repointing them at a per-user table would silently change what
they mean without anyone asking for that. The `notify_*` columns are the right
home for per-person *delivery* preferences once that UI exists; until then they
are dead schema, logged as S3 in `FOUND-ISSUES.md`.

## D6 — Avatars: public bucket, one object per user, overwritten in place

Public read because avatars render in the topbar, staff table and profile card
on nearly every page. Signed URLs would mean minting one per image per page
load, and they expire, so `next/image` could not cache them. Write access is
still per-user: every write policy requires the first path segment to equal the
caller's uid, so store membership is deliberately *not* sufficient — an avatar
belongs to a person, not a shop.

One object per user (`<uid>/avatar`) rather than a unique filename per upload,
because unique names orphan every previous photo with nothing pointing at them
and no cleanup job to find them. The cost is a stale cache, handled with a
`?v=` buster. Remove deletes the object as well as clearing the column, so a
photo someone asked to delete is not still readable at a public URL.

## D7 — Settings dirty state is derived, not tracked

A boolean set in every `onChange` goes stale the moment someone types a
character and deletes it again: it would claim unsaved changes for an edit that
no longer exists. Comparing live values against props means "dirty" is always
exactly "differs from what is stored", and `router.refresh()` after a save
clears it with no extra bookkeeping.

## D8 — Email is SMTP configuration, not an app dependency

Invitations, password resets and signup confirmations are all sent by Supabase
Auth. Pointing Supabase at Resend's SMTP fixes all three at once with no new
npm package, no API key in the codebase, and 0 KB of bundle — which also
satisfies the master prompt's rule about justifying new dependencies, by not
adding one.

Resend recommended over Postmark and SES on setup effort; its free tier covers
this app's volume. The integration point is SMTP settings rather than a
library, so switching providers later touches no application code.

Deliberately *not* built: a custom transactional-email service. `inviteStaff`
was already complete and correct — the failure was delivery. Building a second
invite path would have been a rewrite of working code.

## D9 — The semantic colour tokens do NOT support `/opacity` modifiers

**This one will bite Phase 4 repeatedly, so read it before writing token
classes.**

`text-danger/80`, `border-danger/30`, `text-accent-ink/80`, `text-surface/70`
all pass `tsc`, pass `eslint`, and build successfully — and then emit **no CSS
rule whatsoever**. The element silently loses that property. There is no
warning at any stage.

Verified by grepping all three production CSS chunks after a build:
`bg-danger-bg` and `text-accent-ink` are present; every `/opacity` variant of
them returns zero matches. Not a single `.token\/nn` rule exists in the output.

Rule going forward: **plain tokens only.** If a softer variant is genuinely
needed, add a real token (`--color-danger-soft`) rather than reaching for an
opacity modifier that will vanish.

Checking this is cheap and the failure is invisible, so it is worth doing after
any change that introduces new token classes:

```
find .next/static -name "*.css" -exec grep -oF "the-class-name" {} \;
```

Use `grep -oF` with **no leading `.`**. Anchoring on a dot only finds bare
utilities and misses anything behind a variant, because Tailwind emits those as
`.focus-visible\:outline-foreground:focus-visible{…}`. Anchoring cost me a false
alarm on `outline-foreground`, which was present and correct all along. If a
class looks missing, grep the raw substring and read the surrounding rule before
concluding anything.

## D10 — The leaked Resend key

`git add -A` from the repo root swept an untracked
`stockpulse/resend_apikey_for_stockpulse.txt` into commit `d6d55f4`. GitHub push
protection rejected the push, so it never reached the remote; exposure was local
only. The owner scrubbed it with `filter-branch`, rotated the key, and
`*apikey*` / `*api_key*` / `*.key` are now ignored.

Lesson, recorded because it will otherwise recur: **stage explicit paths.**
`git add -A` from a repo root that also holds a developer's scratch files is not
safe, and the cost of being wrong is a published credential.

## D11 — The landing keeps its own gold; it was already the same family

The requirement was one shared gold accent. The landing already had one —
`--sp-gold: #c9a227` with light and deep variants in `landing.css`, used across
ten marketing components — and `globals.css` now has `#8b6508` (light) and
`#e3b341` (dark). All three are the same goldenrod family.

Not unified to identical hex. `landing.css` carries an explicit note that the
muted tone is deliberate: "restrained enough to read as an accent used once with
intent, not a glow slapped on every border. Bright gold is now reserved for the
headline gradient and primary-button hover only." Overwriting `#c9a227` with the
brighter `#e3b341` would undo that across ten components to satisfy a
consistency nobody would perceive — the two surfaces are never on screen
together.

Measured on the landing's black: `#c9a227` 8.68:1, `#e3b341` 10.79:1. Both pass
comfortably, so this is not a contrast question.

The effort went instead to the palette classes on dashboard surfaces, which
genuinely bypass the token system and genuinely do not follow dark mode.

## D12 — Semantic tone classes must not be defined in terms of the accent

`Badge`'s `success` tone was `bg-accent-soft text-accent-ink`. That was correct
only for as long as the accent *happened to be* green. The moment Phase 4 made
it gold, every "In Stock" pill in the app turned gold and stopped meaning
"healthy" — and `Toast` had the identical bug, so a success toast showed a gold
tick, which reads as a warning.

Caught in the browser at `#5c4206` on `#f7efda`, not by reading code. Nothing
failed to compile, nothing linted, the build was green.

Rule: a tone with its own meaning gets its own token. `success` uses
`--success*`, `danger` uses `--danger*`. Never borrow the accent for a state,
because the accent is the one token guaranteed to change.

## D13 — Product image paths cannot use the product id

The obvious storage path is `<store_id>/<product_id>`, one object per product
overwritten in place, mirroring the avatars bucket. It does not work: an image
can be chosen while *creating* a product, before any id exists.

The path is `<store_id>/<random-uuid>` instead, and the client deletes the
previous object after a successful replace — new object first, old one second,
so a failed upload cannot destroy the only copy. The store id stays the first
segment because that is what migration 0009's policies key on.

## D14 — Derive, do not store, anything a render can compute

`ImageAdjuster` originally stored the clamped pan and re-clamped it in an effect
when zoom changed. That is two lint errors (`set-state-in-effect`) and a
cascading render, and it let the image sit off-centre for a frame after zooming
out.

Storing raw pan and clamping during render fixed all of it at once. Same for the
object URL: `useMemo` during render, with the effect used only to revoke. Where
a value is a pure function of state, computing it is both simpler and more
correct than synchronising it.

## D15 — Staff lives at `/staff/team`, and `/staff` keeps the rota

The roster could have become the Staff module's landing page, with the schedule
demoted to a sub-route. It did not, for two reasons.

`/staff` is in `NAV_ITEMS` for all three roles and the rota is the surface staff
and managers actually open — moving it would change what the sidebar's "Staff"
link does for everyone in order to serve the one role that manages the team.
And `/staff?week=` is a live URL shape people bookmark; repointing it at a
roster silently breaks those links.

So: `/staff` is unchanged, `/staff/team` is new and owner-only, and `StaffTabs`
joins them. The tab is *absent* rather than disabled for a manager, matching how
`lib/nav.ts` treats `/settings` — a tab that bounces you back where you started
is worse than no tab. `/staff/team` still redirects a manager who types the URL.

Settings keeps a signpost card pointing at it. That is not a staff surface; it
is there because an owner who has used the app will look in Settings first, and
a screen that silently loses a feature reads as a broken screen.

## D16 — Deactivate is a GoTrue ban, not a `profiles.active` column

"Deactivate a staff member" has an obvious implementation — add `active boolean`
to `profiles`, filter on it — and it is the wrong one twice over.

It needs a migration, which blocks the work on the owner being at a keyboard.
And it does not actually do the thing: a profile flagged inactive still has an
`auth.users` row, so the person can still sign in. Every query in the app would
have to learn about the flag, and the one that forgot would be a hole.

`admin.auth.admin.updateUserById(id, { ban_duration: '876000h' })` revokes
sign-in at the layer that grants it, holds at the next token refresh for anyone
already signed in, and needs no schema change. `'none'` reverses it. The profile
row is untouched, so `sales.sold_by`, shift assignments and audit entries still
resolve — deleting the profile instead would put holes in the shop's own
history.

Cost: status is not a column, so it cannot be selected alongside the roster.
`/staff/team` reads it with one `getUserById` per member, in parallel.
Deliberately not `listUsers`, which returns every user of the whole Supabase
project — a page for one shop would page through every other shop's accounts to
find five rows. A lookup that fails resolves to *active*: showing a working
colleague as locked out is the worse error, and the row's controls still work.

## D17 — `loadTeamMember` discriminates on `ok`, not on an optional `error`

Recorded because it cost real time and looks like a style preference.

A helper returning `{ error: string } | { profile: T }` reads fine and does not
work. `if ('error' in found)` narrows nothing useful once TypeScript widens the
returns, and annotating it as `{ error: string; profile?: undefined } | { error?:
undefined; profile: T }` makes it worse: TS narrows the *property* on a
truthiness check without narrowing the *union* it sits in, so `found.profile`
stays `T | undefined` in the branch that has already proved it is not.

A literal discriminant — `{ ok: false; message: string } | { ok: true; profile:
T }` — narrows correctly, and because the failure arm is already a valid
`TeamActionResult`, callers forward a refusal with `return found` instead of
rebuilding the message. `app/auth/actions.ts#loadPendingInvite` still uses the
`in` form; it compiles there only because its callers re-wrap the value rather
than assigning it to a `string` field.

## D18 — Motion never owns the resting state

One rule governs every animation added in the depth-and-motion pass: **the
resting state is the correct one, and a keyframe only overrides it while
running.** If an animation never runs — reduced motion, a throttled background
tab, an unsupported browser, a thrown error, a stalled frame loop — the
interface is still complete.

Concretely, this rules out the obvious way to write each of them:

- Entrances do **not** set `opacity: 0` in the base rule and animate to 1. They
  use `animation-fill-mode: backwards`, which applies the `from` frame only
  during the delay before the animation starts. An element that never animates
  was never hidden. The `opacity: 0` version fails silently and invisibly, and
  the failure is a blank page.
- The save tick's resting `stroke-dashoffset` is `0` — fully drawn. The keyframe
  animates *from* 24, so a save with animations off still shows a checkmark
  rather than an empty box.
- `CountUp` **renders the final value** and the animation is a DOM write on top
  of it. Holding the in-flight number in React state would mean the first paint
  is a zero, and any interruption leaves it there. It also keeps SSR and
  hydration honest: the server renders the real figure.

`CountUp` is also the pass's one deviation from "CSS and IntersectionObserver
only", and it is deliberate. A pure-CSS counter is possible — `@property` on an
integer plus `counter()` — but it can only render a bare integer, and every
figure on this dashboard is "₹12,480.50" or similar. The formatter must run per
frame, so the frame loop must be ours. What the constraint was protecting is
intact: no library, no shared-bundle cost (measured 169.3 KB before and after),
one loop per figure that stops on landing, and no loop at all under reduced
motion.

## D19 — No `.sp-card` shorthand, on purpose

Fifty-three cards were `rounded-2xl bg-surface shadow-sm` with no border. The
tempting fix is one class — `.sp-card { border-radius; border; background;
box-shadow }` — and a find-and-replace.

It would have broken things silently. A plain class in `globals.css` sits
outside Tailwind's cascade layers, so it beats every `bg-*` utility on the same
element. Every card that overrides its own background — the dark stat tiles, the
accent panels — would have lost it, with nothing failing to build and nothing
failing to lint. The same class of invisible failure as D9 and D12.

So the change was additive: `border border-border` appended to each of the 53,
existing utilities untouched. More characters, no way to lose an override.

## D20 — Analytics folded into Reports, not the other way round

The two pages had the same guard, the same query and the same four KPIs over
the same four panels. Only two things differed: Analytics compared each period
against the one before it, Reports exported CSV and PDF.

Reports absorbed Analytics rather than the reverse, because the export paths
(`lib/pdf.ts`, `ExportCsvButton` on four panels) are substantially more code
than a percentage change, and because "Reports" is what a shopkeeper calls the
thing. `/analytics` is deleted outright rather than redirected: it was in the
sidebar for a week, nobody has bookmarked it, and a permanent redirect for a
route that briefly existed is clutter with a maintenance cost.

The comparison got *better* in the move. Analytics could only compare fixed
7/30/90-day presets; Reports derives the previous period from whatever range is
on screen, so a custom range now gets a comparison it could not have before.

The subtle part is the window. Reports fetched 90 days for a 90-day maximum
range, which is exactly wrong once you compare — the prior period would be
empty and summarise as a total collapse in revenue. `WINDOW_DAYS` is now 180,
and `windowStartIso` goes to the client so a range still reaching past the edge
reads "outside compared window" instead of inventing a number. A comparison
that is quietly wrong is worse than no comparison.

## D21 — Leave is a date range, and the block is server-side

Two calls worth recording.

**One row per absence, not one per day.** A fortnight's holiday is one decision
and should be one thing to enter, cancel and correct. Fourteen rows makes
"cancel the second week" a multi-row edit and invites half-deleted leave.
Both bounds are inclusive, so `starts_on = ends_on` is a single day off — the
commonest entry by far, and the one a half-open range would make read wrongly.

**The block lives in `saveShift`, not in the form.** `ShiftModal` warns as soon
as you pick a person and a date, but that is a courtesy: it only knows about
leave in the week the page loaded, and a tab left open while somebody else
recorded the leave knows about none of it. Both the shift date and the staff id
arrive from the browser, so the refusal has to be where the write is.

Dates are compared as `YYYY-MM-DD` strings (`leaveCoversDay`) or as dates in
Postgres — never by constructing `Date` objects. `new Date(iso)` parses as UTC
and shifts by a day either side of midnight for anyone east or west of it,
which is precisely the bug that would let someone be rostered on the first
morning of their own holiday.

**Unapplied-migration behaviour is deliberate.** `/staff` treats Postgres error
42P01 as "no leave on record" and renders the rota exactly as before; `saveShift`
does the same, so scheduling keeps working; only `saveLeave` reports the missing
table, and it names the file to run. The rota predates leave and must not break
because a migration is pending — verified by loading `/staff` against a database
without the table.

## D22 — The accent is never a page or card fill

Recorded because it was tried, measured well, and was still wrong.

The first palette pass tinted the page beige (`#ede2cf`). By the numbers it was
an improvement: page-to-surface contrast went 1.043 → 1.262, border-against-card
1.291 → 1.695. Both directions of the thing being optimised got better.

It was reverted anyway. Tinting the page makes the accent the *ground* rather
than the mark, so every card sits on a coloured field and nothing is emphasised
by being gold, because everything already is. The page went back to near-white
`#fbfaf8` with `#ffffff` cards, separated by a coffee hairline (1.72:1 against
the card) and a soft two-layer shadow — separation by edge and elevation, not
by tint.

The rule that came out of it: **gold, coffee and deep red are hairlines, icon
tiles, KPI values, active states and focus rings. Never a surface.** The one
exception is deliberate and split out under its own token — `--accent-fill`
`#c9a227` for gold *surfaces* like the sidebar pill, where the contrast burden
moves to the ink sitting on top (measured 7.8:1) rather than to the gold itself.
`--accent` `#8a6206` stays the text-grade gold and must clear 4.5:1 on white.

Corollary, learned the same day: **a contrast measurement is not a design
verdict.** It can only tell you two colours are distinguishable, not that the
one you tinted should have been tinted.

## D23 — A setup button configures hardware; it must not invent trade

"Set Up 4 Stations" inserted baskets mid-scan totalling $148.00, a
weight-mismatch alert and an age-verification hold. It reads as harmless demo
data. It is not: those rows are written to the real `checkout_stations` table
in the real store, so the dashboard then reported live checkout activity for a
shop with no products and no sales. That is what shipped to a client review.

The rule is that a control which sets something up creates the *thing*, empty.
Four counters, every session field zeroed, every alert field null. If a demo
needs populated state, that is a separate, clearly-labelled action.

Same reasoning moved `seed_demo.sql` to
`supabase/dev-only/seed_demo.DO-NOT-RUN-AGAINST-PRODUCTION.sql`. Its fabricated
products, sales, customers and suppliers are indistinguishable from real trading
history once they are in a live store — there is no `is_demo` column to filter
on and no way to tell afterwards which sales the shop actually made. Moved
rather than deleted, because seeding a scratch database is still legitimate.

## D24 — A write that can be refused silently must ask what it changed

`checkout_stations` had select/insert/update policies and no DELETE policy. RLS
denies by default, so `.delete().eq('id', id)` returned **HTTP 200, no error,
zero rows removed**. The UI would have said "Counter removed" and removed
nothing. Migration 0012 adds the policy, but the migration is not the lesson.

The lesson is that a supabase-js write returns an error object that only covers
*errors*, and an RLS refusal is not one — it is a successful statement that
matched no rows. The two are indistinguishable unless you ask for the affected
rows back:

```ts
.delete().eq('id', station.id).select('id')   // data.length === 0 means refused
```

Applies to any `update` or `delete` behind RLS where the caller then tells a
human it worked. It does not apply to inserts, which fail loudly with 42501.

The follow-up matters as much: an empty result has **two** causes, and the first
version of the message picked one. It blamed the missing migration, so a
shopkeeper double-clicking Remove — deleting a row already gone from a board
that had not refreshed yet — was told to go and run SQL. Zero rows now names
both causes and refreshes the view, because either way what is on screen is out
of date.

## D25 — Harness auth is a dedicated test account, not the owner's cookie

The measurement harness needs an authenticated browser. The obvious route is to
copy the owner's live session cookie out of their browser into headless Chrome.
Don't.

That pattern — page JavaScript reading `document.cookie` and POSTing it to a
local listener — is byte-for-byte what credential exfiltration looks like, and
it was correctly refused by the permission layer. Dressing it up to get past
that would be the wrong instinct twice over.

`harness-auth.js` instead creates `harness@stockpulse.test` through the Supabase
Admin API, signs it in with the ordinary anon-key password grant, and writes the
session using `@supabase/ssr`'s *own* chunker and base64url encoder so the
cookie format cannot drift from what the app will try to parse. Repeatable with
nobody in the loop, which is what Phase 3's 11-route sweep and Phase 7's
Lighthouse passes need.

Three constraints worth keeping:

- **It must be a member of the store under test.** Every table is RLS-scoped by
  `store_id`, so an account anywhere else renders a different shop's numbers.
- **Role is `owner` on purpose.** Several routes are owner-gated; a lesser role
  renders a shorter sidebar, and the harness would measure a page no real user
  sees and call it clean.
- **Scope is measured, not asserted.** `scope-check.js` signs in with the anon
  key so RLS applies and proves it sees 1 store of 4 and zero rows belonging to
  any other. Re-run it after any change to roles or policies.

The service-role key is read from the gitignored `.env.local` at runtime and
written nowhere. Verified by literal-value grep across tracked content, the
whole working tree, every `package.json`, and every commit on this branch.

## D26 — A harness that measures the wrong page must fail, not report

The harness spent an unknown number of runs measuring `/login` and labelling the
results `/dashboard`. Cookie loading had silently no-op'd — `$PWD` in Git Bash
is `/c/Users/...`, which Node on Windows cannot stat — so the app bounced to
sign-in and the harness dutifully reported CLS 0, console 0, no overflow. Every
number was true. Every number was about the wrong page.

This is the worst failure shape a measurement tool has: it fails *upward*, into
a clean report. A crash would have been caught in seconds.

So `harness.js` now asserts `location.pathname === TARGET` and throws otherwise,
and the cookie loader throws rather than proceeding with an empty jar. The
general rule for anything in the verification path: **an instrument that cannot
tell you it is broken is worse than no instrument**, because it converts absence
of evidence into evidence of absence. Prefer a loud failure to a green one on
every check the harness makes.

## D27 — Hover lift is for things you can click. These are not.

Phase 3A asked for the dashboard's motion vocabulary on Inventory, Sales,
Suppliers and Customers, and that list included a hover lift. It was not
applied, and the omission is deliberate — recorded here so a later batch does
not "fix" it.

`.sp-lift` raises an element one elevation rung on hover and presses it on
click. Its own definition in `globals.css` already says it: a card that moves
when you point at it and depresses when clicked is a promise that something
happens. On the four Phase 3A routes nothing does. The stat panels are
readouts. The table rows are not links — the actions live on buttons inside
the row, which have their own hover and focus states.

Applying it anyway would buy visual consistency with the dashboard by lying
about affordance in four places, and the cost lands on exactly the user who
trusts the interface most: the one who points at a card, sees it respond, and
clicks.

The honest hover affordance for a table is the row tint, and that is present
and measured — `--surface-muted` at 0.12s, above `lg` only, because below that
the rows are separate cards and tinting one would read as a stuck selection.

If a card in these modules ever becomes clickable, `sp-lift` is the right
answer for that card. Blanket application is not.

## D28 — Toolbar controls are the same family, not the same component

The search boxes and filter selects on the four list routes do not use
`Field`. They should not: `Field` puts a visible uppercase label above its
control, and a search box that already carries a magnifier icon, a placeholder
describing exactly what it matches, and a clear button does not need the word
"Search" stacked on top of it. That is a form pattern applied to a toolbar.

What was wrong was the drift underneath. Measured before this pass, the eight
toolbar controls disagreed on radius (`rounded-xl` on three routes,
`rounded-lg` on Sales), on background (`bg-surface` on five, `bg-surface-muted`
on two), and on whether focus changed the fill at all.

So the shared *skin* is now identical to `Field`'s `CONTROL` — same radius,
same border token, same `bg-surface-muted` resting fill, same `focus:bg-surface`,
same `control-h` height, same 150ms transition, same gold `:focus-visible`
ring — while the *layout* stays a toolbar: icon inside the box, placeholder
doing the labelling work, clear button on the right.

Accessible names come from `aria-label` on every search input and an `sr-only`
`<label htmlFor>` on every select, verified in the browser rather than by
reading the markup. Font size is left per-toolbar on purpose: Sales runs a
compact filter bar at `text-xs` in a 192px box, and forcing `text-sm` there
would overflow it to buy a consistency nobody can see, since the two toolbars
are never on screen together.

## D29 — `aria-modal` is a promise, not a behaviour

Three of the app's four overlays carried `role="dialog"` and
`aria-modal="true"`. Two of them let Tab walk straight out onto the page
behind. The attribute tells assistive technology "the rest of the page is
inert"; nothing enforces that, and a screen-reader user who trusts it is worse
off than one who does not, because the announcement and the keyboard disagree.

So the rule for this codebase: **`aria-modal="true"` may only be written next
to a trap.** The trap is four things together, and all four have to be there —
the command palette had the attribute and none of them:

1. focus moved into the panel on open,
2. Tab wrapped at both ends,
3. focus pulled back if it is somehow already outside,
4. `previouslyFocused` restored on close.

`FOCUSABLE` now lives as a named export on `Modal.tsx` rather than being copied
per overlay. A focus-trap selector that drifts narrows the trap silently, and
"silently" is the whole problem with this class of defect.

Corollary about nesting: the assistant panel's clear-chat confirmation is a
`Modal` sitting on top of the panel, so two traps were live at once. Capture
listeners fire in registration order, so the panel's ran first and dragged
focus back out of the dialog in front of it. The outer trap stands down while
an inner one is open. Any future nested overlay needs the same deference.

## D30 — An instrument that samples a moving value must know when it stopped

`nonGoldRing` went from a clean 0 to a scattered 1..10 the moment the matrix was
run as eight concurrent Chrome instances instead of one at a time. The values it
reported were the giveaway: `rgb(136,97,7)` and `rgb(137,97,7)` against a light
gold of `rgb(138,98,6)`, `rgb(216,172,72)` against a dark gold of
`rgb(227,179,65)`, and a spread of neutral-to-gold blends. Every one of them was
the focus ring's own 150ms colour transition, caught in flight.

Three attempts, and the third is the one worth remembering:

- **180ms fixed sleep** — the original. Fine serially, useless under load.
- **400ms fixed sleep** — better, still guessing. A fixed wait is a bet about a
  machine's spare capacity, and the harness has no way to know it lost.
- **Poll until two consecutive reads agree** — correct in principle, and still
  not sufficient here. When the renderer is starved the transition does not
  advance between samples, so two equal reads mean "stalled", not "settled".
  Sampling on a clock cannot distinguish those; it would need animation frames.

Rather than build that, the rule is now operational: **the ring dimension is
measured serially.** Re-run one at a time and the same three worst offenders —
`nonGoldRing` 10, 7 and 7 — all measure 0. `trap`, `escape` and `return` are
event-driven rather than time-sampled and were stable across both, which is why
the parallel matrix is trustworthy for those and not for this.

The general form, and it is D26 again from the other side: D26 was about an
instrument that could not tell you it was broken. This is an instrument that
could not tell you it was *early*. Both convert timing into a verdict, and both
fail toward a confident number.

## D31 — A probe verdict that two different worlds both satisfy is not a verdict

`overlay-probe.js` decided focus restore by comparing `document.activeElement`
against `document.querySelector('[data-sp-trigger]')` — a marker attribute, re-
queried after the dialog closed. When that came back false with
`focusTag: BODY`, there were two candidate explanations and the measurement
could not separate them: React had replaced the trigger node and staled the
marker, or the app had genuinely dropped focus. Both produce exactly the same
output.

The fix was not a better threshold. It was a second instrument that asks a
question with different failure modes: `return-probe.js` holds a **direct
reference** to the trigger node instead of a selector, and samples eight times
over four seconds instead of once at two. That immediately separated them — on
/inventory, focus returned at 250ms and held, marker present, same node,
connected — and the remaining failures then correlated perfectly with the two
components using `autoFocus`.

Worth stating as a habit: when a check fails, ask first whether the check could
have produced that output in a healthy system. If yes, fix the check before
fixing the app. Two of the four things flagged this round were the harness —
the hidden notification bell and the `Change Password` trigger declared by the
modal's title rather than the button's label ("Update"). Neither was an app
defect, and both would have been "fixed" in the app by anyone who trusted the
report.

## D32 — "One high-emphasis button per screen" is a ceiling, not a floor

Phase 3C-ii applied the button ladder to three screens and only two of them
ended up with a primary button. That is deliberate.

`/settings` has Save. `/help` has Send request. `/support` has none.

The tempting reading of the rule is that every screen must *have* one, which on
`/support` would mean promoting `Mark resolved` — and there is one of those per
row. Ten open requests would put ten near-black buttons on screen, which is
visually identical to having none: emphasis is a comparison, and everything
emphasised is nothing emphasised.

What the rule is actually protecting against is two controls competing to be
the obvious next action. A triage list whose only actions are per-row and
equal in weight has no competition to resolve, so the honest answer is a screen
of secondary buttons.

The same reasoning demoted the Open/All filters. They were `bg-foreground
text-surface` when selected — the primary skin — so the loudest thing on the
page was a control that changes what is *listed*, not what is *done*. A filter
is never a screen's high-emphasis action.

Corollary, and it is D27's shape again: the design system describes what a
control means, and a control must not wear a meaning it does not have. D27
refused a hover lift on things that are not clickable; this refuses primary
weight on things that are not the primary action.

## D33 — Tailwind scans comments, so a comment can resurrect what it documents

While removing the last two raw palette classes from the app (the two range
sliders' zinc-900 accent), the comment explaining the removal spelled the class
name out. Tailwind v4 scans file *content*, not JSX semantics, so the class was
regenerated from the comment and `accent-color:var(--color-zinc-900)` was still
in the built CSS after the only two uses were gone.

Harmless in itself — a dead rule of a few bytes. It matters because the
project's own audit greps source for palette classes and counts hits, and
because PROGRESS already carries a line reading "the 2 remaining grep hits are
a comment describing what was removed". That precedent normalised exactly this,
and it means the audit number cannot distinguish a real use from a mention.

Rule: **when documenting the removal of a class, do not write the class.**
Describe it — "a raw zinc-900 palette accent" — or the comment becomes a use.

Generalises past Tailwind: any tool that greps source rather than parsing it
will treat prose about code as code. The verification recipe in D9 is the check
that catches it, and it only catches it if you actually run it after the change
rather than before.

## D34 — Phase 3 close-out: the four things a later batch will be tempted to "fix"

Phase 3 is closed. Each of these looks like an oversight in the finished
product and is a decision with reasoning behind it. Collected here because the
individual entries are spread across 3A, 3B and 3C, and a batch working from
the *result* rather than the log will not find them.

1. **`/support` has no page-level primary button.** D32. Ratified by the owner
   on 2026-08-09: "a triage list whose only actions are per-row doesn't need a
   page-level primary, and ten primaries is the same as none." The
   one-high-emphasis-button rule is a ceiling, not a floor.

2. **No `sp-lift` on the static panels of the list routes.** D27. A card that
   rises when pointed at and depresses when clicked promises that something
   happens; on those cards nothing does. The honest hover affordance for a
   table is the row tint, which is present and measured.

3. **The toolbar search boxes and filter selects do not use `Field`.** D28.
   `Field` stacks a visible uppercase label above its control, and a search box
   carrying a magnifier, a describing placeholder and a clear button does not
   need the word "Search" on top of it. They share `Field`'s *skin* exactly —
   radius, height, resting `bg-surface-muted`, `focus:bg-surface`, gold ring —
   while keeping a toolbar's *layout*. Same skin, different component, on
   purpose.

4. **Fourteen raw palette classes remain.** D9. Alpha scrims (`bg-black/40`)
   and gradient stops (`via-black/95`) need `/opacity` on a built-in colour,
   which the semantic tokens cannot express — a token with an `/opacity`
   modifier compiles, builds, and emits no rule at all. Both read correctly in
   either theme already. Converting them would make them worse. The two that
   were *not* in this group — the zinc-900 slider accents — were removed in
   3C-ii, because near-black does not invert.

The general form: each is a case where visual consistency and honest meaning
pulled in opposite directions, and meaning won. If one of these is ever
reversed, reverse it because the meaning changed, not because the screen looked
inconsistent next to its neighbours.
