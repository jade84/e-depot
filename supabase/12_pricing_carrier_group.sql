-- ============================================================
-- e-Depot — Bảng giá áp theo NHÓM hãng tàu (Nội địa/Quốc tế) thay vì từng hãng.
-- Thay cột pricing.hang_tau (hãng cụ thể) → hang_tau_nhom.
-- Chạy 1 lần trong SQL Editor (sau 10_pricing_drop_loai.sql).
-- ============================================================

drop index if exists pricing_key;
alter table public.pricing drop column if exists hang_tau;
alter table public.pricing add column if not exists hang_tau_nhom text;  -- null | 'noi_dia' | 'quoc_te'

create unique index if not exists pricing_key
  on public.pricing (loai_cont, coalesce(depot, ''), coalesce(hang_tau_nhom, ''));
