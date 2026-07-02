-- ============================================================
-- e-Depot — Cấu hình chung dạng key-value (settings)
-- Dùng cho: thông tin ngân hàng nhận thanh toán (key = 'bank_info'), …
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- ĐỌC: mọi user đăng nhập (nhà xe cần đọc để hiện QR/ số TK).
drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select to authenticated using (true);

-- GHI: CHỈ admin.
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Giá trị mặc định (sửa lại trong trang Admin → Thông tin ngân hàng).
insert into public.settings (key, value) values
  ('bank_info', '{"bankId":"VCB","accountNo":"1234567890","accountName":"CONG TY GREENLOGISTICS","bankName":"Vietcombank"}'::jsonb)
on conflict (key) do nothing;
