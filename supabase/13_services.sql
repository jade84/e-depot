-- ============================================================
-- e-Depot — Dịch vụ công ty (hiển thị ở trang Thông tin, admin CRUD)
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.services (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  mo_ta      text,                          -- mô tả ngắn (hiện ở danh sách)
  noi_dung   text,                          -- nội dung chi tiết (điền sau)
  icon       text not null default 'container',
  sort       int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

-- ĐỌC: user đăng nhập thấy dịch vụ đang bật; admin thấy tất cả.
drop policy if exists "services read" on public.services;
create policy "services read" on public.services for select to authenticated
  using (active or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- GHI: chỉ admin.
drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Seed 5 dịch vụ (theo grlogs.com) — sửa/xoá trong Admin → Dịch vụ.
insert into public.services (title, mo_ta, icon, sort) values
  ('Green Centers & Depots', 'Cho thuê kho bãi, depot container.',        'warehouse', 0),
  ('Green Warehousing',      'Giải pháp lưu kho cho khách hàng.',         'boxes',     1),
  ('Green Distribution',     'Giao hàng xe tải nhỏ, giao lẻ.',            'package',   2),
  ('Green Transportation',   'Vận tải hàng hóa nội địa & quốc tế.',       'ship',      3),
  ('Green Trucking',         'Đóng hàng & vận chuyển container nội địa.',  'truck',     4)
on conflict do nothing;
