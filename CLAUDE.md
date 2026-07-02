# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
pnpm build      # tsc -b && vite build (luôn chạy để kiểm lỗi TS trước khi báo xong)
pnpm lint       # oxlint
pnpm preview    # xem thử bản build
```
Chưa có test framework (không có script `test`).

## Supabase
- Project ref: **vjrzqnbnydmrpjypoyzc** — URL `https://vjrzqnbnydmrpjypoyzc.supabase.co`
- Key kiểu mới: `sb_publishable_...` (dùng như anon key). Cấu hình ở `.env.local` (KHÔNG commit).
- Auth: **đăng nhập bằng SỐ ĐIỆN THOẠI** → map sang email nội bộ `<phone>@edepot.local`. Đã **tắt Confirm email**.
- **SQL để trong `supabase/*.sql`** — chạy thủ công qua Dashboard SQL Editor (không có migration tự động):
  - `01_init.sql` users (phone/name/cccd) + trigger tạo hồ sơ khi signUp
  - `03_vehicles.sql`, `04_drivers.sql`, `05_orders.sql`, `06_catalog.sql` (bảng + RLS + storage bucket public)
  - `07_pricing.sql` bảng `pricing` (bảng giá) — RLS: đọc chung, **ghi chỉ `role='admin'`**
  - `08_catalog_admin.sql` mở quyền admin cho `catalog` (đọc cả dòng tắt + ghi)
  - `09_settings.sql` bảng `settings` key-value jsonb (đọc chung, ghi admin) — chứa `bank_info`, `vat_percent`, `company_info`
  - `10_pricing_drop_loai.sql` bỏ cột `pricing.loai` (Lấy/Trả cùng giá) — chạy sau 07
  - `11_catalog_group.sql` thêm cột `catalog.nhom` (nhóm hãng tàu: `noi_dia`/`quoc_te`)
  - `12_pricing_carrier_group.sql` đổi `pricing.hang_tau` → `pricing.hang_tau_nhom` (áp giá theo nhóm)
  - `13_services.sql` bảng `services` (dịch vụ cty ở trang Thông tin) — RLS đọc chung/ghi admin
  - `14_vehicles_approve.sql` policy cho admin đọc/ghi mọi `vehicles` (duyệt xe)
  - `15_notifications.sql` bảng `notifications` (thông báo cho nhà xe) — đọc/sửa/xoá của mình, admin insert
  - `16_drivers_approve.sql` · `17_orders_approve.sql` policy cho admin đọc/ghi mọi `drivers`/`orders` (duyệt)
  - `18_permissions.sql` `users.perms text[]` + hàm `is_admin()`/`has_perm()`/`has_any_perm()` — **rewire lại các policy GHI** của khu quản trị theo quyền chi tiết (chạy SAU 07..17)
  - `orders` có thêm cột `so_cont text[]` (ALTER — xem lịch sử chat/commit)
- **RLS**: mỗi bản ghi thuộc `owner_id = auth.uid()` (nhà xe chỉ thấy dữ liệu của mình). `catalog` đọc chung cho mọi user.
- Storage buckets **public**: `vehicles`, `drivers`, `orders`. Policy: đọc public, ghi/xoá trong thư mục `<uid>/...`.

## Data model (bảng)
- `users` (hồ sơ, 1-1 auth.users; `role` = `'driver'` mặc định / `'admin'`) · `vehicles` (xe) · `drivers` (tài xế) · `orders` (Lấy/Trả cont) · `catalog` (danh mục dùng chung) · `pricing` (bảng giá)
- `pricing`: `(loai_cont, depot?, hang_tau_nhom?) → don_gia` (phí/1 cont, **CHƯA VAT**). Lấy & Trả cùng giá (không tách `loai`). `hang_tau_nhom` = nhóm hãng tàu (`noi_dia`/`quoc_te`, null=mọi hãng); depot null=mọi depot. `matchPrice()` ưu tiên dòng cụ thể hơn — nhận `carrierGroup` (tra từ `catalog.nhom` của hãng tàu trên đơn qua `useCarriers`).
- `catalog.nhom`: chỉ dùng cho `type='carrier'` để phân nhóm Nội địa/Quốc tế (`CARRIER_GROUPS`, `CARRIER_GROUP_LABEL`).
- VAT (%) lưu ở `settings.vat_percent` (mặc định 10). Phí đơn = `don_gia × số_lượng × (1 + VAT%)` = `withVat()`. `settings` key thiếu → hook tự fallback + upsert khi admin lưu (không cần migration cho `vat_percent`).
- **Phân quyền**: `users.role` = `admin` (full) / `staff` (theo `users.perms text[]`) / `driver`. Quyền: `PermKey` trong `src/lib/permissions.ts` (`approve_vehicle`, `pricing`, `permissions`, …). Kiểm quyền bằng `useAuth().can(perm)` (admin luôn true). RLS tầng DB kiểm bằng `has_perm(perm)` (18) — nên UI `can()` và policy phải khớp key. **Admin — Phân quyền** (`/admin/phan-quyen`, quyền `permissions`): gán role + tick quyền cho từng user (`useAllUsers`/`useUpdateUserAccess`). HomePage lọc mục Quản trị theo `can()`.
- `vehicles.driver_id` → gán tài xế. `orders.loai` = `'lay'` | `'tra'`, `trang_thai` mặc định `cho_duyet` (giá trị dùng: `cho_duyet`, `huy`, …). `orders.phi_nang_ha` = phí (số tiền) → dùng cho trang Thanh toán.

## Kiến trúc (đọc nhanh để nắm)
- **Data layer = `src/features/<domain>.ts`**: mỗi domain export các custom hook React Query bọc quanh `supabase` (từ `src/lib/supabase.ts`). Quy ước:
  - `useX()` / `useXList()` → `useQuery`, `queryKey` là `['orders']`, `['orders', id]`, …
  - `useCreateX` / `useCancelX` / `useDeleteX` → `useMutation`, `onSuccess` gọi `qc.invalidateQueries({ queryKey: [...] })`.
  - Insert luôn gắn `owner_id = auth.uid()` (khớp RLS). Type `X` (bản ghi DB) và `NewX` (payload tạo) khai báo cùng file.
- **Auth (`src/lib/AuthContext.tsx`)**: `AuthProvider` bọc toàn app, hook `useAuth()` trả `{ profile, loading, ready, signIn, signUp, signInDemo, signOut }`. SĐT → email nội bộ qua `toEmail()`. **Chế độ demo** lưu ở `localStorage` (`edepot_demo_profile`) khi Supabase chưa cấu hình — kiểm tra bằng `isSupabaseReady`.
- **Routing (`src/App.tsx`)**: `/login`, `/register` public. Phần còn lại bọc trong `ProtectedRoute` và chia **2 nhóm layout**:
  1. Có **bottom nav** (`MobileLayout` trong `src/mobile/`): `/`, `/thong-tin` (`InfoPage`), `/thong-bao` (`NotificationsPage`, tab Bell có **chấm đỏ số chưa đọc** qua `useUnreadCount`), `/tai-khoan`.
  2. **Full-screen** (không nav, khung `max-w-[480px]`): các trang nghiệp vụ `/lay-cont`, `/tra-cont`, `/don-hang`, `/don-hang/:id`, `/don-hang/:id/thanh-toan`, `/phuong-tien*`, `/nhan-su*`.
- **UI dùng chung**: `src/components/mobile.tsx` (`ScreenHeader` có nút back `nav(-1)`, `PhotoSlot`, …). Icon: `lucide-react`.

## Tính năng đã xong
- Auth: đăng ký (tên/SĐT/CCCD/mật khẩu) + đăng nhập bằng SĐT. Có chế độ demo khi thiếu Supabase.
- Trang chủ lưới nghiệp vụ + bottom nav (nút GIỮA = logo GreenLogs về trang chủ). Đã bỏ Cửa hàng/Quà tặng.
- **Quản lý phương tiện**: thêm/xoá xe (ảnh xe + cà vẹt), gán tài xế, danh sách. Xe tạo ra = **`cho_duyet`** → admin duyệt (`kich_hoat`/`tu_choi`); form tạo đơn chỉ chọn xe `kich_hoat`.
- **Admin — Duyệt xe** (`/admin/duyet-xe`, chỉ admin): xem xe chờ duyệt + ảnh xe/cà vẹt, **Duyệt / Từ chối (kèm lý do)**. `useReviewVehicle` cập nhật status **và gửi `notifications`** cho nhà xe (duyệt: "đã kích hoạt"; từ chối: kèm lý do). RLS: `14_vehicles_approve.sql`.
- **Thông báo** (`/thong-bao`, `NotificationsPage`): nhà xe xem thông báo của mình (`useNotifications`), đọc tất cả (`useMarkAllRead`), xoá. Thông báo tạo khi admin duyệt/từ chối xe.
- **Quản lý nhân sự**: thêm/xoá tài xế (ảnh khuôn mặt + CCCD trước/sau). Tài xế mới = **`cho_duyet`** → admin duyệt (`hoat_dong`/`tu_choi`); form đơn chỉ chọn tài xế `hoat_dong`. **Quét QR CCCD/Căn cước** (mặt sau với thẻ mới) tự điền + **đối chiếu** khi lưu.
- **Admin — Duyệt tài xế** (`/admin/duyet-tai-xe`) & **Quản lý đơn** (`/admin/duyet-don`): giống duyệt xe, `useReviewDriver`/`useReviewOrder` cập nhật trạng thái + gửi `notifications`. Đơn duyệt → `chua_tt` (chờ thanh toán), từ chối → `tu_choi` (kèm lý do). Tab **Chờ TT**: admin bấm **"Đã nhận thanh toán"** (`useConfirmPayment`, đối soát **thủ công**) → `da_tt` + thông báo. Modal lý do dùng chung `RejectReasonModal`.
- **Lấy cont rỗng** (`/lay-cont`) và **Trả cont rỗng** (`/tra-cont`, nhập nhiều số cont ISO 6346) → tạo `orders`.
- **Đơn hàng** (`/don-hang`): danh sách + hủy đơn.
- **Chi tiết đơn** (`/don-hang/:id`): xem full thông tin đơn + ảnh.
- **Thanh toán** (`/don-hang/:id/thanh-toan`): sinh **QR VietQR** (`img.vietqr.io`) từ `phi_nang_ha` + nội dung CK, các dòng thông tin CK bấm **Copy**. Thông tin ngân hàng đọc từ `settings.bank_info` (`useBankInfo`, fallback `DEFAULT_BANK`).
- **Admin — Ngân hàng** (`/admin/ngan-hang`, chỉ admin): sửa `bank_info` (mã VietQR, số TK, tên chủ TK, tên NH) + xem trước QR. `useSaveBankInfo`.
- **Admin — Bảng giá** (`/admin/bang-gia`, chỉ admin): CRUD `pricing` (1 giá/loại cont) + chỉnh **% VAT** + **import/export CSV** (`src/lib/csv.ts`, `useImportPricing` upsert theo `loai_cont+depot+hang_tau`). Form Lấy/Trả cont **tự tính `phi_nang_ha`** khi có giá khớp (`matchPrice` → `withVat`), hiện bảng **trước VAT / VAT / sau VAT** (`FeeBreakdown` trong `components/mobile.tsx`); chưa có giá thì tài xế nhập tay.
- **Trang Thông tin** (`/thong-tin`, `InfoPage`): giới thiệu công ty + **dịch vụ động** (`useServices`) → bấm mở chi tiết `/thong-tin/dich-vu/:id` (`ServiceDetailPage`, `services.noi_dung`). Mục Liên hệ đọc từ `settings.company_info` (`useCompanyInfo`). **Admin — Dịch vụ** (`/admin/dich-vu`): CRUD `services` (title/mô tả/nội dung/icon/sort/ẩn-hiện). **Admin — Liên hệ** (`/admin/lien-he`): sửa `company_info` (trụ sở/văn phòng/điện thoại/email) qua `useSaveCompanyInfo`.
- **Admin — Danh mục** (`/admin/danh-muc`, chỉ admin): CRUD `catalog` theo tab depot/hãng tàu/loại cont (`useCatalogAdmin` đọc cả dòng tắt, `useUpsertCatalog`/`useDeleteCatalog`). Tab hãng tàu chọn **nhóm Nội địa/Quốc tế** (`catalog.nhom`) để bảng giá áp theo nhóm. Form nghiệp vụ tự cập nhật theo (`useCatalog`).

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
- Xác nhận deploy Vercel chạy (test HTTPS trên điện thoại). **Nhớ chạy các SQL mới trên Dashboard**: `07`→`12` (`07_pricing`, `08_catalog_admin`, `09_settings`, `10_pricing_drop_loai`, `11_catalog_group`, `12_pricing_carrier_group`).
- Thanh toán: hiện đối soát **thủ công** (admin bấm "Đã nhận thanh toán"). (Sau) tự động qua **webhook Casso/SePay** → Edge Function set `da_tt` (dùng lại logic `useConfirmPayment`).
- (Sau) đăng nhập cho tài xế (tạo tài khoản tài xế) — cần Edge Function với service_role.

## Bối cảnh
Khách đã có 1 app mnr-react (dự án khác, Supabase khác — ĐỪNG lẫn). e-Depot là app MỚI, độc lập.
Người dùng thích: giải thích tiếng Việt, làm từng bước, build xong `pnpm build` sạch rồi mới báo.
