# FOUND-ISSUES

Bugs found during audit that were **not** on the master-prompt list. Nothing here has been
fixed — each is logged with the phase whose scope it falls in.

Severity: **S1** breaks a feature · **S2** visibly wrong · **S3** cosmetic / latent

---

## S1 — Manager role badge renders an `undefined` class

`stockpulse/components/settings/SettingsClient.tsx:15-18, 331`

```ts
const ROLE_STYLES: Record<string, string> = {
  owner: '...',
  staff: '...',
}
// used as: className={`rounded-full ... ${ROLE_STYLES[s.role]}`}
```

`manager` has no entry, so a manager row in Staff Management emits
`class="rounded-full px-2.5 py-1 text-xs font-semibold undefined"` — the badge loses its
background entirely. This is the same manager-role drift the codebase already documents in
`lib/nav.ts`: migration 0002 added `manager`, and this lookup table was never updated.

Scope: Phase 3 (roles) — fix there.

## S2 — Theme toggle buttons lose their active styling (missing space in template literal)

`stockpulse/components/settings/SettingsClient.tsx:174-176, 184-186`

```ts
className={`control-h rounded-md px-3 text-sm font-semibold${
  theme === 'light' ? 'bg-surface shadow-sm' : 'text-muted'
}`}
```

No space before the interpolation, so the emitted class is `font-semiboldbg-surface` /
`font-semiboldtext-muted`. Both the weight and the active-state background are silently
dropped — the Light/Dark selector gives no visual indication of which one is active.

Scope: Phase 1.4 (Settings).

## S2 — AI assistant speaks every reply aloud with no way to stop it

`stockpulse/components/ai/AIAssistantPanel.tsx:80-84`

Every completed response is passed to `window.speechSynthesis.speak()` unconditionally.
There is no mute control anywhere in the panel — the master prompt's "mute toggle currently
does nothing" is understating it: the control does not exist, and the speech cannot be
disabled. Also fires regardless of `prefers-reduced-motion` / OS accessibility settings.

Scope: Phase 1.2 (AI Assistant).

## S2 — Two unrelated visual identities in one product

The landing page (`components/marketing/*`, own `landing.css`, `--sp-gold` tokens) is dark
gold-on-black. The signed-in app (`app/globals.css`) is a light warm-neutral surface with a
pine-green accent (`--accent: #1f6f4a`). A user who signs up crosses from one design system
into a different one at the login boundary.

Scope: Phase 4 — this is the actual root cause of "looks unfinished", more than the type
scale is. Flagged for discussion before Phase 4 starts.

## S3 — Seven dead footer links

`stockpulse/components/marketing/Footer.tsx:166, 171, 176, 181, 203, 206, 209`

All `href="#"`. Includes Privacy and Terms.

Scope: Phase 7.9.

## S3 — Shift blocks bypass the design tokens

`stockpulse/components/staff/StaffScheduleClient.tsx:49-60`

`shiftStyle()` uses raw Tailwind palette classes (`bg-red-50`, `border-red-200`,
`bg-emerald-800`, `text-emerald-200`) rather than the semantic tokens every other module
uses. These will not follow dark mode correctly and will not pick up the Phase 4 palette.

Scope: Phase 2 (Staff) — the colour system there is being rebuilt anyway.

## S3 — Theme has two sources of truth

`stores.theme` (database) and `localStorage['sp-theme']` (what actually renders, read by a
blocking script in `app/layout.tsx`). `SettingsClient.applyTheme` writes both, but they can
diverge across devices — the DB value is effectively decorative.

Scope: Phase 1.4 (Settings) — decide which one wins.

## S1 — Staff invitations cannot actually be delivered (blocks Phase 3)

`stockpulse/app/auth/actions.ts:87` — `inviteStaff`

The invite system itself is complete and correct: owner-only guard, `store_id` checked
against the requester's own, role re-validated server-side because the insert uses the
admin client and bypasses RLS, correct `redirectTo` handling for the implicit-flow
fragment, profile insert with `invited: true`, audit entry. `AddStaffModal` already offers
manager and staff.

What fails is delivery. The project uses Supabase's built-in SMTP, which permits only a
few messages an hour and which Supabase documents as testing-only. Invitations are sent
and then throttled, so the owner sees an opaque 429 and reasonably concludes the feature
is broken.

This is a configuration gap, not a code gap — worth stating plainly, because the obvious
reading is "the invite system doesn't work" and the obvious fix is to rebuild something
that is already right.

Resolution: configure custom SMTP (Resend recommended; free tier covers this volume) under
Project Settings → Authentication → SMTP Settings, and add every invite return origin under
Authentication → URL Configuration. Documented in `stockpulse/.env.example`. `inviteStaff`
now detects the rate-limited case and names the layer that failed.

Scope: Phase 3 prerequisite. Code side done; the dashboard setup is the store owner's.

## S3 — `user_preferences.notify_*` columns are unused

`stockpulse/supabase/migrations/0007_ai_threads.sql`

0007 created `notify_critical_stock`, `notify_daily_digest` and `notify_supplier_updates`
ahead of Phase 1.4. Phase 1.4 deliberately did not use them: the Settings toggles write to
`stores.critical_stock_alerts` and friends, which are store-level policy, and repointing
them at a per-user table would silently change what they mean.

The columns are the right home for per-person *delivery* preferences once that UI exists.
Until then they are dead schema, and someone will eventually wire the wrong one.

Scope: whichever phase adds per-user notification delivery. Drop them if it never does.

## S2 — No Privacy Policy or Terms of Service exist

`stockpulse/components/marketing/Footer.tsx`

The footer linked to both with `href="#"`. The dead links are gone, but the
underlying gap is real: this app stores customer names, emails, phone numbers
and purchase history, and it is being prepared for paying customers. Shipping
without a privacy policy is a legal exposure, not a missing page.

Deliberately not written by an agent — this needs a human who knows the
jurisdiction and what the business actually does with the data.

Scope: before the first paying customer.

## S3 — Footer asserts a corporate entity that may not exist

`stockpulse/components/marketing/Footer.tsx` — "© 2026 Stock Pulse Technologies
Inc. All rights reserved."

Left as-is: whether to incorporate, and under what name, is the owner's
decision, not a copy fix. Flagged because claiming "Inc." while unincorporated
is a misrepresentation in some jurisdictions.

Scope: owner decision.

## Note — three modules are outside the master prompt's list of eleven

`/monitoring` (Live Operations Center), `/reports`, and `/audit` are built, routed, and in
the sidebar, but are not among the eleven modules the prompt enumerates. They will need the
same Phase 4 / Phase 7 treatment or they will be the only pages left on the old design.

---

# Found during the palette round (branch `ui/palette-round`, 2026-08-08)

Unlike the entries above, these are **all fixed** on the branch. They are kept
because each one was invisible to `tsc`, `eslint` and `next build` — every
single one was green through all three — and the pattern of how each was found
is more useful than the fix.

## S2 — 23 shadow classes painted nothing · FIXED `f28d73b`

Every element carrying a Tailwind `shadow-*` class computed to
`rgba(0, 0, 0, 0)`. All 23 of them. The previous round had claimed "real
elevation and layered shadows"; there was no elevation at all, which is a large
part of why cards read as flat tinted rectangles.

Replaced with a plain-CSS ladder `sp-e1/e2/e3`; 23 of 23 now paint.

**Found by** reading computed styles in the browser, not the class list. A class
being present in the markup says nothing about whether it emits a rule — the
same failure mode as D9's `/opacity` modifiers.

## S2 — The focus ring was never gold · FIXED `b2b0b0e`

Measured `rgb(74, 65, 57)` — `currentColor` inherited from the nav link, not the
accent. The `outline` shorthand with `!important` was not carrying its colour
through; the longhand now repeats after it.

**Found by** dispatching real `Input.dispatchKeyEvent` Tab presses over CDP and
reading `getComputedStyle` on `document.activeElement`. `el.focus()` would not
have caught it — it does not reliably trigger `:focus-visible`.

## S2 — Toggle knob escaped its track; OFF state invisible in dark · FIXED `70e1f2a`

Reported as "toggles overflow their card". The card was innocent: the button sat
1px inside the card's padding box at every width. The knob was escaping its own
track — absolutely positioned with no inline anchor, so it resolved against its
static position (22px) and the translate stacked on top of that.

    before  ON  leftInset 42px in a 44px track, rightOverflow +18px
    after   ON  leftInset 22px, rightOverflow -2px

Second defect in the same component: the OFF track was `--surface-muted`
`#2f2118` on a `#241a12` card, so an unset switch in dark mode was nearly
invisible — it read as empty space rather than a control.

**Lesson:** the reported symptom named the wrong element. Measuring both boxes
separately is what separated them.

## S1 — "Set Up 4 Stations" fabricated live trade · FIXED `7dc5d12`

Inserted baskets mid-scan totalling $148.00, a weight-mismatch alert and an
age-verification hold, into the real table in the real store. The dashboard then
reported live checkout activity for a shop with no products and no sales — and
that is the state that shipped to a client review.

Now inserts four available counters, all session fields zeroed, all alert fields
null. The four fabricated rows were removed from the live store. See D23.

## S1 — `checkout_stations` had no DELETE policy · FIXED, migration 0012

Select, insert and update policies existed; delete did not. RLS denies by
default, so `.delete()` through the normal client returned **HTTP 200 with zero
rows removed** — nothing in the app could remove a counter, and the failure
reported success.

Found while clearing the fabricated rows above: the delete came back 200 with
the rows still present. Migration 0012 adds
`managers can delete stations · DELETE · ((store_id = current_store_id()) AND
can_manage())`, applied 2026-08-08 and verified (3 policies → 4).

There was also no UI capable of issuing a delete; `Remove Counter` was added and
driven end to end, DB rows 4 → 0. See D24.

## S2 — Confirm button clipped out of existence · FIXED `7f2633c`

The new Remove-Counter confirm row put two `fullWidth` buttons in a flex row.
`Button` carries `shrink-0` in its base class, so neither could shrink: Cancel
measured **+237.3px** past the card's inner edge, where the card's
`overflow-hidden` clipped it away entirely. The control existed, rendered, and
could not be reached.

`flex-1 min-w-0` instead — a zero flex-basis divides the row and survives
`shrink-0`. Re-measured at −31px, inside the card.

**Found by** measuring `getBoundingClientRect()` against the card's padding box
in a real browser. It was introduced and caught within the same hour, by
looking.

## S2 — Zero rows blamed the migration for a double click · FIXED `7f2633c`

The guard added for the bug above treated any empty delete result as "the
policy is missing". Driving the flow headless hit the other cause: after a
removal the board still shows the old card until `router.refresh()` lands, so a
second click deletes an already-deleted row, gets zero rows, and the UI told the
shopkeeper to apply a migration that was already applied.

Zero rows now names both causes and refreshes.

## S1 — The harness measured `/login` and called it `/dashboard` · FIXED

The most dangerous defect of the round, because it fails *upward*.

`SP_COOKIE_FILE="$PWD/cookie.txt"` — `$PWD` in Git Bash is `/c/Users/...`, which
Node on Windows cannot stat. The file read as absent, no cookie was set, the app
redirected to sign-in, and the harness reported CLS 0, console 0, no overflow,
all focus rings gold. Every figure was correct. Every figure described the
sign-in page.

Fixed by using `$(pwd -W)`, and by making `harness.js` throw when
`location.pathname` is not the requested path.

A sibling trap: bare `node harness.js /dashboard` is rewritten by Git Bash to
`C:/Program Files/Git/dashboard`. Prefix `MSYS_NO_PATHCONV=1`. The previous
session left `result-CProgramFilesGitsettings-light.json` behind as evidence of
that one going unnoticed too.

**Scope:** verification tooling, not the app. Recorded here because every
Phase 3 and Phase 7 number depends on the harness being honest, and it was not.
See D26.

## S3 — Six `images.unsplash.com` loads, all already 404 · FIXED `f0d6af6`

Texture loads in the landing's `ThreeGroceryVisual`. Replaced with canvas-drawn
palette gradients and a line glyph — the pattern that file already used for its
shelf labels. Verified: zero remote image hosts in tracked files, zero
third-party hosts requested at runtime.

## Note — station toast labels hardcode a leading zero

`Station 0${station.station_number}` appears in three toasts in
`MonitoringClient.tsx`. At station 10 or above that reads "Station 010". The
card heading uses `padStart(2, '0')` and is correct; the new remove toast
matches the heading. Cosmetic, and unreachable until a shop configures ten
counters — left alone rather than widening this branch's diff.

## S2 — Implicitly focusable scroll container with no name and no ring · FIXED Phase 3B

`stockpulse/components/staff/StaffScheduleClient.tsx:259` (the weekly rota strip)

Measured on `/staff` at 390, both themes: `nonGoldRing=1`, `rgb(16, 16, 16)`, on a
`<div>` whose text content was `MON3TUE4WED5THU6FRI7SAT8SUN9`.

Chrome makes an overflowing scroll container **keyboard-focusable on its own**,
so the week can be scrolled without a mouse. That is correct behaviour and worth
keeping. The problem is that this implicit focus carries no `tabindex`
attribute, and the app's global focus rule reaches
`[tabindex]:focus-visible` — so the container fell outside every selector in it
and painted the black UA ring. It was also an unlabelled `div`, so a screen
reader user landed on a tab stop that announced nothing.

Fixed by declaring what the browser was already doing: `tabIndex={0}`,
`role="region"` and an `aria-label`. Re-measured: `gold=21, nonGoldRing=0`.

### The general pattern, and where else it could hide

Any element that scrolls, overflows, and contains **no focusable children** can
become a tab stop the design system never styled. Two conditions have to hold at
once, which is why this was the only instance found:

- it must actually overflow at the width being used, and
- it must contain nothing else focusable — Chrome suppresses the implicit focus
  when the scroller already has a tabbable descendant.

Swept every `overflow-*` container in the app (19 of them) and measured tab
traversal on 10 route/theme combinations — dashboard, inventory, sales,
suppliers, customers, reports, staff, staff/team, audit, monitoring. Only the
rota strip surfaced. The rest fall into two safe groups:

- **Scrolls only at `lg`** (`lg:overflow-x-auto` on the audit, customers, sales,
  suppliers and team-roster tables): at 390 there is no overflow, and at `lg`
  the rows contain action buttons, so the scroller is never the tab stop.
  Verified on `/staff/team` at 390 — `gold=20, nonGoldRing=0`.
- **Contains focusable children** (AI panel, command palette listbox, mobile
  drawer, notification bell, modal bodies, import preview).

**Not yet measured:** `/settings`, `/profile`, `/help`, `/support`, and the
overlay components in their open state — the palette, the AI panel, the mobile
drawer and the notification popover only mount on interaction, and the harness
measures a page at rest. Those are Phase 3C / Phase 7 work. The check is cheap:
tab-traverse and look for `nonGoldRing > 0`.

Worth noting the class of bug rather than just the instance: this is the third
defect this round that `tsc`, `eslint` and `next build` all passed, and the
second one where the browser's own default behaviour — not the app's code —
created the element that broke the design system.
