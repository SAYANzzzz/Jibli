alter table public.cart_items
drop constraint if exists cart_items_shop_check;

alter table public.cart_items
add constraint cart_items_shop_check
check (shop in ('aliexpress', 'shein'));
