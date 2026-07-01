// Danh mục dùng cho form nghiệp vụ. Có thể chỉnh theo thực tế của bạn.

export const DEPOTS = [
  'GreenLogistics Depot',
]

export const CARRIERS = [
  'VIMC', 'CMA CGM', 'COSCO', 'MAERSK', 'ONE', 'EVERGREEN',
  'HAPAG-LLOYD', 'MSC', 'YANG MING', 'OOCL', 'HMM', 'SITC', 'WAN HAI', 'Khác',
]

export const CONT_TYPES = [
  "20'DC", "40'DC", "40'HC", "45'HC", "20'RF", "40'RF", "20'OT", "40'OT", "20'FR", "40'FR",
]

// Nhãn trạng thái đơn
export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  cho_duyet: { label: 'Đang chờ duyệt', tone: 'amber' },
  tu_choi:   { label: 'Từ chối duyệt',  tone: 'red' },
  chua_tt:   { label: 'Chưa thanh toán', tone: 'orange' },
  da_tt:     { label: 'Đã thanh toán',  tone: 'green' },
  huy:       { label: 'Đã hủy',         tone: 'gray' },
}
