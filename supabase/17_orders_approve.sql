-- ============================================================
-- e-Depot — Admin duyệt đơn: cho phép admin đọc & cập nhật MỌI đơn.
-- Đơn mới có trang_thai='cho_duyet', admin đổi 'chua_tt' (duyệt) / 'tu_choi'.
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
