-- ============================================================
-- e-Depot — Bảng phiếu EIR (tra cứu & in lại) dùng CHUNG với hệ thống e-EIR.
--
-- Nguồn ghi: server e-EIR (FastAPI) nhận phiếu từ agent (máy cảng bắt lệnh in
-- qua clawPDF) rồi INSERT vào 2 bảng này qua kết nối Postgres trực tiếp
-- (role postgres → BỎ QUA RLS, nên không cần policy INSERT ở đây).
-- Nguồn đọc: app e-depot (supabase-js, role authenticated) → chỉ cần policy SELECT.
--
-- Chạy 1 lần trong Supabase SQL Editor (project của e-depot).
-- ============================================================

-- 1) Phiếu EIR (mỗi lần in = 1 dòng; id = content_hash chống trùng) --------------
create table if not exists public.eir (
  id           text primary key,            -- = content_hash (sha256 rút gọn)
  so_phieu     text,
  container_no text,
  bien_so      text,
  ngay         text,
  tinh_trang   text,
  fields_json  jsonb not null default '{}'::jsonb,  -- toàn bộ field đã tách
  raw_text     text,                         -- text gốc trích từ PDF (để tìm rộng)
  pdf_url      text,
  pdf_ref      text,
  created_at   timestamptz not null default now()
);
create index if not exists eir_container_idx on public.eir (container_no);
create index if not exists eir_bienso_idx    on public.eir (bien_so);
create index if not exists eir_sophieu_idx   on public.eir (so_phieu);
create index if not exists eir_created_idx   on public.eir (created_at desc);

alter table public.eir enable row level security;

-- Mọi người dùng ĐÃ ĐĂNG NHẬP của e-depot được tra cứu phiếu.
drop policy if exists "eir select authed" on public.eir;
create policy "eir select authed" on public.eir for select to authenticated using (true);

-- 2) Cấu hình công ty cho mẫu phiếu EIR (key-value; do e-EIR /settings ghi) -------
--    Tên bảng `eir_settings` để KHÔNG đụng bảng `settings` của e-depot.
create table if not exists public.eir_settings (
  key   text primary key,
  value text not null default ''
);

alter table public.eir_settings enable row level security;

drop policy if exists "eir_settings select authed" on public.eir_settings;
create policy "eir_settings select authed" on public.eir_settings for select to authenticated using (true);

-- Ghi chú: nếu muốn phiếu cho phép quét QR xem KHÔNG cần đăng nhập, thêm role
-- `anon` vào 2 policy select ở trên (đổi `to authenticated` -> `to anon, authenticated`).
