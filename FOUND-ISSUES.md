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

---

# Phase 3C-i — the overlays, in their open state (2026-08-09)

`harness.js` measures a page at rest. `overlay-probe.js` drives it into an open
state first, which is how all of these surfaced. All fixed on
`ui/palette-round` unless marked otherwise.

## S1 — The AI panel was an `aria-modal` dialog with no trap · FIXED `fb4d07e`

`stockpulse/components/ai/AIAssistantPanel.tsx`

Measured /inventory light 1440: `trap=ESCAPED x14`. Every one of fourteen tab
stops landed **outside** the panel — the notification bell, the account link,
"Export CSV" on the page behind a dialog covering the right third of the
screen. `return=LOST`: nothing recorded what had focus before it opened.

`aria-modal="true"` was already on the element. It buys none of this. It is a
promise made to assistive technology about behaviour the component has to
implement itself.

## S2 — The mobile drawer moved focus in and then let it walk out · FIXED `fb4d07e`

`stockpulse/components/layout/MobileDrawer.tsx`

`trap=ESCAPED x1`. It focused the panel on open — the half everyone remembers —
and had no Tab wrapping, so after the close button and the nav links Tab
stepped onto "Export CSV" on the page underneath, which is behind a scrim and
cannot be seen. One escape is enough; the user is now typing into a page they
cannot look at.

Second defect in the same effect: `onClose` is an inline arrow at the call
site, so a new function arrived on every render of `MobileHeader`. With it in
the dependency list the effect re-ran **while the drawer was open**, capturing
`previouslyFocused` from whatever was focused inside the drawer at that moment.

## S2 — Modal lost focus on close, but only for two of eight · FIXED `fb4d07e`

`stockpulse/components/ui/Modal.tsx`

Add Customer and Add Supplier reported `return=LOST -> BODY`. Add Product,
Import Products, Assign Shift, Record Leave and the rest returned to their
trigger. The two that failed are the only two whose first field carries
`autoFocus` (`CustomerModal.tsx:100`, `SupplierModal.tsx:94`).

`Modal` read `document.activeElement` inside a **passive effect**, which runs
after React commits the panel — and `autoFocus` is applied during that commit.
So the honest answer to "what had focus before this opened?" was already "a
field inside this dialog". That node is detached on unmount, `.focus()` on it
does nothing, and focus falls to `<body>`. It presents as a focus-restore bug
and is really an effect-ordering bug.

Now read during render, before the commit. That fixes it for all nineteen
`Modal` call sites rather than the two that use `autoFocus` today.

**How it was isolated** matters more than the fix. The probe's verdict —
`activeElement !== document.querySelector('[data-sp-trigger]')` — cannot tell a
stale marker from a genuinely lost focus, because both produce
`focusTag: BODY`. `return-probe.js` holds a **direct node reference** instead of
a selector and samples focus at eight points over four seconds. On /inventory
it showed focus returning at 250ms and holding to 4000ms, with the marker
present, connected, and the same node — proving the harness was honest and the
app was not, for the modals that failed.

## Note — the phone has no notifications affordance at all

`app/(dashboard)/layout.tsx:35` wraps `Topbar` in `hidden lg:block`, and the
notification bell lives only in `Topbar`. `MobileHeader` offers "Open
navigation" and "Your profile" and nothing else. Below 1024px there is no way
to reach notifications.

Found because the probe was clicking the hidden bell: `el.click()` fires
React's handler on a `display:none` button perfectly happily. Not fixed — it is
a product decision about what belongs on a phone header, not a focus bug.

## Note — `Add Shipment` is unmeasurable on an empty store

`/suppliers` reports `NO TRIGGER` for Add Shipment in all four configurations,
and the button list confirms it is genuinely absent: the control needs at least
one supplier to exist. The probe is reporting correctly. It needs a fixture
with a supplier row before that overlay can be checked.

---

# Phase 3C-ii — Settings, Support, Help Centre (2026-08-09)

All fixed on `ui/palette-round`. As with every previous round, `tsc`, `eslint`
and `next build` were green through all of them.

## S2 — Settings' three labels pointed at no control · FIXED

`stockpulse/components/settings/SettingsClient.tsx` (Store Details card)

Store Name, Primary Address and Contact Phone were hand-rolled `<label>`
elements with no `htmlFor`, over inputs with no `id`. Clicking a label did
nothing, and a screen reader user landed on three unnamed fields — on the one
screen in the app that is entirely a form.

The markup *looked* right, which is why it survived four rounds of styling
work: the label was correctly positioned, correctly sized and correctly
coloured. Nothing about a label is visibly broken when it is not associated.

**Found by** converting to `Field` for the radius/height/error requirements and
noticing that `Field` supplies `htmlFor`+`id` via `useId` — i.e. by moving to
the shared component, not by auditing accessibility. Worth stating: the
component was already correct and the drift was entirely in the call sites that
did not use it.

## S2 — The address textarea was clamped to one row · FIXED

Same file. The `<textarea rows={2}>` also carried `control-h`, which is
`height: var(--control-h)` — a fixed 40px. The fixed height wins over `rows`,
so a two-row field rendered as one and a shop address scrolled inside a
single line.

`control-h` is correct on an input and wrong on a textarea; `Field`'s
`Textarea` uses `min-h-24 resize-y`. Same class of error as the toggle knob:
a value that is right for one member of a family applied to a member it does
not fit.

## S1 — An empty store name saved successfully · FIXED

Same file, `handleSave`.

`stores.name` is `not null`. `not null` is not `not blank` — clearing the field
and clicking Save wrote `''`, returned no error, and showed a success toast.
The page header then rendered "Configuration and operational parameters for ."
and every other surface that prints the shop's name went blank with it.

There was no validation on this screen at all. `lib/validation/storeSettings.ts`
adds it: name required and bounded, address and phone optional and bounded,
phone deliberately permissive in shape (a validator that refuses a real
international number is worse than none). Values are trimmed on the way out, so
`" "` cannot pass a check that ran against `""`.

## S2 — The last two raw palette classes did not follow the theme · FIXED

Same file, both `<input type="range">` sliders. Both took their accent from a
raw zinc-900 palette class — the only two left in the app outside the fourteen
intentional alpha scrims and gradient stops.

Near-black does not invert. In dark mode the filled track and the thumb were
near-black on a near-black card, so the slider read as an empty groove with
nothing in it — the same disappearance the toggle's OFF state had before
Phase 1 fixed it, and for the same reason.

Now `--accent-fill`, the surface-grade gold from D22. Verified in the built CSS
by the D9 recipe: `accent-color:var(--accent-fill)` present,
`accent-color:var(--color-zinc-900)` absent after a rebuild.

## Note — a comment regenerated the class it documented

The first attempt at the comment above spelled the removed class name out.
Tailwind scans file content rather than parsing it, so the dead rule came back
from the comment and the built CSS still contained it after both uses were
gone. See D33. The audit greps this project runs cannot tell a use from a
mention, which is why this matters beyond the few bytes.

## Note — the Support filters wore the primary skin

`stockpulse/components/support/SupportClient.tsx`

Selected meant `bg-foreground text-surface`, the same near-black as a Save
button, so the highest-emphasis control on a triage screen was a filter. Not a
bug in the sense of anything failing — a meaning applied to a control that does
not have it. See D32.

## Harness — the overflow probe reported a control as its own card · FIXED

`scratchpad/harness.js`, `OVERFLOW_PROBE`

`/settings` reported `offenders=1` in all four states: `button: right +12px
left +12px`. The symmetry is the tell — 12px is the button's own `px-3`.

The probe locates a control's card with `el.closest('.sp-e1')`, and `closest()`
matches the element *itself*. The theme segmented control's active segment
legitimately carries `sp-e1` (it is a raised thing, which is what the rung is
for), so it became its own card and was measured against its own padding box.

Now `el.parentElement.closest('.sp-e1')`; re-run gives 0 offenders in all four.
Third consecutive round in which something the probe flagged was the probe —
D31's habit exists for this.

## Harness — a build swapped underneath a running server · FIXED (procedure)

The first 16-state run of this phase is void. `npm run build` was run while
`next start` was already serving, so chunk hashes moved under the running
process: 500s and 404s on `_next/static/chunks/*.js`, and on `/help/[slug]` the
stylesheet itself failed to load.

That run reported `gold=0 nonGoldRing=22` and CLS 0.0214 on `/help/[slug]` —
which reads exactly like a route that lost its focus-ring styling, and was
actually a page rendering with no CSS at all. It would have been entirely
believable as an app defect on that one route.

Not a code fix: restart the server after any rebuild, before measuring. Logged
because the symptom impersonates a design-system regression, and because this
is the same family as D26 — the report named a build the server was not
serving.

## PATTERN — `not null` is not `not blank` · SWEEP IN PHASE 7

Raised by the owner after Phase 3C-ii, and correctly: the empty-store-name bug
above is an instance, not an incident.

`stores.name` is `not null`. A form that posts `''` satisfies that constraint
completely — Postgres rejects the *absence* of a value, never the emptiness of
one. So the write succeeds, the API returns no error, the UI shows a success
toast, and the record is now blank in a column the schema declares mandatory.
Every layer behaved exactly as written. The result is still a nameless shop.

**The shape to look for:** a `text not null` column, a form field bound to it,
and no `.trim()` plus no required-check between them. Whitespace makes it
worse — `" "` is not empty, so even a naive `if (!value)` guard passes it, and
the stored value is a string that renders as nothing.

**The sweep, for Phase 7:** enumerate every `not null` text column in
`supabase/schema.sql`, `schema_phase2-4.sql` and `migrations/0001`–`0012`, then
for each one find the form or Server Action that writes it and confirm two
things — that the value is trimmed before the write, and that blank is rejected
with a field-level error rather than sent. Known-good already:
`supportRequest.ts`, `customer.ts`, `product.ts`, `supplier.ts`, `shift.ts`,
`leave.ts` and now `storeSettings.ts` all validate and trim. Everything else is
unaudited.

Two things worth deciding during that sweep rather than after it:

- **Where the check belongs.** Client-side validation is a convenience; the
  crafted request skips it. Anything written through a Server Action should
  re-run the same validator server-side, the way `submitSupportRequest` does.
- **Whether to add `check (length(trim(col)) > 0)` constraints.** That closes
  it at the layer that cannot be bypassed, and it is a migration, so it is a
  decision for the owner rather than a code change. Cheaper to add for all of
  them at once than one at a time.

Deliberately not fixed now: it is a cross-cutting audit, and widening Phase 3's
diff to cover it would have made the visual round unreviewable.

## Note — `/support` has no page-level primary, ON PURPOSE. Do not "fix" it.

`stockpulse/components/support/SupportClient.tsx`

Phase 3C-ii's button ladder gave `/settings` a Save and `/help` a Send request,
and left `/support` with no high-emphasis button at all. That is not an
omission and it is not a screen that was missed.

`/support` is a triage list. Its only action is `Mark resolved`, and there is
one per row — promoting it to primary would put N near-black buttons on screen,
which is visually indistinguishable from having none. The Open/All filters were
already wearing the primary skin and were demoted for the same reason: a filter
changes what is listed, never what is done.

See **D32**, which the owner ratified on 2026-08-09. A later batch reading
"one high-emphasis button per screen" as a requirement rather than a limit will
be tempted to add one here. The rule is a ceiling.

---

# Phase 4 — data-driven categories (2026-08-09)

## Harness — HTTP status cannot tell a rendered page from a refused one · FIXED (probe)

The role test's first run reported a **staff** account getting `200` on the
owner-only `/settings`, which reads as a blown authorisation guard.

It was not. A Next.js Server Component `redirect()` returns **HTTP 200 with a
`NEXT_REDIRECT` payload** — the layout shell and `<head>` are already flushed,
so the redirect arrives inside the RSC stream and the client navigates. Status
code and `redirect_url` are both useless as discriminators.

The second attempt was also wrong, and more interestingly: grepping the body
for `"Store Settings"` matched the `<title>`, which Next emits from the route's
`metadata` export *before* the redirect resolves. On `/settings/categories` it
matched the `<meta name="description">` too, so a refused page scored two hits
on a marker meant to prove it had rendered.

What works is a string that exists only inside the rendered component and in no
metadata — `"Add a category"`, `"Interface Theme"` — checked alongside a count
of `NEXT_REDIRECT`. With controls on both sides (`/customers` for canManage,
`/settings` and `/audit` for isOwner) the result separated cleanly.

**This is the fourth consecutive round in which something a probe flagged was
the probe** (D31). The tell each time is the same: ask whether a *healthy*
system could produce that output. A correctly-guarded route absolutely can
return 200 with its own title in it.

## PATTERN — a reorder that swaps two values is a no-op when they are equal

`moveCategory` swaps two rows' positions. The obvious implementation swaps
their `sort_order` values.

That is silently wrong whenever the two are equal, and they can be: the column
defaults to `0`, 0013's defensive backfill writes `99` to every stray, and the
list's secondary sort is by name — so a legitimate list can arrive with ties.
Swapping two equal integers writes successfully, changes nothing, returns no
error, and the UI reports a reorder that did not happen.

Fixed by renumbering the whole list `1..n` in the intended order and writing
only the rows whose number actually changed. Worth recording as a shape rather
than an incident: it belongs with D24's family — **a write that succeeds
without changing anything is indistinguishable from one that worked**, and the
fix is always to make the operation assert what it changed.

## Note — `/settings` is owner-only, which nearly shipped a dead link

The product form's "Manage categories" link is reached by managers, since
adding a product is `can_manage()` work. Had the categories UI been a card on
`/settings`, that link would have bounced every manager to `/dashboard`.

Caught by reading the route guard before building the UI, not by testing.
Resolved by making `/settings/categories` a sibling route with its own
`canManage` guard — see D36. Recorded because the collision is invisible from
either side on its own: the link looks right, and the guard looks right.

## Migration 0013 is NOT APPLIED

`categories` returns PGRST205 on the hosted project. No DDL path exists from
the agent side (no `psql`, no `pg` driver, no Management API token; the
service-role key reaches PostgREST only), so it needs the SQL editor — same as
0009, 0011 and 0012.

The app runs either side of it by design (D37), so this is not a broken
deploy. What it does mean is that **0013's RLS policies are unexercised**: the
`canManage` half of the owner/manager/staff model was measured at the app
layer, and the `can_manage()` half in the database has never been asked a
question. CLAUDE.md's warning about those two drifting is exactly why that gap
is written down rather than assumed closed.

## S3 — CLS 0.0006 on /dashboard at 1440, both themes · SWEEP IN PHASE 7

Measured during the Phase 4 harness pass, 2026-08-09. `/dashboard` at 1440px
reports **CLS 0.0006** in light and dark; at 390px it is 0, and every other
route measured 0 at both widths.

It is 1.2% of the 0.05 budget, which is exactly why it is written down. Phase 2
measured **CLS 0 in all 16** dashboard states, so this is a change from a known
baseline, and a number that drifts upward one harness run at a time is
indistinguishable from a number that was always slightly above zero — unless
somebody records the day it moved.

**Not caused by Phase 4, on the evidence available.** The harness store has
zero products, so `lowStockItems` is empty and the low-stock table — the only
place on this route that renders a category name — never renders at all. The
plausible candidates are `CountUp`'s width reservation and the sparkline, both
of which are 1440-only geometry, and neither of which was touched.

**Not isolated.** Doing it properly means the Layout Instability API's
`sources` array, attributing the shift to the specific node, rather than
guessing from a total. That is Phase 7's performance sweep, alongside the
Lighthouse/LCP/INP work that has been deferred for the same reason — it needs a
real browser run against authenticated routes.

Recorded so it cannot quietly become the new baseline.

## Harness — a click before hydration is a no-op that looks like a broken control · FIXED (probe)

`link-probe.js` clicked "Add Product" on `/inventory`, reported
`clicked`, and then found no dialog: `{"found":false,"why":"no dialog mounted"}`.
Read literally, the product form does not open.

The button is in the server-rendered HTML long before React attaches its
handler. A CDP `el.click()` on it therefore does nothing at all, and does it
silently — `dispatchEvent` returns true, the probe carries on, and the missing
dialog reads as an application defect.

Fixed by waiting for a real React root (`Object.keys(node).some(k =>
k.startsWith('__react'))`) before clicking, rather than sleeping and hoping.
With that in place the same script opened the modal, read the link, clicked it
and landed on `/settings/categories`.

**Fifth consecutive round in which something a probe flagged was the probe**
(D31). It is also the same family as D30: an instrument that could not tell it
was *early*. A fixed sleep is a bet about how fast the machine is; waiting for
the condition is not.

Worth keeping for the next round: this contradicts the older note that "the
Browser pane in this environment never hydrates React". That was true of the
Browser pane MCP surface, and is **not** true of the CDP harness — this run
measured `react hydrated: true` and drove a real modal. Interaction tests are
available here; they just have to wait for hydration first.

## S2 — `0009_product_images_bucket.sql` was recorded as unapplied for weeks, and was applied · CORRECTED 2026-08-09

`PROGRESS.md`'s "Blocked on the owner" table carried:

> Run `0009_product_images_bucket.sql` — **NOT APPLIED.** Product image uploads
> report "storage is not set up" until it is run

That was false. Measured against the live project on 2026-08-09:

| Check | Result |
|---|---|
| bucket `product-images` exists, `public = true` | yes |
| owner uploads into its own `<store_id>/` folder | **200** |
| owner uploads into another store's folder | **403** · new row violates row-level security policy |
| **staff** uploads into its own store's folder | **403** · same |
| products with a non-null `image_url`, project-wide | 0 |

So both halves of 0009 are live: the public bucket and the `can_manage()` +
`current_store_id()` write policies. Nothing about product image upload is
broken on the hosted project, and it is **not** a Phase 8 blocker.

**The damage was in the propagation, which is the part worth recording.** The
stale line was read and repeated into `CLAUDE.md` — "0009 is the one still
outstanding" — on the strength of the document alone, without a single call to
the storage API. A wrong fact in a planning doc is cheap; a wrong fact promoted
into the file that instructs every future session is not, because the next
agent inherits it as ground truth and has no reason to question it.

Two things changed as a result:

- `CLAUDE.md` now says explicitly that migration status must be measured, not
  read, and carries the one-line storage-API check.
- The zero `image_url` rows explain how this survived: with no products
  carrying images, nothing on any screen looks wrong whether the bucket exists
  or not. **A claim nobody's workflow exercises can stay false indefinitely.**

This is D38 from the non-probe side: a document is an instrument, and an
instrument that cannot tell you it is wrong is worse than none.

## Note — the "storage is not set up" message is now unreachable, and should stay

`components/inventory/ProductImageUpload.tsx:84` branches on the upload error
mentioning "bucket" and tells the user to apply migration 0009. With 0009
applied that branch cannot fire.

Deliberately left in place. It costs two lines, it is the same
ship-ahead-of-the-migration courtesy as `saveLeave` (D21) and the categories
screen (D37), and a bucket can be deleted as easily as it was created — at
which point the message is correct again and names the file to run.

---

# Phase 5 — imagery and motion (2026-08-09)

## Harness — a dead server answered every request, and the report named a build it never served · FIXED (procedure)

The worst failure of the phase, and the sixth consecutive round in which
something a probe flagged was the probe.

The first Phase 5 measurement pass reported: the pulse not animating under
normal motion, the 3D crate never mounting, the static crate absent, and zero
image slots. Four defects, consistent with each other, and all four false.

`npx next start -p 3100` had been launched while a server from the **previous
phase** was still bound to that port. The new process died instantly with
`EADDRINUSE` — into a log nobody read, because the command that started it also
`curl`ed `/login`, got `200`, and moved on. The `200` came from the old
process, which was serving a build from before Phase 5 existed.

The tell was there and was nearly missed: `sp-trace` appeared in the served
HTML but the new figure's paths did not. **The old `PulseMark` also used
`sp-trace`.** A grep for the class the new component happens to share with the
old one is not a check that the new component shipped.

FOUND-ISSUES already carries "a build swapped underneath a running server"
from Phase 3C-ii. This is its mirror image — the build did not swap, the server
never restarted — and both produce a report that names a build the process was
not serving. Two shapes, one rule:

**Do not accept HTTP 200 as proof the server you started is the server
answering.** Assert on a string that exists only in the build under test. The
curl that settled it looked for `M12 52h88`, a path introduced by this phase
and present in nothing before it.

See D38: the healthy scenario that produces "animation not running, component
not mounted, zero image slots" is *an older build of the same app*, and that
should have been the first hypothesis rather than the fifth.

## Note — `gold != tabStops` on /sales at 390 is the harness's accounting, not a missing ring

`/sales` at 390px reports `tabStops=22 gold=20 nonGoldRing=0 ringless=0` in
both themes. Read quickly, two controls lost their focus ring.

They did not. `harness.js` computes `tabStops` as `r.rings.length` — every
recorded stop — while `gold`, `nonGoldRing` and `ringless` all filter on
`x.fv`, whether the element matched `:focus-visible`. Two stops on that route
at that width never entered the `:focus-visible` state, so they are counted in
the total and in none of the three buckets. No ring was expected and none was
missing.

**`nonGoldRing` and `ringless` are the load-bearing numbers, and both are 0 in
all 20 states.** `gold == tabStops` is a convenient shorthand that only holds
when every stop happens to match `:focus-visible`, which is not guaranteed and
is not an app property.

Left as-is rather than "fixed": making the three buckets sum to `tabStops`
would mean inventing a fourth category for stops that are correctly ringless,
and the number that matters is already reported honestly.

## S3 — CLS 0.0006 on /dashboard at 1440 is unchanged by Phase 5

Re-measured across all 20 states. `/dashboard` at 1440 still reports **0.0006**
in both themes; every other route and width is 0.

This was the specific risk of adding imagery to that page, so it is worth
stating plainly: **the figure, the crate and the image slots did not move it.**
All three declare fixed boxes — `h-16 w-28`, `h-16 w-16`, and the slot's
explicit `width`/`height` — and the crate's static and animated states fill the
same 64px box, so the idle-time swap has nothing to shift.

Still not isolated, still Phase 7's performance sweep, still logged so it
cannot become the new baseline by attrition.

---

# Phase 6 — found while drafting the legal documents (2026-08-09)

Writing a privacy policy means enumerating every place data leaves the system.
Doing that honestly surfaced four things nobody had asked about.

## S1 — Email addresses are never verified (`mailer_autoconfirm: true`)

`GET /auth/v1/settings` on the live project returns `"mailer_autoconfirm": true`.
Signup confirmation email is not sent; accounts are confirmed on creation.

**Anyone can register with an email address they do not control.** For this app
that matters more than usual, because the account email is the password-reset
address and the channel this policy promises to use for breach notification. A
person who signs up as someone else's address has an account tied to an
identity they cannot receive mail for, and the real owner of that address
cannot tell.

It also quietly contradicts the invite flow: `inviteStaff` sends a real
invitation, so staff addresses ARE exercised, while self-signup addresses are
not.

Not changed — it is a dashboard setting, not code, and turning it on mid-phase
would break signup for anyone mid-flow until SMTP is confirmed working. Flagged
because the privacy policy now promises to email store owners about breaches
and material changes, and that promise is only as good as the address.

## S2 — Support confirmation email cannot reach a real submitter

Verified against the Resend API with the project's own key: it authenticates
(`GET /domains` -> 200) and returns **zero verified domains**. `RESEND_FROM` is
unset, so `lib/email/resend.ts` falls back to `onboarding@resend.dev` —
Resend's shared sender, which by design only delivers to the Resend account
owner's own address.

So operator notification works, and a confirmation to the person who submitted
the support request does not, for any address that is not the account owner's.
`sendSupportEmails` already puts submitter confirmations behind a flag and the
file says why, so this is documented behaviour rather than a surprise — but the
underlying fix (verify a sending domain, set `RESEND_FROM`) has not been done
and is worth doing before a client relies on support replies.

## S2 — Google was an undisclosed sub-processor

`app/api/ai/chat/route.ts` streams to `gemini-flash-latest`, and
`lib/gemini/tools.ts` declares tools that can return product names and stock
levels, sales and revenue summaries, and staff names. All of that leaves the
system to Google whenever the assistant is used.

Nothing in the product said so. The old privacy placeholder listed
sub-processors under "what is not written yet", so this was not a regression —
it was simply never disclosed, and it is the single most surprising data flow
in the app for a shopkeeper who assumes their takings stay in their database.

Now named in the policy with what it receives, plus the plain advice that the
assistant is optional and nothing else depends on it.

**The general point:** an integration added for a feature is also a data
export. The privacy consequences of `@google/genai` were never considered when
the assistant was built, because the phase that built it was thinking about
streaming and tool calls.

## Note — public image buckets, restated as a privacy fact

D6 and migration `0009` both chose public read for avatars and product images,
for good reasons (many images per page, `next/image` caching, signed URLs
expire). That decision is not being reversed.

What had never been written down is the consequence in privacy terms: **anyone
holding an image URL can view it without signing in.** The URLs contain a
random uuid and are not listed anywhere, so this is obscurity rather than
access control. Now stated plainly in the policy's Security section, including
the advice not to upload anything to a product or profile photo that you would
not be content to have seen.

Worth keeping in mind for any future feature that puts something more sensitive
than a tin of beans into one of those buckets.

---

# Phase 7A — verification and hardening (2026-08-09)

## S1 — CLS 0.21 on /dashboard at 390, reported as 0 for four phases

The most important finding of the batch, because the instrument was wrong in
the reassuring direction.

`harness.js` has reported `CLS=0` for `/dashboard` at 390 since Phase 2.
`cls-probe.js`, which installs a `PerformanceObserver` via
`Page.addScriptToEvaluateOnNewDocument` — i.e. before document start — measures
**0.21**, four times the 0.05 budget, on the page people open first.

The harness attaches its observer after navigation, so whether it sees the
shift depends on whether hydration lands inside its window. It intermittently
did not. Hence dark measuring 0 and light measuring 0.2112 in the same batch:
not a theme difference, a sampling difference.

**The cause.** `Greeting` server-renders "Welcome back" and corrects to
"Good afternoon" at hydration, because only the browser knows the reader's
clock. The sources array named every victim precisely:

    #text "Harness"            y  78 -> 109   (+31, 337 -> 358 wide)
    DIV.grid  (stat tiles)     y 216 -> 247   (+31)
    DIV  "Aug 9 · Updated…"    y 164 -> 195   (+31)
    H2   "Quick Actions"       y 732 -> 763   (+31)
    DIV.sp-qa-grid             y 772 -> 803   (+31)

31px is one line of the heading. At 390 the longer greeting wrapped the `<h1>`
to two lines and pushed the whole page down.

Fixed by putting the name on its own line below `sm`, so the heading is two
lines whatever the greeting says. Re-measured: **0, with zero shift entries.**

**The transferable part is the instrument, not the fix.** This is D30's shape
again — an instrument that could not tell you it was *early* — but inverted:
D30's harness reported a value that was too high because it sampled a moving
colour; this one reported zero because it started sampling too late. Both
convert timing into a verdict. A CLS total also cannot say what moved, which
is why three phases of looking at 0.0006 produced no answer and one run of the
sources array produced all of it.

## S2 — Four writers put unvalidated text into `not null` columns

The sweep FOUND-ISSUES scoped in 3C-ii, completed. 36 `not null text` columns
across `schema.sql`, `schema_phase2/3/4.sql` and `migrations/0001`–`0013`.

Passing structurally (CHECK-constrained enums where `''` cannot be stored):
`profiles.role`, `sales.payment_method`, `suppliers.category`,
`suppliers.status`, `shipments.status`, `checkout_stations.status`,
`audit_logs.action`, `ai_messages.role`. `products.category` joined them when
0013 replaced its CHECK with a foreign key.

Passing by validator: `products.name`/`unit`, `customers.full_name`/
`loyalty_tier`, `suppliers.name`, `shipments.po_number`, `shifts.role_label`,
`staff_leave.kind`, `stores.name` (Settings path), `categories.name`/`slug`,
and the three `support_requests` columns, which additionally carry
`length(btrim(...))` CHECKs in the database.

Passing because nothing user-supplied reaches them: `sale_items.product_name`
(copied from a validated product), `supplier_activity.supplier_name`/`message`
(read back from the row and templated), `notifications.title`/`audience`/
`kind`, `audit_logs.entity`, `checkout_stations.payment_type`.

**Failing:** `signUpOwner` writing `stores.name` and `profiles.full_name`;
`inviteStaff` writing `profiles.full_name`; `EditProfileModal` writing
`profiles.full_name`. All three fixed.

Two notes worth keeping:

- **`stores.name` was fixed at the wrong end in 3C-ii.** That phase fixed the
  Settings screen, which *edits* the name. `signUpOwner` *creates* it, and was
  never looked at. Fixing the edit path and not the create path is a very easy
  mistake to repeat.
- **`ai_messages.content` uses `length(content)` not `length(btrim(content))`**,
  so a message of a single space satisfies it. Harmless — nothing renders it as
  identity — and left alone rather than shipping a migration for it.

## S3 — `EditProfileModal` writes `profiles` straight from the browser

Every other write in the app goes through a Server Action, which re-runs
validation server-side precisely because a client check can be skipped. This
modal calls `supabase.from('profiles').update(...)` directly, so its new
trim-and-reject check is the *only* one.

RLS confines the blast radius to the caller's own row, so the worst case is
blanking your own name rather than someone else's. Not converted to a Server
Action in 7A because that is a behavioural change to a screen this batch was
not otherwise touching. Logged for whoever next has reason to open it.

## Note — the mobile bell is not covered by overlay-probe

`overlay-probe.js` bounds the notification popover to `minWidth: 1024`, which
was correct when the bell existed only in `Topbar`. There are now two bells in
the DOM — Topbar's, hidden below `lg`, and MobileHeader's, hidden above it.

The probe still only exercises the desktop one. Adding a `maxWidth: 1023`
entry for the mobile bell is a data change to the `OVERLAYS` array, not code,
and belongs in 7B's accessibility pass alongside the rest of the traversal
work. Recorded so the coverage gap is not mistaken for coverage.

---

# Phase 7B — measurement and cross-browser (2026-08-09)

## S2 — CONFIRMED, NOT FIXED: muted text on the dark stat tiles is 3.13:1

12 nodes across 8 surfaces, every one the identical pair:

    fgColor #6b6157   bgColor #14100c   ratio 3.13:1   required 4.5:1

`#6b6157` is the LIGHT theme's `--muted`. `#14100c` is `--foreground`, used as
a *background* by the inverted stat tiles (`rounded-2xl bg-foreground p-4`).
So a label styled for a light card is sitting on a deliberately dark one.

Affected: `/inventory`, `/sales`, `/customers`, `/suppliers`, `/staff`,
`/reports`, `/profile`, and the Add Product / Add Customer modals (which show
the same tiles behind them).

**Reproduced in Chrome AND Edge**, and reproduced in isolation on a single
route with a clean browser profile, with `document.documentElement.className`
confirming no `dark` class. That rules out the theme-emulation artifact
described below.

**Why it is not fixed here.** The correct fix is a token — a muted tone that
means "muted ON an inverted surface" — and then swapping it in at each site.
D9 rules out the obvious shortcut, `text-surface/70`, because `/opacity` on
these tokens compiles and emits nothing. D12 is the precedent: a tone with its
own meaning gets its own token rather than borrowing one. That is a change
across eight components plus a new token plus re-verification, and I ran out of
context to do it and prove it. Doing it half-verified would be worse than
leaving it measured and named.

**The recipe, for whoever picks it up:** add `--muted-on-dark` (light theme:
something around `#a8a099` gives ~4.6:1 on `#14100c`; dark theme: reuse
`--muted-strong`), expose it as `text-muted-on-dark`, and replace `text-muted`
only inside `bg-foreground` blocks. Then re-run `axe-sweep.js` — the count
should go 12 -> 0.

## Harness — axe results are corrupted by a reused browser profile

The first sweep reported **87 nodes including 34 color-contrast on /settings**,
reproducibly — byte-identical across two runs. A single-route run on the same
build reported **zero** contrast violations on /settings, also reproducibly.

Both were "reproducible". Only one was right.

The sweep reuses a named `--user-data-dir` per width/theme, so `localStorage`
persisted between runs — including `sp-theme`. Deleting the profile directory
dropped /settings from 36 nodes to 0 and the total from 87 to 12, with no code
change at all.

**Reproducibility is not correctness.** Two identical runs of an instrument
carrying the same stale state produce the same wrong answer twice, and the
second run reads as confirmation. The tell was the data, not the count: a
foreground from one theme on a background from the other is a combination that
cannot occur in a correctly rendered page, and it should have been the first
thing questioned rather than the fifth.

Fix: delete the profile directory before a sweep, or use a fresh one per run.

## Lighthouse mobile is not reproducible on this machine

Three runs, same build, same route (`/dashboard`, mobile preset):

    run 1   perf   0   FCP 14937   LCP 20838   TBT   NaN
    run 2   perf  30   FCP  3870   LCP 13964   TBT  4928
    run 3   perf  33   FCP  2825   LCP 13925   TBT  6817

A 7x spread with nothing changing. Lighthouse's mobile preset applies 4x CPU
throttling, which multiplies whatever contention already exists — and this
machine was running `next start`, several headless Chromes and a build.

Desktop, by contrast, is steady: perf 96 / 92 / 94, LCP 1222 / 1314 / 1258,
CLS 0.0000 across three runs.

**So: desktop Lighthouse numbers are reported as measurements. Mobile numbers
are reported as indicative only, and no before/after claim is made from them.**
The greeting fix is evidenced structurally instead — `H1.sp-title` is no longer
an LCP candidate and "Welcome back" is absent from the served HTML.

## Note — voice input has still never been exercised with a real microphone

Unchanged since it was built. Headless Chrome has no microphone, and
`SpeechRecognition` in Chrome sends audio to a Google speech service, so there
is nothing here to fake that would prove anything. The owner is testing it;
steps and expected failure modes are in PROGRESS.
