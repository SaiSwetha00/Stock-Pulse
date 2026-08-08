-- =====================================================================
-- DEVELOPMENT SEED DATA — NEVER RUN THIS AGAINST A PRODUCTION DATABASE.
--
-- This file inserts fabricated products, sales, customers and suppliers.
-- Run against a real store it becomes indistinguishable from that shop's
-- own trading history: invented revenue in Reports, invented stock in
-- Inventory, invented people in Customers.
--
-- The application never executes this file. It exists only for seeding a
-- scratch database during development. It lives under supabase/dev-only/
-- and is named this way so it cannot be pasted into the Supabase SQL
-- editor by accident.
-- =====================================================================
-- StockPulse demo seed data
-- Run in the Supabase SQL editor AFTER schema.sql, schema_phase2.sql,
-- schema_phase3.sql and schema_phase4.sql.
--
-- Safe to re-run. Each section fills a table only when that table is empty for
-- the target store; nothing here updates or deletes pre-existing rows.
--
-- TARGET IS PINNED TO ONE STORE ON PURPOSE.
--
-- This previously seeded whichever store was oldest, which on a real project
-- means the owner's actual shop. The target is now a hardcoded id, checked
-- three ways before a single row is written: it must not be one of the known
-- protected stores, it must exist, and its name must still match. Any mismatch
-- aborts the whole script — a DO block is one transaction, so an abort leaves
-- nothing behind.
--
-- To retarget, change `expected_store` AND `expected_name` together. Changing
-- only the id trips the name check, which is the point.

do $$
declare
  -- The only store this script may write to.
  expected_store constant uuid := 'e47fe6eb-8825-4612-965f-cb61b9be3864';
  expected_name  constant text := 'sandal local store';
  actual_name    text;
  target_store uuid;
  seller       uuid;
  new_sale     uuid;
  prod         products%rowtype;
  i            integer;
  j            integer;
  item_count   integer;
  qty          integer;
  sale_time    timestamptz;
  staff_rec    record;
  week_monday  date;
begin
  target_store := expected_store;

  -- Guard 1: the three real stores, named explicitly. Belt and braces next to
  -- the name check below, but it states the intent in a way nobody editing
  -- this file later can misread.
  if target_store in (
    'd046df4c-45b2-420b-90ef-ed02f21d1b68',  -- Neighborhood Market
    'e46a2aaa-6c92-4cba-9649-2ddda35f42fe',  -- corner grocer
    'aa595aa9-b89a-4101-a67d-166ea94a42d0'   -- sital
  ) then
    raise exception
      'Refusing to seed: % is a protected store. This script may only touch the test store (%).',
      target_store, expected_store;
  end if;

  -- Guard 2: the store has to be there at all.
  select name into actual_name from stores where id = target_store;

  if actual_name is null then
    raise exception
      'Refusing to seed: no store with id % exists. Check the id, or create the test store first.',
      target_store;
  end if;

  -- Guard 3: and it has to still be the store this id was verified against.
  -- Catches an id edited to point somewhere else, and a test store that was
  -- deleted and replaced by a different shop.
  if actual_name is distinct from expected_name then
    raise exception
      'Refusing to seed: store % is named "%", but this script expects "%". Aborting rather than writing to the wrong shop.',
      target_store, actual_name, expected_name;
  end if;

  -- Prefer the owner as the recorded seller; fall back to any member.
  select id into seller
  from profiles
  where store_id = target_store
  order by (role = 'owner') desc, created_at asc
  limit 1;

  if seller is null then
    raise exception 'Store % has no profiles attached.', target_store;
  end if;

  raise notice 'Seeding store %', target_store;

  -- ==========================================================
  -- PRODUCTS
  -- ==========================================================
  if exists (select 1 from products where store_id = target_store) then
    raise notice '  products: already populated, skipped';
  else
    insert into products
      (store_id, name, brand, sku, category, unit_price, unit, stock, low_stock_threshold, expiry_date)
    values
      (target_store, 'Bananas',            'Fresh Farms',   'PRD-001', 'produce',   0.59, 'lb',  140,  30, current_date + 5),
      (target_store, 'Gala Apples',        'Orchard Co',    'PRD-002', 'produce',   1.89, 'lb',   82,  25, current_date + 12),
      (target_store, 'Baby Spinach',       'Green Valley',  'PRD-003', 'produce',   3.49, 'bag',  18,  20, current_date + 4),
      (target_store, 'Roma Tomatoes',      'Fresh Farms',   'PRD-004', 'produce',   2.29, 'lb',   46,  20, current_date + 7),
      (target_store, 'Whole Milk',         'Dairy Best',    'PRD-005', 'dairy',     3.99, 'gal',  54,  20, current_date + 9),
      (target_store, 'Large Eggs',         'Happy Hen',     'PRD-006', 'dairy',     4.49, 'dz',   38,  24, current_date + 18),
      (target_store, 'Cheddar Block',      'Creamery Lane', 'PRD-007', 'dairy',     5.79, 'ea',    9,  12, current_date + 40),
      (target_store, 'Greek Yogurt',       'Dairy Best',    'PRD-008', 'dairy',     1.29, 'ea',   72,  30, current_date + 16),
      (target_store, 'Sourdough Loaf',     'Corner Bakery', 'PRD-009', 'packaged',  4.29, 'ea',   22,  15, current_date + 3),
      (target_store, 'Rolled Oats',        'Morning Fields','PRD-010', 'packaged',  3.19, 'ea',   64,  20, current_date + 200),
      (target_store, 'Spaghetti',          'Bella Cucina',  'PRD-011', 'packaged',  1.79, 'ea',   96,  25, current_date + 300),
      (target_store, 'Peanut Butter',      'Nutty Co',      'PRD-012', 'packaged',  4.99, 'ea',    7,  10, current_date + 240),
      (target_store, 'Orange Juice',       'Sunrise',       'PRD-013', 'beverages', 4.79, 'ea',   41,  18, current_date + 14),
      (target_store, 'Sparkling Water',    'Clearspring',   'PRD-014', 'beverages', 0.99, 'ea',  180,  40, current_date + 365),
      (target_store, 'Ground Coffee',      'Roast House',   'PRD-015', 'beverages', 8.99, 'ea',   26,  12, current_date + 180),
      (target_store, 'Paper Towels',       'HomeKeep',      'PRD-016', 'household', 6.49, 'ea',   33,  15, null),
      (target_store, 'Dish Soap',          'HomeKeep',      'PRD-017', 'household', 3.29, 'ea',    6,  12, null),
      (target_store, 'Laundry Detergent',  'BrightWash',    'PRD-018', 'household',11.99, 'ea',   19,  10, null);
    raise notice '  products: 18 inserted';
  end if;

  -- ==========================================================
  -- CUSTOMERS (Phase 4)
  -- ==========================================================
  if exists (select 1 from customers where store_id = target_store) then
    raise notice '  customers: already populated, skipped';
  else
    insert into customers
      (store_id, full_name, email, phone, loyalty_tier, total_spent, visits, notes, last_visit_at)
    values
      (target_store, 'Amara Okafor',      'amara.okafor@example.com',   '555-0142', 'platinum', 3184.50, 142, 'Weekly bulk shopper. Prefers pickup before 9am.', now() - interval '1 day'),
      (target_store, 'Daniel Reyes',      'daniel.reyes@example.com',   '555-0198', 'gold',     1746.25,  88, null,                                              now() - interval '3 day'),
      (target_store, 'Priya Raghavan',    'priya.r@example.com',        '555-0176', 'gold',     1502.80,  76, 'Allergy: peanuts. Flag mixed nut items.',         now() - interval '2 day'),
      (target_store, 'Marcus Bell',       'marcus.bell@example.com',    '555-0111', 'silver',    842.15,  41, null,                                              now() - interval '6 day'),
      (target_store, 'Ines Moreau',       'ines.moreau@example.com',    '555-0164', 'silver',    769.40,  38, 'Asks for the dairy delivery schedule.',           now() - interval '8 day'),
      (target_store, 'Tomas Novak',       'tomas.novak@example.com',    '555-0129', 'silver',    655.90,  33, null,                                              now() - interval '11 day'),
      (target_store, 'Grace Lin',         'grace.lin@example.com',      '555-0155', 'bronze',    318.60,  17, null,                                              now() - interval '5 day'),
      (target_store, 'Yusuf Demir',       'yusuf.demir@example.com',    '555-0183', 'bronze',    286.05,  15, 'New to the neighbourhood.',                       now() - interval '4 day'),
      (target_store, 'Helen Whitfield',   'helen.w@example.com',        '555-0137', 'bronze',    204.75,  12, null,                                              now() - interval '19 day'),
      (target_store, 'Oscar Mendes',      null,                         '555-0102', 'bronze',    141.20,   9, 'Cash only. No email on file.',                    now() - interval '14 day'),
      (target_store, 'Nadia Haddad',      'nadia.haddad@example.com',   null,       'bronze',     96.40,   6, null,                                              now() - interval '22 day'),
      (target_store, 'Walter Osei',       null,                         null,       'bronze',     38.90,   3, 'Walk-in, declined loyalty signup.',               now() - interval '27 day');
    raise notice '  customers: 12 inserted';
  end if;

  -- ==========================================================
  -- SALES + SALE ITEMS (last 14 days, for the dashboard trend chart)
  -- ==========================================================
  if exists (select 1 from sales where store_id = target_store) then
    raise notice '  sales: already populated, skipped';
  else
    for i in 1..70 loop
      sale_time := now() - (random() * 14) * interval '1 day';

      insert into sales (store_id, sold_by, total, payment_method, created_at)
      values (
        target_store,
        seller,
        0,
        (array['cash', 'card', 'nfc'])[1 + floor(random() * 3)::int],
        sale_time
      )
      returning id into new_sale;

      item_count := 1 + floor(random() * 4)::int;
      for j in 1..item_count loop
        select * into prod
        from products
        where store_id = target_store
        order by random()
        limit 1;

        qty := 1 + floor(random() * 3)::int;

        insert into sale_items
          (sale_id, product_id, product_name, quantity, unit_price, line_total)
        values
          (new_sale, prod.id, prod.name, qty, prod.unit_price, round(qty * prod.unit_price, 2));
      end loop;

      -- Keep the header total consistent with its line items.
      update sales
      set total = (select coalesce(sum(line_total), 0) from sale_items where sale_id = new_sale)
      where id = new_sale;
    end loop;
    raise notice '  sales: 70 inserted with line items';
  end if;

  -- ==========================================================
  -- SUPPLIERS  (+ incoming shipments and the activity feed)
  -- ==========================================================
  if exists (select 1 from suppliers where store_id = target_store) then
    raise notice '  suppliers: already populated, skipped';
  else
    insert into suppliers (store_id, name, primary_contact, category, status)
    values
      (target_store, 'Fresh Farms Produce',  'Maria Delgado',   'produce',   'active'),
      (target_store, 'Dairy Best Co-op',     'Tom Whelan',      'dairy',     'active'),
      (target_store, 'Corner Bakery Supply', 'Aisha Rahman',    'bakery',    'active'),
      -- One vendor deliberately in trouble: 'issue' sorts to the top of the
      -- table, so the status sort has something to demonstrate.
      (target_store, 'Highland Beverages',   'Ken Osei',        'beverages', 'issue'),
      (target_store, 'Pantry Wholesale',     'Ruth Lindqvist',  'dry_goods', 'active'),
      (target_store, 'Valley Greens',        'Sam Okafor',      'produce',   'inactive');
    raise notice '  suppliers: 6 inserted';

    -- Shipments span all four tracker stages. Two are due today so the
    -- "Arriving Today" badge and the Today's Inbound pallet counts are not
    -- empty; the 'dock' one is excluded from the incoming list by the page,
    -- which is what makes the received/pending split add up.
    insert into shipments (store_id, supplier_id, po_number, status, pallets, eta)
    select target_store, s.id, v.po, v.status, v.pallets, v.eta
    from (values
      ('PO-4417', 'transit', 6, current_date),
      ('PO-4418', 'dock',    4, current_date),
      ('PO-4419', 'shipped', 3, current_date + 1),
      ('PO-4420', 'ordered', 8, current_date + 3),
      ('PO-4421', 'transit', 2, current_date + 1)
    ) as v(po, status, pallets, eta)
    join lateral (
      select id from suppliers
      where store_id = target_store and status <> 'inactive'
      order by created_at
      offset (case v.po
                when 'PO-4417' then 0 when 'PO-4418' then 1
                when 'PO-4419' then 2 when 'PO-4420' then 3
                else 4 end)
      limit 1
    ) s on true;
    raise notice '  shipments: 5 inserted';

    insert into supplier_activity (store_id, supplier_id, supplier_name, message, created_at)
    select target_store, s.id, s.name, m.message, now() - m.ago
    from (values
      ('Fresh Farms Produce',  'PO-4417 left the depot and is in transit', interval '2 hours'),
      ('Highland Beverages',   'Delivery window missed — flagged as an issue', interval '9 hours'),
      ('Dairy Best Co-op',     'PO-4418 arrived at the dock', interval '1 day'),
      ('Corner Bakery Supply', 'Corner Bakery Supply added as a new supplier', interval '3 days')
    ) as m(supplier_name, message, ago)
    join suppliers s
      on s.store_id = target_store and s.name = m.supplier_name;
    raise notice '  supplier_activity: 4 inserted';
  end if;

  -- ==========================================================
  -- SHIFTS  (the ISO week containing today)
  -- ==========================================================
  if exists (select 1 from shifts where store_id = target_store) then
    raise notice '  shifts: already populated, skipped';
  else
    -- Monday of the current ISO week. The Staff page opens on this week, so
    -- seeding any other one would leave the grid looking empty.
    week_monday := current_date - (extract(isodow from current_date)::int - 1);

    i := 0;
    for staff_rec in
      select id from profiles where store_id = target_store order by created_at
    loop
      -- Alternating earlies and lates by index, so two people on the same day
      -- do not sit on top of each other in the grid.
      insert into shifts (store_id, staff_id, role_label, shift_date, start_time, end_time)
      select
        target_store,
        staff_rec.id,
        case (i % 3) when 0 then 'Tills' when 1 then 'Produce' else 'Stockroom' end,
        week_monday + d,
        case when (i % 2) = 0 then time '07:00' else time '13:00' end,
        case when (i % 2) = 0 then time '15:00' else time '21:00' end
      from generate_series(0, 4) as d;
      i := i + 1;
    end loop;

    -- One unassigned shift, so the UNASSIGNED warning state is visible
    -- without having to create a gap by hand.
    insert into shifts (store_id, staff_id, role_label, shift_date, start_time, end_time)
    values (target_store, null, 'Deliveries', week_monday + 5, time '06:00', time '10:00');

    raise notice '  shifts: % staff x 5 days, plus 1 unassigned', i;
  end if;

  raise notice 'Seed complete for store %', target_store;
end $$;
