-- ============================================================
-- e-Depot — Cho phép Admin quản lý danh mục (catalog)
-- Bổ sung cho 06_catalog.sql: admin đọc cả dòng đang tắt + quyền ghi.
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

-- ĐỌC: user thường chỉ thấy dòng active; admin thấy tất cả (để quản lý).
drop policy if exists "catalog read" on public.catalog;
create policy "catalog read" on public.catalog for select to authenticated
  using (
    active
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- GHI (insert/update/delete): CHỈ admin.
drop policy if exists "catalog admin write" on public.catalog;
create policy "catalog admin write" on public.catalog for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
