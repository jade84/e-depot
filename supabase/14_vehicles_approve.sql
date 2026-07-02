-- ============================================================
-- e-Depot — Admin duyệt xe: cho phép admin đọc & cập nhật MỌI xe.
-- Xe mới tạo có status='cho_duyet' (mặc định bảng), admin đổi sang
-- 'kich_hoat' hoặc 'tu_choi'. Chạy 1 lần trong SQL Editor.
-- ============================================================

drop policy if exists "vehicles admin all" on public.vehicles;
create policy "vehicles admin all" on public.vehicles for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
