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

## D35 — products.category stays text; the FK is composite

Migration 0013 makes categories data. The obvious modelling is
`products.category_id uuid references categories(id)`. It was not done, for
three reasons that are all about what already reads that column:

- `public.sales_category_breakdown()` (migration 0004) groups by `p.category`
  and returns it as `text`. A uuid changes that function's contract and every
  caller of it.
- CSV import and export round-trip the category as a readable word. Exporting
  uuids would make the file useless to the shopkeeper it is for.
- Every existing `products` row stays valid with no data rewrite.

So the column keeps the slug and gains
`foreign key (store_id, category) references categories(store_id, slug)`.

**Carrying `store_id` into the key is the part that matters.** Slugs are only
unique per store, so a plain FK on `slug` could not express "this store's
category" — and a composite key makes it structurally impossible for one shop's
product to reference another shop's category. That is a multi-tenant invariant
enforced by the database rather than by remembering to write `.eq('store_id')`.

**The slug is immutable; rename changes `name` only.** `name` is what people
read, `slug` is identity. Renaming "Frozen" to "Frozen Foods" rewrites no
products rows, so a relabelling cannot shift a shop's historical grouping.
`on update cascade` is set anyway as a safety net for a slug change the app
never makes.

`on delete restrict`, not cascade and not set null: cascading would delete a
shop's products because somebody tidied a list, and set null is unavailable —
the column is `not null`.

## D36 — /settings/categories is canManage(), and that is why it is its own route

The plan put category management "in Settings". Taken literally — a card on
`/settings` — it would have shipped a broken link.

`/settings` is owner-only (`page.tsx` redirects, `NAV_ITEMS` says
`roles: ['owner']`), because 0002 reserves store settings and hiring to the
owner. Categories are not in that group: they classify products, and adding a
product is `can_manage()` work. The "Manage categories" link on the product
form is reached by managers, so a card on `/settings` would bounce half its
audience to `/dashboard` for something their role is allowed to do.

So it is a sibling route with its own guard — D15's `/staff/team` pattern with
the roles inverted (there the child was narrower than the parent; here it is
wider) — and `/settings` keeps a signpost card, for the same reason the "Your
team" card exists: an owner who has used the app will look there first.

Measured rather than asserted, by flipping `ROLE` in `harness-auth.js`:

| Route | staff | manager | owner |
|---|---|---|---|
| `/settings` · isOwner | redirect | redirect | renders |
| `/audit` · isOwner | redirect | redirect | renders |
| `/customers` · canManage | redirect | renders | renders |
| `/settings/categories` | redirect | renders | renders |

It tracks the `canManage` control exactly and diverges from both `isOwner`
controls, which is the shape the guard claims to have.

Deliberately **not** added to `lib/nav.ts`. NAV_ITEMS drives the sidebar and
the command palette, and `/staff/team` — the same kind of sub-screen reached
from its parent — is not in it either.

## D37 — the app ships ahead of migration 0013

`getStoreCategories` falls back to the five built-in categories when the table
is missing (42P01 / PGRST205), exactly as `/staff` treats a missing
`staff_leave` (D21). Without that, deploying this branch against an unmigrated
database breaks `/inventory`, `/dashboard`, `/sales` and `/reports` at once —
and operating rule 4 says every commit leaves the branch deployable.

The fallback is the five values the old CHECK allowed, in the order the product
form listed them, so the day the migration runs nobody's list changes.

Two things keep this from being a silent lie. The fallback is narrow — only a
missing table, never "any error", because D21's `staff_leave` bug was exactly
an over-broad catch that rendered an empty page with nothing saying why. And
the management screen renders a warning naming the file to run, with its own
controls disabled, so the one screen whose entire job is editing the list
cannot quietly appear to work.

## D38 — Confirm the probe before believing it. Standing rule.

Raised by the owner on 2026-08-09 after the fifth consecutive round in which a
measurement flagged a defect that turned out to be in the measurement.

**The rule: when an instrument reports a defect, the first question is not "how
do I fix the app" but "could a healthy system have produced this output?" If
yes, fix the instrument first.** It is not a suggestion to be sceptical in
general; it is a specific ordering, because the failure mode is that a false
report gets "fixed" in the app and the real bug is now buried under a change
nobody needed.

The five, in order:

| Round | Flagged | Actually was |
|---|---|---|
| 3C-i | `return=LOST` on the notification bell | The probe was clicking a `display:none` button — `el.click()` fires React's handler on a hidden element quite happily, so it "opened" a 0x0 popover at 390px and walked fourteen tab stops on the page behind |
| 3C-i | `NO TRIGGER` for Change Password, four runs running | The overlay was declared by the modal's *title*; the button reads "Update" |
| 3C-ii | `offenders=1` on `/settings` | `closest('.sp-e1')` matches the element itself, so the theme control's active segment became its own card. The tell was the symmetry: `right +12px left +12px` is exactly its own `px-3` |
| 4 | staff getting HTTP 200 on the owner-only `/settings` | A Server Component `redirect()` returns **200 with a `NEXT_REDIRECT` payload** — the shell is already flushed. Worse, the follow-up check grepped the body for the page title and matched the `<title>` and `<meta description>` Next emits *before* the redirect resolves |
| 4 | the product modal never opening | React had not hydrated, so a CDP click landed on a button with no handler attached |

**What the five have in common** is that each verdict was satisfied by two
different worlds and the instrument could not tell them apart (D31), or the
instrument sampled before the system had settled (D30). So the practical test
is: *name the healthy scenario that produces this exact output.* If you can
name one, the check is not yet a check.

Three habits fall out of it, and all five would have been caught by one of them:

1. **Carry a control.** The role matrix only became trustworthy when
   `/customers` (canManage) and `/settings` + `/audit` (isOwner) were measured
   in the same run. A number with nothing to compare against is a number.
2. **Assert on something only the real outcome can produce.** A page title
   comes from `metadata` and is emitted whether or not the page renders; "Add a
   category" exists only if the component mounted.
3. **Wait for a condition, never for a duration.** D30 is the same lesson from
   the timing side. `react hydrated: true` is a fact; `sleep(2000)` is a bet
   about how fast the machine is.

**This generalises past probes to any stale artefact.** The same round found
`PROGRESS.md` asserting `0009_product_images_bucket.sql` was unapplied when it
had in fact been applied — and that claim was then copied forward into
`CLAUDE.md` on the strength of the document alone. A doc is an instrument too.
Measure the system, not the note somebody left about it.

## D39 — 3D is CSS transforms, and the styles ship with the component

Phase 5 approved "ONE decorative element, on the dashboard only. Pure CSS 3D
transforms preferred. If you believe WebGL is genuinely required, stop and ask."

**WebGL was not required and nothing was installed.** A wireframe crate is six
bordered rectangles under `transform-style: preserve-3d`. three.js would have
been ~150 KB gz to draw six rectangles, and the whole point of deferring old
Phase 6 was that a decoration must not cost a rendering library. There was
nothing to ask about, so nothing was asked.

Three things about the shape are deliberate and will look like over-engineering
to a later reader:

1. **The static version is the default, not the fallback.** `CrateMark` renders
   an inline-SVG isometric crate on first paint for every device, and only
   swaps in the animated one after `requestIdleCallback` on a machine that has
   not asked for less work. That is D18 again — the resting state is the
   correct one — and it is also what makes "must not block LCP" true by
   construction rather than by measurement: nothing about the 3D is requested
   until the browser says it is idle. Measured: FCP 2496ms, crate present at
   3071ms.

2. **The gate is biased towards not animating.** Reduced motion, Data Saver,
   `deviceMemory <= 4`, `hardwareConcurrency <= 4`. Every one of those signals
   is optional in some browser, so each is checked before it is trusted. Being
   wrong in the cautious direction costs a drawing nobody notices; being wrong
   the other way spends a cheap phone's battery on decoration.

3. **The CSS lives inside `Crate3D.tsx`, not `globals.css`.** Two reasons, and
   the second is the real one. `globals.css` is downloaded by every route
   including `/login`, and a signed-out visitor should not pay for a decoration
   on an authenticated page. More importantly, "removable in one commit" has to
   be true of the styles as well as the markup — D33 records a dead rule that
   outlived its only two call sites because it was spelled out somewhere
   nobody was looking. Delete the file, the style goes with it.

Measured cost: **+3.8 KB gz across all chunks, +0.0 KB on the shared bundle**,
of which the 3D is a **0.8 KB gz chunk that is a separate file**.

## D40 — A state carried only in colour moves to tempo, not to a second colour

The greeting's pulse used `--warning` when something needed attention and
`--success` when it did not. Phase 5 required the figure be coffee and gold
only, which appears to force a choice between the brief and the signal.

It does not. The signal moved into **duration**: 1.6s when something needs
attention, 2.8s when it does not, both inside the 3s ceiling.

That is the better encoding regardless of the brief, and worth stating as a
rule rather than a one-off. A state encoded in hue alone is invisible to a
colour-blind reader and to anyone glancing at a screen in sunlight; the same
state encoded in rhythm is visible to both. The app already said it in words
directly to the left of the mark — "3 items low on stock" — so the mark was
never the accessible carrier of that information anyway. It was decoration
wearing a meaning, which is the thing D27 and D32 both refuse.

Corollary for future decoration: if removing a colour from a component appears
to destroy information, check whether the information was ever really there.
Usually the words beside it were already doing the work.

## D41 — A legal document's contents list is generated, never written

`LegalPage` takes `sections: {id, title, body}[]` and renders the table of
contents and the section headings from that one array. It would have been
quicker to write a list of anchors by hand above the prose.

Two parallel lists that must agree is the exact shape this codebase has already
been bitten by twice: `lib/nav.ts` drifted from the route guards and a manager
got an empty sidebar, and `ROLE_STYLES` drifted from the role list and a badge
rendered `undefined`. A dead anchor in a privacy policy is worse than either,
because the reader who clicks "Retention" and lands nowhere concludes the
document is as unmaintained as the link.

Generating both from one array makes the failure impossible rather than
unlikely. The test that every anchor resolves to a real id still runs — 27
anchors across the two documents — but it now checks a property the code cannot
violate, which is the right kind of test to have.

Corollary, and the reason this is a decision rather than a detail: **prose is
data too.** The instinct to write a legal page as one long JSX blob is what
makes it undiffable, unlinkable and impossible to test. Sections as data cost
nothing and made the whole document machine-checkable.

## D42 — An integration is a data export, and the policy is where that surfaces

Drafting the privacy policy meant listing every place data leaves the system.
That list turned out to contain something no phase had thought about: the AI
assistant sends store data to Google.

Nobody hid it. The phase that built the assistant was thinking about streaming,
tool declarations and role-gating `OWNER_ONLY_TOOLS` — all of which it did
carefully — and simply never asked "and where does this data physically go?"
The privacy policy is the first artefact in the project whose job is to ask
that question about every dependency at once, and it found the answer in about
five minutes of reading imports.

The rule going forward: **when adding a dependency that transmits anything,
name it in the policy in the same change.** Not later, not as a docs task. If
it receives user data it is a sub-processor, and the disclosure is part of
shipping the feature rather than an afterthought.

The corollary is why this sits in DECISIONS rather than FOUND-ISSUES: a privacy
policy written honestly is a genuine audit of the system's boundaries, and it
is worth re-reading it whenever a new integration lands. It is cheaper than a
security review and catches a different class of thing.

## D43 — A CLS total is not a finding. The sources array is.

Three phases carried "CLS 0.0006 on /dashboard at 1440, not isolated" forward
as an open item. One run reading `entry.sources` answered it completely, and
found a 0.21 the harness had been reporting as 0.

The rule: **when a layout-shift number needs explaining, read the sources
array, not the total.** Each `layout-shift` entry carries the nodes that moved
with their rects before and after, which turns "something shifted" into "the
h1 grew by one line and these four blocks moved down 31px" — a sentence with a
fix in it.

Two mechanics that make the difference between working and not:

1. **Install the observer before document start.** `buffered: true` is not
   enough; `Page.addScriptToEvaluateOnNewDocument` is. The harness attached
   after navigation and intermittently missed the hydration correction
   entirely, which is why the same page measured 0.21 in one theme and 0 in the
   other within a single batch. That was never a theme difference.
2. **Keep the node description, the text and both rects.** The rects are what
   identify the mechanism: five elements each moving `+31px` in `y` is a line
   of text appearing above them, and nothing else.

This is D30 inverted and worth pairing with it. D30's instrument reported a
value that was too high because it sampled a transition mid-flight. This one
reported zero because it started sampling too late. Both turn timing into a
verdict, and both fail toward a confident number — one alarming, one
reassuring. **The reassuring direction is more dangerous**, because nobody
investigates a zero.

## D44 — Deterministic geometry beats reserved space

The greeting shift had two available fixes.

**Reserve space:** give the `<h1>` a `min-height` of two lines below `sm`, so
the wrap has somewhere to go. Correct, one line of CSS, and wrong — it puts a
gap under every short name for the sake of the long ones, on the width where
vertical space is scarcest.

**Make the geometry not depend on the string:** put the name on its own line
below `sm`. The heading is then two lines whether it says "Welcome back" or
"Good afternoon", so the hydration correction changes the words without
changing the layout at all. There is nothing to reserve because nothing moves.

The general form, and it applies well past this heading: **when content that
arrives late changes a layout, prefer making the layout independent of the
content over making room for the content.** Reserved space is a guess about
the largest case and is visibly wrong in every other case. Independence is
exact in all of them.

It also happens to read better on a phone, which is the usual reward for
fixing the cause rather than padding around it.

Corollary about *why* the correction exists at all, since a later reader may be
tempted to delete it: the greeting cannot be computed on the server, because
the server does not know the reader's clock. `useSyncExternalStore` with a
neutral server snapshot is the correct pattern. The bug was never the
correction — it was that the two strings had different line counts.

## D45 - Reproducible is not correct

The Phase 7B axe sweep reported 87 violations twice, byte-identical. A
single-route run on the same build reported a different answer, also twice.
Both were reproducible; one was wrong.

The sweep reused a named Chrome --user-data-dir, so localStorage - theme
included - survived between runs. Deleting the profile changed the total from
87 to 12 with no code change.

A stale instrument gives the same wrong answer every time, and the second run
reads as confirmation. Repeating a measurement tests its determinism, not its
truth. What separates them is a claim the data itself can contradict: here,
fgColor #6b6157 on bgColor #14100c is a foreground from one theme on a
background from the other, which cannot occur in a correctly rendered page.
That was visible in the first output and should have been the first question.

Two cheap rules follow: use a throwaway browser profile per run, and assert on
the data rather than the count. A count can only be compared with another
count; values carry their own plausibility.

Sits alongside D38 - that rule says confirm the probe before believing a
defect. This one says a probe agreeing with itself is not that confirmation.

## D46 - Report an instrument's variance before reporting its numbers

Lighthouse mobile on this machine returned perf 0, 30 and 33 for the same build
and route - a 7x spread on LCP. Desktop returned 96, 92, 94 with LCP inside
100ms. Same tool, same session; one half is evidence and the other is noise.

So Phase 7B reports desktop Lighthouse as measurement and mobile as indicative
only, and makes no before/after claim from the mobile figures. The greeting
improvement is evidenced structurally instead - H1.sp-title is no longer an LCP
candidate, and "Welcome back" is absent from the served HTML - because a
structural fact does not need a stable machine to be true.

The rule: measure an instrument's spread before quoting its output, whenever a
number will justify a change. Three runs is enough to tell evidence from noise,
and costs less than defending a fabricated improvement later. A single
Lighthouse score quoted without its variance is an anecdote wearing a number's
clothes.

Corollary: prefer facts a slow machine cannot distort - which element is the
LCP, which node shifted, whether an attribute is present - over composite
scores computed under simulated throttling.

## D47 — The demo account is an owner, and the trade-off is published

A recruiter visits once. `staff` renders four sidebar entries and bounces off
/settings, /audit, /reports, /customers and /suppliers; `manager` still loses
/settings and /audit. Either shows a reviewer a smaller product than the one
that was built, and — the part that decides it — leaves them with no way to
know what they were not shown.

So the public demo is an owner, and the cost is stated rather than hidden:
anyone who reads the README can edit that store's data. Three things bound it,
and "nobody will bother" is not one of them:

1. RLS scopes the account to one store. Measured, not asserted: the same
   role in the same store sees 1 store of 4 and zero rows belonging to any
   other (D25's `scope-check.js`).
2. Nothing in it is real. Every row came from the acceptance seed; the staff
   are `@stockpulse.test` addresses that cannot receive mail.
3. Damage is one command from undone, because the seed is idempotent on
   derived ids.

If this ever holds anything real, the answer is a read-only role enforced in
RLS — not a longer password on an owner account.

The credentials live in exactly one script, which resets them on every run, so
the README, the login screen and the database cannot drift apart. A README that
lies about how to sign in is worse than no README.

## D48 — Seed data stays, and stays labelled

D23 said a setup action creates the thing empty and only a clearly-labelled
seed may invent trade. Phase 9 keeps that seed in place rather than tearing it
down, which looks like a reversal and is not.

The reason D23 exists is that fabricated rows became indistinguishable from
real trading history in a live client store. Neither half of that applies here:
this store is not a client's, and the rows are not indistinguishable — every
seeded product carries an `ACC-` SKU that survives into the UI and every
export, the staff addresses cannot receive mail, and the folder that wrote them
says so in its first line.

What D23 forbids is unlabelled invention. What this is, is a labelled demo that
a reviewer can tell apart from real data in one glance at a SKU column. The
teardown exists, dry-runs by default, and has deliberately never been run.

## D49 — Correcting D39: the landing hero has been three.js all along

D39 says "WebGL was not required and nothing was installed." Read today, that
sentence describes the whole application. It does not, and anyone trusting it
would be wrong about what this app ships.

**What D39 is actually about:** `CrateMark`, the ONE decorative element on the
dashboard that Phase 5 approved. That element is pure CSS `preserve-3d`, no
library, and the reasoning in D39 stands unchanged for it.

**What was true at the same time and went unrecorded:** the marketing landing
page's hero shelf, `components/marketing/ThreeGroceryVisual.tsx`, is a
`THREE.WebGLRenderer` scene, and `"three": "^0.185.1"` is a real dependency in
`stockpulse/package.json`. Measured: the emitted three.js chunk is 548,102
bytes raw, 135,992 gzipped — 133 KB gz, which is close to the "~150 KB gz"
D39 used as its argument against installing it.

So the honest summary is: the dashboard decoration avoided WebGL on purpose,
and the landing hero uses WebGL. Both are true; only the first was written
down, and the way it was written implied the second could not exist.

Two things follow, and both are done:

1. The record is corrected here and in PROGRESS.md rather than left for a
   reader to trip over.
2. The gap D39's reasoning would have caught is now closed — see D50. The
   landing hero was doing exactly what D39 warned about: paying a rendering
   library's cost on every visit, for a decoration.

The general lesson is the one D38 already states about stale artefacts: a
decision document is an instrument, and an instrument that was accurate about
a narrow thing will be read as a claim about a broad one.

## D50 — A hero decoration must not cost every visitor a rendering library

The hero shelf imported three.js statically and started a
`requestAnimationFrame` loop for every visitor. No `prefers-reduced-motion`
check, no Data Saver check, no core-count check, and no static version to fall
back to — while `CrateMark`, a far cheaper element, had all four.

Measured before the fix: the three.js chunk was in the landing page's initial
JavaScript. After: it is in its own chunk, absent from the initial HTML
(`grep -c` on the served document returns 0), and fetched only after
`requestIdleCallback` on a machine that opted in.

**The triggers, and why each one.** All are read once, on mount, biased
towards NOT animating — being wrong cautiously costs a drawing nobody notices,
being wrong the other way spends a stranger's battery and data on decoration:

| Trigger | Falls back when |
|---|---|
| `prefers-reduced-motion: reduce` | the user asked the OS for less motion |
| `navigator.connection.saveData` | Data Saver is an explicit request to transfer less |
| `navigator.deviceMemory <= 4` | 4 GB or less |
| `navigator.hardwareConcurrency <= 4` | 4 cores or less |
| no WebGL context | asking is cheap; a scene that silently renders nothing is not |
| SSR (`typeof window === 'undefined'`) | the server cannot know, so it assumes less |

The static state is the DEFAULT and not a spinner: an inline SVG of the same
shelf with the same products, rendered on first paint for everyone, replaced
only after idle. That is D18 and CrateMark's shape reused rather than a second
pattern invented.

Verified with a control (D38): the same build, twice, differing only in the
emulated media feature.

    normal   early{svg} late{canvas}  CLS=0  threeChunkFetched=true
    reduced  early{svg} late{svg}     CLS=0  threeChunkFetched=false

## D52 — A security header written for the app as it was is a silent feature-killer as the app grows

Numbered D52, not D51: the unmerged `hero/photo-shelf` branch already drafts a
D51, and two entries sharing a number is a worse problem than a gap.

`next.config.ts` sent `Permissions-Policy: camera=(), microphone=(),
geolocation=()` under the note "this app needs none of these devices, so deny
them". **That note was true when it was written.** It was correct hardening for
the app as it then existed, and nothing about the decision was careless.

Then voice input shipped. Then the barcode scanner shipped. The header did not
change, because nothing makes a header change when a feature arrives — and `()`
is an *empty allowlist*, not a default, so both features were denied their
device before the browser asked anyone anything. `getUserMedia` rejected with
`NotAllowedError`, which is the same error a user-denied permission produces.

**The rule: when adding a browser capability — camera, microphone, geolocation,
clipboard, USB, bluetooth, screen capture — check `Permissions-Policy` in the
same change, before the feature is called broken.** One command answers it:

    curl -sI https://stock-pulse-mu.vercel.app/ | grep -i permissions-policy

**Why this earns an entry rather than a line in FOUND-ISSUES.** It cost several
sessions of device-level debugging that could never have found anything. Every
hypothesis was about the device — Android app permissions, Chrome's per-site
permission, the autoplay policy, user activation, a React `muted` attribute —
and each was plausible, checkable and irrelevant. A real bug in the scanner's
error handling was found and fixed along the way, and reported as the likely
cause; it was not the cause. The evidence that mattered sat in one response
header the whole time, and it took the owner noticing that **two unrelated
features on two different origins were failing identically** to point at it.

That shape is the lesson, and it generalises well past this header: **when two
independent things fail the same way, stop debugging either one.** A shared
symptom implies a shared cause, and a shared cause lives in what they have in
common — the document, the origin, the response, the platform — not inside
either feature. D38 says confirm the probe before believing a defect; this says
confirm the *environment* before believing either feature is at fault.

Corollary about the comment, which is what made this durable: the old note
explained the *policy* ("we need none of these") rather than the *mechanism*
("`()` denies it to ourselves, and getUserMedia will reject"). Anyone checking
whether the header could break the camera would have needed to already know the
mechanism to see the problem. The replacement spells out what `()` does, so the
next person does not have to.

## D53 — A teardown must delete what it created, not what is newest

The Phase 4 probe cleaned up after itself by deleting the most recent sale, on
the reasoning that it had just created a sale, so the newest one was surely it.

On a run where the sale was never created — a predicate had failed and the
probe clicked Complete with an empty cart — "the newest sale" was a real seeded
row. It was deleted along with its line items
(`165a1f77-a2e7-5818-be52-dce048fe9837`, `sale:375`).

**The rule: capture the identifiers that exist BEFORE the run, and delete only
what is not in that set.** Never `order=created_at.desc&limit=1`, never "the
last one", never a timestamp window. Those all encode a belief about what
happened; a diff measures it.

```js
const before = new Set((await listIds()).map(r => r.id))
// ... do the thing ...
const mine = (await listIds()).map(r => r.id).filter(id => !before.has(id))
```

**This is D24 seen from the other side, and the pair is the point.** D24 says a
write that can be silently refused must ask how many rows it changed, because
"I asked for it" is not evidence it happened. This says a delete must ask which
rows it created, because "I created something" is not evidence about *which*.
Both failures come from substituting an intention for a measurement, and both
are invisible in the happy path — the recency teardown worked perfectly on
every run that did create a sale.

Two corollaries worth keeping:

- **The dangerous run is the one where the operation failed.** Cleanup code is
  written while thinking about success and executed most consequentially after
  failure. A teardown whose correctness depends on the run having worked is not
  a teardown.
- **Seed data being "just demo data" is not a licence.** It is somebody's
  reproducible fixture; the acceptance seed exists precisely so a screenshot
  can be reproduced. Losing one row of it is cheap, but the habit that lost it
  is the same habit that would drop a customer's sale.

## D54 — A migration is done when its file is on main, not when it runs

This has now happened twice, which is what makes it a rule rather than a slip.

`0014_product_barcode.sql` was applied to the hosted database while its file sat
on an unmerged branch. For the length of that review the live schema had a
`products.barcode` column that `main` knew nothing about. `0015_products_staff_policy.sql`
repeated it exactly: the staff UPDATE policy was dropped on the live database
while the only record of why sat on an unpushed branch.

**The rule: applying a migration is half the change. It is not finished until
the file is on `main`.** Until then the live schema and `main` have silently
diverged, and that divergence is invisible to every check this project runs —
`tsc`, `eslint` and `next build` are all green on a branch that does not
describe the database it will deploy against.

Why it is worse than it sounds:

- **Rolling back the branch does not roll back the database.** Closing the PR
  leaves the schema changed with nothing in the repository explaining it.
- **The next migration is numbered from `main`.** Two branches that each apply
  a change while unmerged both believe they are `00NN`, and the second to land
  quietly collides with the first.
- **It defeats the project's own instruction to measure rather than read.**
  CLAUDE.md says to check what is applied by querying the database. That works
  only while a file exists to compare against; a schema change whose file is on
  nobody's branch cannot be reconciled at all.

Practical form: apply the SQL, run the post-apply checks, then push and land the
file **in the same sitting**. If a change is too risky to land immediately, it
is too risky to have applied — write it as a proposal, get it reviewed, and
apply it when it can be merged.

Corollary about filenames, learned the same round: `0015` was written as
`..._PROPOSAL.sql` precisely so a reader scanning the folder would know it had
not been applied. The moment it was applied that name became a falsehood a
reader would believe without opening the file, so it was renamed in the same
commit. A name that encodes state has to be maintained like state.
