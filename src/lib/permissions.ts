// Danh sách quyền chi tiết cho khu Quản trị.
// role='admin' = full quyền (bỏ qua danh sách này); user thường được cấp từng quyền.

export type PermKey =
  | 'approve_vehicle'
  | 'approve_driver'
  | 'approve_order'
  | 'pricing'
  | 'catalog'
  | 'services'
  | 'bank'
  | 'contact'
  | 'permissions'

export const PERMISSIONS: { key: PermKey; label: string; desc: string }[] = [
  { key: 'approve_vehicle', label: 'Duyệt xe', desc: 'Duyệt / từ chối phương tiện' },
  { key: 'approve_driver', label: 'Duyệt tài xế', desc: 'Duyệt / từ chối tài xế' },
  { key: 'approve_order', label: 'Quản lý đơn', desc: 'Duyệt đơn + xác nhận thanh toán' },
  { key: 'pricing', label: 'Bảng giá', desc: 'Sửa đơn giá, VAT' },
  { key: 'catalog', label: 'Danh mục', desc: 'Depot / hãng tàu / loại cont' },
  { key: 'services', label: 'Dịch vụ', desc: 'Nội dung dịch vụ trang Thông tin' },
  { key: 'bank', label: 'Ngân hàng', desc: 'Thông tin tài khoản nhận tiền' },
  { key: 'contact', label: 'Liên hệ', desc: 'Thông tin liên hệ công ty' },
  { key: 'permissions', label: 'Phân quyền', desc: 'Cấp quyền cho nhân sự khác' },
]

export const PERM_LABEL: Record<string, string> = Object.fromEntries(
  PERMISSIONS.map(p => [p.key, p.label]),
)
