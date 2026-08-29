# Acceptance seed — the harness store only

**This folder writes real rows into a real Supabase project. Read this before
running anything in it.**

It exists so the product can be judged at real volume. Every phase up to now
was reviewed against an empty shop, and empty states hide a great deal: a table
with no rows cannot be too dense, a chart with no data cannot be unreadable,
and a report with nothing in it always exports cleanly.

## What this is not

It is **not** `supabase/dev-only/seed_demo.DO-NOT-RUN-AGAINST-PRODUCTION.sql`,
and it is deliberately kept in a different folder so the two are never reached
for by mistake. That file is a raw SQL dump with no target check — whatever
database you paste it into is the one it fills. This is the opposite: it can
only write to one store, and it says which one before it does anything.

It is **not** demo data for a client. D23 is the standing rule — a setup action
creates the thing empty, and only a clearly-labelled seed may invent trade.
This is that clearly-labelled seed, and the label is enforced rather than
remembered:

| | |
|---|---|
| Store | hard-coded to `StockPulse Demo Store` (`e47fe6eb-…`), no CLI override |
| Name check | aborts if that id is not still named `StockPulse Demo Store` |
| Blast radius | prints how many stores exist and that it touches exactly 1 |
| Product marker | every seeded product has an `ACC-` SKU, visible in the UI and in exports |
| Row identity | every id is derived from a fixed namespace, so teardown removes exactly this set |

## Running it

```bash
node scripts/acceptance/acceptance-seed.cjs --yes
```

Without `--yes` it refuses and explains itself. It is idempotent: a second run
upserts the same derived ids rather than doubling the shop, which matters
because the realistic failure is a half-finished run that needs repeating.

## Tearing it down

```bash
node scripts/acceptance/acceptance-teardown.cjs
```

```bash
node scripts/acceptance/acceptance-teardown.cjs --yes
```

The first is a dry run and is the default; the second deletes.

**It deletes only the derived id set.** Anything created by hand during
acceptance testing — a shipment, a support request, a leave record, a product
added through the UI — is *not* in that set and survives. The teardown counts
what remains, per table, and prints it. Leftovers are the intended failure
mode: this cannot delete something it was not able to name in advance.

## What it creates

- 40 products across the store's five real category slugs. The slugs are read
  from `categories` and the run **aborts** if any is missing —
  `products_category_fkey` is composite on `(store_id, slug)` and would reject
  every row otherwise.
- 5 suppliers, one per supplier category, with a mix of `active` / `issue` /
  `inactive` so the status filter has something to filter.
- 3 staff (1 manager, 2 staff) as real auth users on `@stockpulse.test`, which
  RFC 2606 guarantees can never receive mail.
- 30 days of sales, weekend-weighted so the charts are not flat lines, with
  line items and stock decremented to match.
- 6 products deliberately under their low-stock threshold, across three
  categories, so the dashboard alert and the inventory filter have real input.
- A week of upcoming shifts.

Not seeded on purpose, because the owner journey creates them by hand and
seeding them would hide whether those flows work: shipments, support requests,
leave, notifications, checkout stations.
