-- ============================================================
-- e-Depot — Đơn hàng cổng (Lấy / Trả cont rỗng) + kho ảnh
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  loai         text not null,                       -- 'lay' (Gate Out) | 'tra' (Gate In)
  so_bl        text,                                -- số B/L // vận đơn
  depot        text,
  hang_tau     text,
  loai_cont    text,
  so_luong     int not null default 1,
  vehicle_id   uuid references public.vehicles(id) on delete set null,
  bien_so      text,                                -- chụp lại biển số lúc tạo đơn
  driver_id    uuid references public.drivers(id) on delete set null,
  tai_xe_ten   text,
  tai_xe_cccd  text,
  cong_ty_hd   text,                                -- công ty xuất hóa đơn
  mst          text,
  photos       text[] not null default '{}',        -- ảnh lệnh lấy rỗng / EIR
  phi_nang_ha  numeric not null default 0,
  trang_thai   text not null default 'cho_duyet',   -- cho_duyet | tu_choi | chua_tt | da_tt | huy
  created_at   timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "own orders select" on public.orders;
drop policy if exists "own orders insert" on public.orders;
drop policy if exists "own orders update" on public.orders;
drop policy if exists "own orders delete" on public.orders;
create policy "own orders select" on public.orders for select using (auth.uid() = owner_id);
create policy "own orders insert" on public.orders for insert with check (auth.uid() = owner_id);
create policy "own orders update" on public.orders for update using (auth.uid() = owner_id);
create policy "own orders delete" on public.orders for delete using (auth.uid() = owner_id);

-- ── Kho ảnh (Storage) ──
insert into storage.buckets (id, name, public)
values ('orders', 'orders', true)
on conflict (id) do nothing;

drop policy if exists "orders img read"   on storage.objects;
drop policy if exists "orders img insert" on storage.objects;
drop policy if exists "orders img delete" on storage.objects;
create policy "orders img read" on storage.objects
  for select using (bucket_id = 'orders');
create policy "orders img insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'orders' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "orders img delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'orders' and (storage.foldername(name))[1] = auth.uid()::text);
