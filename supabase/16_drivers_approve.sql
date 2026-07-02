-- ============================================================
-- e-Depot — Admin duyệt tài xế: cho phép admin đọc & cập nhật MỌI tài xế.
-- Tài xế mới tạo có status='cho_duyet', admin đổi 'hoat_dong'/'tu_choi'.
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

drop policy if exists "drivers admin all" on public.drivers;
create policy "drivers admin all" on public.drivers for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
