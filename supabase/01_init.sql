-- ============================================================
-- e-Depot — Khởi tạo bảng người dùng (đăng nhập bằng SỐ ĐIỆN THOẠI)
-- Chạy 1 lần cho project MỚI. (DB đã tạo trước đó → dùng 02_migrate_phone.sql)
-- ============================================================

create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text unique not null,                -- số điện thoại (đăng nhập)
  name       text not null default '',
  cccd       text,                                -- số CCCD/CMND (thủ tục tại depot)
  role       text not null default 'driver',      -- driver | company | admin
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "read own profile"   on public.users;
drop policy if exists "update own profile" on public.users;
create policy "read own profile"   on public.users for select using (auth.uid() = id);
create policy "update own profile" on public.users for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, phone, name, cccd)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'phone', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'cccd'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
