-- ============================================================
-- e-Depot — Bảng giá (đơn giá phí nâng/hạ) do Admin quản lý
-- Tự điền phi_nang_ha khi nhà xe tạo đơn Lấy/Trả cont.
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

-- Giá nâng hạ Lấy & Trả như nhau → không tách theo nghiệp vụ. Đơn giá CHƯA VAT.
create table if not exists public.pricing (
  id         uuid primary key default gen_random_uuid(),
  loai_cont  text not null,               -- '20''DC', '40''HC', ...
  depot      text,                         -- null = áp dụng MỌI depot
  hang_tau   text,                         -- null = áp dụng MỌI hãng tàu
  don_gia    numeric not null default 0,   -- phí / 1 cont (VND, CHƯA VAT)
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Mỗi tổ hợp (loai_cont, depot, hang_tau) chỉ 1 dòng.
-- coalesce để null (mọi depot/hãng tàu) cũng nằm trong ràng buộc unique.
create unique index if not exists pricing_key
  on public.pricing (loai_cont, coalesce(depot,''), coalesce(hang_tau,''));

alter table public.pricing enable row level security;

-- ĐỌC: mọi user đăng nhập đọc được dòng đang bật; admin đọc được cả dòng tắt (để quản lý).
drop policy if exists "pricing read" on public.pricing;
create policy "pricing read" on public.pricing for select to authenticated
  using (
    active
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- GHI (insert/update/delete): CHỈ admin.
drop policy if exists "pricing admin write" on public.pricing;
create policy "pricing admin write" on public.pricing for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ── Cấp quyền admin cho 1 tài khoản (thay <UID> bằng id trong bảng users) ──
-- update public.users set role = 'admin' where id = '<UID>';

-- ── Seed ví dụ (tuỳ chọn — sửa/xoá theo giá thực tế, CHƯA VAT) ──
-- insert into public.pricing (loai_cont, don_gia) values
--   ('20''DC', 200000), ('40''DC', 300000), ('40''HC', 350000)
-- on conflict do nothing;
