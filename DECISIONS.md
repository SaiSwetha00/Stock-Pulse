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
find .next/static -name "*.css" -exec grep -oE "\.the-class-name" {} \;
```

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
