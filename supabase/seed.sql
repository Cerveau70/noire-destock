-- Basic seed data for demo (requires existing profiles/products)
-- NOTE: This script uses existing rows. Ensure at least one profile and one product exist.

-- Tickets
insert into public.tickets (user_id, user_role, type, subject, description, status)
select p.id, p.role, 'FEATURE', 'Export CSV avancé', 'Ajouter filtres par dates et formats.', 'PENDING'
from public.profiles p
limit 1;

-- Messages (B2B)
insert into public.messages (thread_id, from_id, from_name, subject, body, status)
select gen_random_uuid(), p.id, p.full_name, 'Négociation stock riz', 'Bonjour, je veux 30 sacs. Quel prix ?', 'UNREAD'
from public.profiles p
limit 1;

-- Reviews
insert into public.reviews (product_id, user_id, user_name, rating, comment)
select pr.id, p.id, p.full_name, 5, 'Excellent rapport qualité/prix.'
from public.products pr
cross join public.profiles p
limit 1;

-- Orders + Order items + Status
do $$
declare
  buyer_id uuid;
  seller_id uuid;
  prod_id uuid;
  order_id uuid;
  item_id uuid;
begin
  select id into buyer_id from public.profiles limit 1;
  select id into seller_id from public.profiles offset 1 limit 1;
  if seller_id is null then
    seller_id := buyer_id;
  end if;
  select id into prod_id from public.products limit 1;

  insert into public.orders (buyer_id, total_amount, status, payment_method, seller_id)
  values (buyer_id, 12000, 'PAID', 'WALLET', seller_id)
  returning id into order_id;

  insert into public.order_items (order_id, product_id, seller_id, quantity, price)
  values (order_id, prod_id, seller_id, 2, 6000)
  returning id into item_id;

  insert into public.order_item_status (order_item_id, status, note)
  values (item_id, 'PAID', 'Paiement confirmé');
end $$;

-- Deliveries + Events
do $$
declare
  seller_id uuid;
  delivery_id uuid;
begin
  select id into seller_id from public.profiles limit 1;
  insert into public.deliveries (seller_id, customer_name, address, amount, status, driver_name, eta)
  values (seller_id, 'Client Démo', 'Cocody', 12000, 'EN_ROUTE', 'Livreur 1', '30 min')
  returning id into delivery_id;

  insert into public.delivery_events (delivery_id, status, note)
  values (delivery_id, 'EN_ROUTE', 'Coursier en route');
end $$;
