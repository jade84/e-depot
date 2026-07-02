-- ============================================================
-- e-Depot — Phân nhóm hãng tàu (Nội địa / Quốc tế)
-- Cột nhom chỉ dùng cho type='carrier'. Chạy 1 lần trong SQL Editor.
-- ============================================================

alter table public.catalog add column if not exists nhom text;  -- 'noi_dia' | 'quoc_te'

-- (tuỳ chọn) gợi ý phân nhóm ban đầu — sửa lại trong Admin → Danh mục:
-- update public.catalog set nhom = 'noi_dia' where type='carrier' and name in ('VIMC','SITC','WAN HAI');
-- update public.catalog set nhom = 'quoc_te' where type='carrier' and nhom is null;
