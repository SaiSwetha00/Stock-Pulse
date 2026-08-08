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
