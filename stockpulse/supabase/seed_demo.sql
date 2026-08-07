-- StockPulse demo seed data
-- Run in the Supabase SQL editor AFTER schema.sql, schema_phase2.sql,
-- schema_phase3.sql and schema_phase4.sql.
--
-- Safe to re-run. Each section fills a table only when that table is empty for
-- the target store; nothing here updates or deletes pre-existing rows.
--
-- Targets the oldest store by default. To seed a different one, replace the
-- `select id into target_store ...` line with:
--     target_store := '<your-store-uuid>';

do $$
declare
  target_store uuid;
  seller       uuid;
  new_sale     uuid;
  prod         products%rowtype;
  i            integer;
  j            integer;
  item_count   integer;
  qty          integer;
  sale_time    timestamptz;
begin
  select id into target_store from stores order by created_at asc limit 1;
  if target_store is null then
    raise exception 'No store found. Create an account in the app first, then re-run this script.';
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

  raise notice 'Seed complete for store %', target_store;
end $$;
