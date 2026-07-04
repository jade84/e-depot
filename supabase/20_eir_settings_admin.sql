-- ============================================================
-- e-Depot — Cho admin (hoặc user có quyền 'eir_form') SỬA cấu hình mẫu phiếu EIR.
-- Bảng eir_settings ban đầu (19_eir.sql) chỉ mở SELECT cho authenticated;
-- file này thêm quyền GHI cho khu quản trị (trang "Sửa mẫu EIR").
-- Chạy 1 lần trong SQL Editor (sau 18_permissions.sql và 19_eir.sql).
-- ============================================================

drop policy if exists "eir_settings admin write" on public.eir_settings;
create policy "eir_settings admin write" on public.eir_settings for all to authenticated
  using (public.has_perm('eir_form'))
  with check (public.has_perm('eir_form'));
