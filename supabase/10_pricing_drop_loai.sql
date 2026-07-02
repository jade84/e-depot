-- ============================================================
-- e-Depot — Bỏ tách Lấy/Trả trong bảng giá (giá nâng hạ như nhau)
-- Đơn giá chỉ theo loại cont (+ depot/hãng tàu tuỳ chọn), CHƯA VAT.
-- Chạy 1 lần trong SQL Editor (sau 07_pricing.sql).
-- ============================================================

-- 1) Gộp dòng trùng (loai_cont, depot, hãng tàu) — giữ 1 dòng, tránh vỡ unique index.
delete from public.pricing a using public.pricing b
 where a.ctid < b.ctid
   and a.loai_cont = b.loai_cont
   and coalesce(a.depot, '')   = coalesce(b.depot, '')
   and coalesce(a.hang_tau, '') = coalesce(b.hang_tau, '');

-- 2) Bỏ cột loai + dựng lại unique index không còn loai.
drop index if exists pricing_key;
alter table public.pricing drop column if exists loai;
create unique index if not exists pricing_key
  on public.pricing (loai_cont, coalesce(depot, ''), coalesce(hang_tau, ''));
