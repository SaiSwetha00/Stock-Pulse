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

## Note — three modules are outside the master prompt's list of eleven

`/monitoring` (Live Operations Center), `/reports`, and `/audit` are built, routed, and in
the sidebar, but are not among the eleven modules the prompt enumerates. They will need the
same Phase 4 / Phase 7 treatment or they will be the only pages left on the old design.
