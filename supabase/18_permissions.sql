-- ============================================================
-- e-Depot — Phân quyền chi tiết cho nhân sự quản trị.
-- users.perms = danh sách quyền (text[]); role='admin' = full quyền.
-- Rewire các policy GHI của khu quản trị để kiểm theo quyền chi tiết.
-- Chạy 1 lần trong SQL Editor (sau các file 07..17).
-- ============================================================

alter table public.users add column if not exists perms text[] not null default '{}';

-- Admin? (security definer để không đệ quy RLS trên bảng users)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- Có quyền p? (admin = full quyền)
create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and (role = 'admin' or p = any(perms))
  );
$$;

-- Có bất kỳ quyền nào trong danh sách?
create or replace function public.has_any_perm(ps text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and (role = 'admin' or perms && ps)
  );
$$;

-- ── users: admin/permissions đọc & sửa mọi user (để phân quyền) ──
drop policy if exists "users admin select" on public.users;
drop policy if exists "users admin update" on public.users;
create policy "users admin select" on public.users for select using (public.has_perm('permissions'));
create policy "users admin update" on public.users for update using (public.has_perm('permissions')) with check (public.has_perm('permissions'));

-- ── pricing ──
drop policy if exists "pricing read" on public.pricing;
create policy "pricing read" on public.pricing for select to authenticated using (active or public.has_perm('pricing'));
drop policy if exists "pricing admin write" on public.pricing;
create policy "pricing admin write" on public.pricing for all to authenticated
  using (public.has_perm('pricing')) with check (public.has_perm('pricing'));

-- ── catalog ──
drop policy if exists "catalog read" on public.catalog;
create policy "catalog read" on public.catalog for select to authenticated using (active or public.has_perm('catalog'));
drop policy if exists "catalog admin write" on public.catalog;
create policy "catalog admin write" on public.catalog for all to authenticated
  using (public.has_perm('catalog')) with check (public.has_perm('catalog'));

-- ── services ──
drop policy if exists "services read" on public.services;
create policy "services read" on public.services for select to authenticated using (active or public.has_perm('services'));
drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services for all to authenticated
  using (public.has_perm('services')) with check (public.has_perm('services'));

-- ── settings: bank_info / company_info / vat_percent (gộp quyền bank/contact/pricing) ──
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all to authenticated
  using (public.has_any_perm(array['bank','contact','pricing']))
  with check (public.has_any_perm(array['bank','contact','pricing']));

-- ── vehicles / drivers / orders: theo quyền duyệt tương ứng ──
drop policy if exists "vehicles admin all" on public.vehicles;
create policy "vehicles admin all" on public.vehicles for all to authenticated
  using (public.has_perm('approve_vehicle')) with check (public.has_perm('approve_vehicle'));

drop policy if exists "drivers admin all" on public.drivers;
create policy "drivers admin all" on public.drivers for all to authenticated
  using (public.has_perm('approve_driver')) with check (public.has_perm('approve_driver'));

drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders for all to authenticated
  using (public.has_perm('approve_order')) with check (public.has_perm('approve_order'));

-- ── notifications: người có quyền duyệt bất kỳ được tạo thông báo ──
drop policy if exists "notif admin insert" on public.notifications;
create policy "notif admin insert" on public.notifications for insert to authenticated
  with check (public.has_any_perm(array['approve_vehicle','approve_driver','approve_order']));
