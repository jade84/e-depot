-- ============================================================
-- e-Depot — Tự động xoá phiếu EIR cũ theo số tháng cấu hình ở trang "Mẫu EIR".
-- (TUỲ CHỌN) Chạy 1 lần khi muốn bật tính năng dọn phiếu cũ.
-- Số tháng đọc từ eir_settings.retention_months (admin đổi ở app, có hiệu lực ngay).
--   retention_months = 0 (hoặc trống) => KHÔNG xoá gì.
-- ============================================================

-- Hàm dọn: xoá phiếu có created_at cũ hơn N tháng. Trả về số dòng đã xoá.
create or replace function public.eir_cleanup()
returns integer language plpgsql security definer set search_path = public as $$
declare
  m integer;
  d integer;
begin
  select coalesce(nullif(value, '')::integer, 0) into m
  from public.eir_settings where key = 'retention_months';

  if m is null or m <= 0 then
    return 0;                      -- 0 = giữ mãi
  end if;

  with del as (
    delete from public.eir
    where created_at < now() - (m || ' months')::interval
    returning 1
  )
  select count(*) into d from del;
  return d;
end $$;

-- Lịch chạy hằng ngày 03:00 (giờ server UTC) bằng pg_cron.
create extension if not exists pg_cron;

-- Gỡ lịch cũ (nếu chạy lại file này) rồi đặt lại.
select cron.unschedule('eir-cleanup-daily')
where exists (select 1 from cron.job where jobname = 'eir-cleanup-daily');

select cron.schedule('eir-cleanup-daily', '0 3 * * *', $$ select public.eir_cleanup(); $$);

-- Muốn chạy thử ngay: select public.eir_cleanup();
-- Muốn tắt sau này:  select cron.unschedule('eir-cleanup-daily');
