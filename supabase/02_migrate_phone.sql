-- ============================================================
-- e-Depot — Migration: đổi đăng nhập từ CCCD sang SỐ ĐIỆN THOẠI
-- Chạy MỘT LẦN vì DB đã tạo bảng users theo bản cũ (có cột account).
-- ============================================================

-- 1) Thêm cột cccd, bỏ cột account (không còn dùng làm tài khoản)
alter table public.users add column if not exists cccd text;
alter table public.users drop column if exists account;

-- 2) phone trở thành khoá đăng nhập: bắt buộc + duy nhất
alter table public.users alter column phone set not null;
create unique index if not exists users_phone_key on public.users(phone);

-- 3) Cập nhật hàm tạo hồ sơ tự động (dùng phone + cccd)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, phone, name, cccd)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'phone', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'cccd'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- 4) (Tuỳ chọn) Xoá tài khoản test cũ đã đăng ký theo CCCD để đăng ký lại sạch:
--    Bỏ dấu -- ở dòng dưới rồi chạy nếu muốn xoá SẠCH mọi user test.
-- delete from auth.users;
