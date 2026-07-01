# e-Depot — Ghi chú dự án (cho Claude)

App **mobile PWA** cho **GreenLogistics** — số hoá nghiệp vụ depot container cho **nhà xe / tài xế**
(đăng ký xe, tài xế, đăng ký Lấy/Trả cont rỗng, đơn hàng, thanh toán). Tham chiếu UX theo app "e-Depot"
(hệ thống GenuinePartner) mà khách đang dùng.

## Stack
- React 19 + TypeScript + Vite 8 (rolldown) + React Router 7
- TailwindCSS v4 (`@theme` trong `src/index.css`) — màu thương hiệu `brand-*` = **xanh GreenLogistics** (#16a34a)
- Supabase (Postgres + Auth + Storage) — `@supabase/supabase-js`
- TanStack React Query (data layer trong `src/features/*`)
- PWA (`vite-plugin-pwa`), quét QR: `jsqr` + `BarcodeDetector`
- pnpm. **Thiết kế mobile-first**, khung `max-w-[480px]`.

## Chạy dev
```
# PATH cho session mới (nếu lệnh node/pnpm not found):
$env:PATH = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"
pnpm install    # dùng CI=true nếu lỗi TTY
pnpm dev        # server host=true, mở được từ điện thoại cùng WiFi
pnpm build      # tsc + vite build (luôn chạy để kiểm lỗi TS trước khi báo xong)
```

## Supabase
- Project ref: **vjrzqnbnydmrpjypoyzc** — URL `https://vjrzqnbnydmrpjypoyzc.supabase.co`
- Key kiểu mới: `sb_publishable_...` (dùng như anon key). Cấu hình ở `.env.local` (KHÔNG commit).
- Auth: **đăng nhập bằng SỐ ĐIỆN THOẠI** → map sang email nội bộ `<phone>@edepot.local`. Đã **tắt Confirm email**.
- **SQL để trong `supabase/*.sql`** — chạy thủ công qua Dashboard SQL Editor (không có migration tự động):
  - `01_init.sql` users (phone/name/cccd) + trigger tạo hồ sơ khi signUp
  - `03_vehicles.sql`, `04_drivers.sql`, `05_orders.sql`, `06_catalog.sql` (bảng + RLS + storage bucket public)
  - `orders` có thêm cột `so_cont text[]` (ALTER — xem lịch sử chat/commit)
- **RLS**: mỗi bản ghi thuộc `owner_id = auth.uid()` (nhà xe chỉ thấy dữ liệu của mình). `catalog` đọc chung cho mọi user.
- Storage buckets **public**: `vehicles`, `drivers`, `orders`. Policy: đọc public, ghi/xoá trong thư mục `<uid>/...`.

## Data model (bảng)
- `users` (hồ sơ, 1-1 auth.users) · `vehicles` (xe) · `drivers` (tài xế) · `orders` (Lấy/Trả cont) · `catalog` (danh mục dùng chung)
- `vehicles.driver_id` → gán tài xế. `orders.loai` = `'lay'` | `'tra'`, `trang_thai` mặc định `cho_duyet`.

## Tính năng đã xong
- Auth: đăng ký (tên/SĐT/CCCD/mật khẩu) + đăng nhập bằng SĐT. Có chế độ demo khi thiếu Supabase.
- Trang chủ lưới nghiệp vụ + bottom nav (nút GIỮA = logo GreenLogs về trang chủ). Đã bỏ Cửa hàng/Quà tặng.
- **Quản lý phương tiện**: thêm/xoá xe (ảnh xe + cà vẹt), gán tài xế, danh sách. Xe tạo ra = **kích hoạt ngay** (bỏ duyệt).
- **Quản lý nhân sự**: thêm/xoá tài xế (ảnh khuôn mặt + CCCD trước/sau). **Quét QR CCCD/Căn cước** (mặt sau với thẻ mới) tự điền + **đối chiếu** khi lưu.
- **Lấy cont rỗng** (`/lay-cont`) và **Trả cont rỗng** (`/tra-cont`, nhập nhiều số cont ISO 6346) → tạo `orders`.
- **Đơn hàng** (`/don-hang`): danh sách + hủy đơn.

## Quy ước quan trọng (ĐỪNG phá vỡ)
- **Ảnh: upload-NGAY khi chọn** (component `PhotoUploadSlot`) → state giữ URL (chuỗi), KHÔNG giữ File.
  Lý do: mở camera trên điện thoại hay làm reload trang → giữ File sẽ mất ảnh.
- **Lưu nháp form** vào `sessionStorage` (draft_*) gồm cả URL ảnh → reload không mất dữ liệu. Xoá nháp khi Lưu/Hủy.
- Danh mục (depot/hãng tàu/loại cont) đọc từ bảng `catalog` qua `useCatalog(type)`, fallback `src/lib/options.ts`.
- `crypto.randomUUID` chỉ có ở https/localhost → dùng fallback trong `src/lib/storage.ts` (uid()).
- React Query: `refetchOnMount:'always'` + `refetchOnWindowFocus:true` để dữ liệu đồng bộ giữa các thiết bị.
- Validate ở `src/lib/validate.ts`: SĐT (10 số/đầu 0), CCCD (9/12 số), biển số, số cont ISO 6346, ngày DD/MM/YYYY.

## Deploy
- GitHub: **jade84/e-depot** (main). `vercel.json` có SPA rewrite.
- Vercel: import repo + 2 env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (đúng 1 dòng, không newline thừa).

## Việc còn lại / định hướng
- Xác nhận deploy Vercel chạy (test HTTPS trên điện thoại).
- **Chi tiết đơn** (mở xem full + ảnh phóng to).
- **Thanh toán**: hiện QR + nội dung CK + số TK để copy (như app mẫu). Đơn giá tính sau (admin đặt bảng giá).
- **Trang Admin**: quản lý nhiều **depot**, **hãng tàu** cố định, **đơn giá** (CRUD bảng `catalog` + bảng giá). Có thể thêm luồng **duyệt** xe/tài xế/đơn (hiện đang bỏ duyệt).
- (Sau) đăng nhập cho tài xế (tạo tài khoản tài xế) — cần Edge Function với service_role.

## Bối cảnh
Khách đã có 1 app mnr-react (dự án khác, Supabase khác — ĐỪNG lẫn). e-Depot là app MỚI, độc lập.
Người dùng thích: giải thích tiếng Việt, làm từng bước, build xong `pnpm build` sạch rồi mới báo.
