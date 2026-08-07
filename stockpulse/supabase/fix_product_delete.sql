-- Fix: deleting a product that had ever been sold failed with FK error 23503
-- ("still referenced from table sale_items").
--
-- sale_items already snapshots product_name, unit_price and line_total at the
-- time of sale, so sales history stays fully intact when the product row goes
-- away. We therefore allow product_id to become NULL instead of blocking the
-- delete.

alter table sale_items
  drop constraint if exists sale_items_product_id_fkey;

alter table sale_items
  alter column product_id drop not null;

alter table sale_items
  add constraint sale_items_product_id_fkey
  foreign key (product_id) references products(id) on delete set null;
