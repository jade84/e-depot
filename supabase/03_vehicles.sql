-- ============================================================
-- e-Depot — Quản lý phương tiện (xe) + kho ảnh
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name         text,                                 -- tên xe (VD "Xe số 10")
  plate        text not null,                        -- biển số
  photos_xe    text[] not null default '{}',         -- URL ảnh xe
  photos_giay  text[] not null default '{}',         -- URL ảnh cà vẹt / đăng kiểm
  driver_id    uuid,                                 -- tài xế gán vào xe (bước sau)
  status       text not null default 'cho_duyet',    -- cho_duyet | kich_hoat
  created_at   timestamptz not null default now()
);

alter table public.vehicles enable row level security;

-- Nhà xe chỉ thao tác trên xe của chính mình
drop policy if exists "own vehicles select" on public.vehicles;
drop policy if exists "own vehicles insert" on public.vehicles;
drop policy if exists "own vehicles update" on public.vehicles;
drop policy if exists "own vehicles delete" on public.vehicles;
create policy "own vehicles select" on public.vehicles for select using (auth.uid() = owner_id);
create policy "own vehicles insert" on public.vehicles for insert with check (auth.uid() = owner_id);
create policy "own vehicles update" on public.vehicles for update using (auth.uid() = owner_id);
create policy "own vehicles delete" on public.vehicles for delete using (auth.uid() = owner_id);

-- ── Kho ảnh (Storage) ──
insert into storage.buckets (id, name, public)
values ('vehicles', 'vehicles', true)
on conflict (id) do nothing;

-- Ai cũng xem được ảnh (public); chỉ chủ mới upload/xoá vào thư mục của mình (userId/...)
drop policy if exists "vehicles img read"   on storage.objects;
drop policy if exists "vehicles img insert" on storage.objects;
drop policy if exists "vehicles img delete" on storage.objects;
create policy "vehicles img read" on storage.objects
  for select using (bucket_id = 'vehicles');
create policy "vehicles img insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicles img delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);
