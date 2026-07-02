-- ============================================================
-- e-Depot — Thông báo gửi cho nhà xe (vd: lý do từ chối duyệt xe)
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,  -- người nhận
  title      text not null,
  body       text,
  type       text,                          -- 'vehicle_reject' | ...
  ref_id     uuid,                          -- id bản ghi liên quan (vd vehicle)
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_owner_idx on public.notifications (owner_id, created_at desc);

alter table public.notifications enable row level security;

-- Người nhận đọc / cập nhật (đánh dấu đã đọc) / xoá thông báo của mình.
drop policy if exists "notif select own" on public.notifications;
drop policy if exists "notif update own" on public.notifications;
drop policy if exists "notif delete own" on public.notifications;
create policy "notif select own" on public.notifications for select using (auth.uid() = owner_id);
create policy "notif update own" on public.notifications for update using (auth.uid() = owner_id);
create policy "notif delete own" on public.notifications for delete using (auth.uid() = owner_id);

-- Admin tạo thông báo cho bất kỳ nhà xe nào.
drop policy if exists "notif admin insert" on public.notifications;
create policy "notif admin insert" on public.notifications for insert to authenticated
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
