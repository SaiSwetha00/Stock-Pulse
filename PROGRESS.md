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

## In flight

- **Phase 5 — landing rhythm and honest copy.** The 116 palette classes in
  `components/marketing` plus the auth pages are deliberately still there: they
  are a permanently-dark surface and `.sp-landing` does NOT set `.dark`, so a
  theme token resolves to its LIGHT value on black. They need explicit
  dark-fixed handling, not substitution. See the D11 note on the landing gold.

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
| Run `0008_avatars_bucket.sql` | Avatar upload fails until the bucket exists |
| Resend -> Supabase custom SMTP | Invitations cannot be delivered; blocks Phase 3 |

## Could not verify without the owner

- Lighthouse on authenticated routes — needs a logged-in Chrome with
  `--remote-debugging-port=9222`.
- Per-route JS attribution — `@next/bundle-analyzer` is inert under Turbopack,
  `next experimental-analyze` produced nothing, and Next 16 no longer emits
  `app-build-manifest.json`. Three dead ends; plan is the browser network panel.
- Anything requiring a real microphone, a real invite email, or a second user
  account.
