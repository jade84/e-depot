-- ============================================================
-- e-Depot — Bảng danh mục dùng chung (depot / hãng tàu / loại cont)
-- Sau này trang Admin chỉ cần CRUD bảng này, form tự cập nhật.
-- Chạy 1 lần trong SQL Editor.
-- ============================================================

create table if not exists public.catalog (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,               -- 'depot' | 'carrier' | 'cont_type'
  name       text not null,
  sort       int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists catalog_type_name_key on public.catalog(type, name);

alter table public.catalog enable row level security;

-- Ai đăng nhập cũng ĐỌC được danh mục (dùng chung cho mọi nhà xe)
drop policy if exists "catalog read" on public.catalog;
create policy "catalog read" on public.catalog for select to authenticated using (active);
-- Ghi: hiện quản lý qua Dashboard; khi có trang Admin sẽ thêm policy cho vai trò admin.

-- ── Seed dữ liệu ban đầu ──
insert into public.catalog (type, name, sort) values
  ('depot', 'GreenLogistics Depot', 0)
on conflict (type, name) do nothing;

insert into public.catalog (type, name, sort) values
  ('carrier','VIMC',0),('carrier','CMA CGM',1),('carrier','COSCO',2),('carrier','MAERSK',3),
  ('carrier','ONE',4),('carrier','EVERGREEN',5),('carrier','HAPAG-LLOYD',6),('carrier','MSC',7),
  ('carrier','YANG MING',8),('carrier','OOCL',9),('carrier','HMM',10),('carrier','SITC',11),
  ('carrier','WAN HAI',12),('carrier','Khác',99)
on conflict (type, name) do nothing;

insert into public.catalog (type, name, sort) values
  ('cont_type','20''DC',0),('cont_type','40''DC',1),('cont_type','40''HC',2),('cont_type','45''HC',3),
  ('cont_type','20''RF',4),('cont_type','40''RF',5),('cont_type','20''OT',6),('cont_type','40''OT',7),
  ('cont_type','20''FR',8),('cont_type','40''FR',9)
on conflict (type, name) do nothing;
