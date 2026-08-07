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
