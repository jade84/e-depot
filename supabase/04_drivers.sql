-- ============================================================
-- e-Depot — Quản lý nhân sự (tài xế) + kho ảnh
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.drivers (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name              text not null,
  cccd              text not null,                 -- số CCCD/CMND
  phone             text,
  dob               date,                          -- ngày sinh
  email             text,
  photo_cccd_front  text,                          -- ảnh CCCD mặt trước
  photo_cccd_back   text,                          -- ảnh CCCD mặt sau
  photo_face        text,                          -- ảnh khuôn mặt
  status            text not null default 'hoat_dong',  -- hoat_dong | cho_duyet
  created_at        timestamptz not null default now()
);

alter table public.drivers enable row level security;

drop policy if exists "own drivers select" on public.drivers;
drop policy if exists "own drivers insert" on public.drivers;
drop policy if exists "own drivers update" on public.drivers;
drop policy if exists "own drivers delete" on public.drivers;
create policy "own drivers select" on public.drivers for select using (auth.uid() = owner_id);
create policy "own drivers insert" on public.drivers for insert with check (auth.uid() = owner_id);
create policy "own drivers update" on public.drivers for update using (auth.uid() = owner_id);
create policy "own drivers delete" on public.drivers for delete using (auth.uid() = owner_id);

-- ── Kho ảnh (Storage) ──
insert into storage.buckets (id, name, public)
values ('drivers', 'drivers', true)
on conflict (id) do nothing;

drop policy if exists "drivers img read"   on storage.objects;
drop policy if exists "drivers img insert" on storage.objects;
drop policy if exists "drivers img delete" on storage.objects;
create policy "drivers img read" on storage.objects
  for select using (bucket_id = 'drivers');
create policy "drivers img insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'drivers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "drivers img delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'drivers' and (storage.foldername(name))[1] = auth.uid()::text);
