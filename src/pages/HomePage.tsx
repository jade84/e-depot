import { useNavigate } from 'react-router-dom'
import {
  Truck, Users, LogIn, LogOut, ClipboardList,
  BookOpen, History, RotateCcw, BarChart3, ClipboardCheck, Tags, ListChecks, Landmark, LayoutGrid, Contact, KeyRound, FileText,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import type { PermKey } from '../lib/permissions'

type IconType = React.ComponentType<{ size?: number; className?: string; color?: string }>
type Item = { label: string; icon: IconType; to?: string; color: string; bg: string; perm?: PermKey }

// Nghiệp vụ nhà xe (giống app mẫu e-Depot)
const NGHIEP_VU: Item[] = [
  { label: 'Trả cont rỗng',  icon: LogIn,         color: '#2563eb', bg: '#dbeafe', to: '/tra-cont' },
  { label: 'Lấy cont rỗng',  icon: LogOut,        color: '#16a34a', bg: '#dcfce7', to: '/lay-cont' },
  { label: 'Đơn hàng',       icon: ClipboardList, color: '#ea580c', bg: '#ffedd5', to: '/don-hang' },
  { label: 'Hướng dẫn',      icon: BookOpen,      color: '#0891b2', bg: '#cffafe' },
  { label: 'Lịch sử TT',     icon: History,       color: '#7c3aed', bg: '#ede9fe' },
  { label: 'Đơn hoàn tiền',  icon: RotateCcw,     color: '#db2777', bg: '#fce7f3' },
  { label: 'Thống kê',       icon: BarChart3,     color: '#0d9488', bg: '#ccfbf1' },
  { label: 'Đơn chờ duyệt',  icon: ClipboardCheck,color: '#ca8a04', bg: '#fef9c3' },
]

// Quản lý
const QUAN_LY: Item[] = [
  { label: 'Quản lý phương tiện', icon: Truck,  color: '#dc2626', bg: '#fee2e2', to: '/phuong-tien' },
  { label: 'Quản lý nhân sự',     icon: Users,  color: '#2563eb', bg: '#dbeafe', to: '/nhan-su' },
]

// Quản trị (hiện theo quyền được cấp)
const ADMIN: Item[] = [
  { label: 'Duyệt xe',      icon: Truck,         color: '#dc2626', bg: '#fee2e2', to: '/admin/duyet-xe',      perm: 'approve_vehicle' },
  { label: 'Duyệt tài xế',  icon: Users,         color: '#2563eb', bg: '#dbeafe', to: '/admin/duyet-tai-xe',  perm: 'approve_driver' },
  { label: 'Duyệt đơn',     icon: ClipboardCheck, color: '#ca8a04', bg: '#fef9c3', to: '/admin/duyet-don',     perm: 'approve_order' },
  { label: 'Bảng giá',  icon: Tags,       color: '#0d9488', bg: '#ccfbf1', to: '/admin/bang-gia',  perm: 'pricing' },
  { label: 'Danh mục',  icon: ListChecks, color: '#7c3aed', bg: '#ede9fe', to: '/admin/danh-muc',  perm: 'catalog' },
  { label: 'Dịch vụ',   icon: LayoutGrid, color: '#c026d3', bg: '#fae8ff', to: '/admin/dich-vu',   perm: 'services' },
  { label: 'Ngân hàng', icon: Landmark,   color: '#0369a1', bg: '#e0f2fe', to: '/admin/ngan-hang', perm: 'bank' },
  { label: 'Liên hệ',   icon: Contact,    color: '#0891b2', bg: '#cffafe', to: '/admin/lien-he',   perm: 'contact' },
  { label: 'Mẫu EIR',   icon: FileText,   color: '#0d9488', bg: '#ccfbf1', to: '/admin/mau-eir',   perm: 'eir_form' },
  { label: 'Phân quyền', icon: KeyRound,  color: '#4f46e5', bg: '#e0e7ff', to: '/admin/phan-quyen', perm: 'permissions' },
]

function Grid({ title, items }: { title: string; items: Item[] }) {
  const nav = useNavigate()
  return (
    <section className="px-4 mt-4">
      <h2 className="text-[13px] font-bold text-brand-800 mb-2.5">{title}</h2>
      <div className="grid grid-cols-3 gap-x-2 gap-y-4">
        {items.map(({ label, icon: Icon, color, bg, to }) => (
          <button
            key={label}
            onClick={() => to && nav(to)}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={26} color={color} />
            </div>
            <span className="text-[11px] text-ink-600 leading-tight text-center px-1">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function HomePage() {
  const { profile, can } = useAuth()
  const displayName = profile?.name?.trim() || profile?.phone || 'Người dùng'
  const adminItems = ADMIN.filter(i => !i.perm || can(i.perm))
  // Nhân viên (staff) = người của công ty, không dùng nghiệp vụ nhà xe.
  const isNhaXe = profile?.role !== 'staff'
  return (
    <div className="pb-4">
      {/* Header */}
      <div className="safe-top bg-gradient-to-b from-brand-800 to-brand-600 px-4 pt-4 pb-5 text-white rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            {(displayName?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-brand-100">Xin chào,</div>
            <div className="font-bold truncate">{displayName}</div>
          </div>
          {profile?.demo && (
            <span className="ml-auto text-[10px] bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded-full">DEMO</span>
          )}
        </div>
      </div>

      {isNhaXe && <Grid title="Nghiệp vụ nhà xe" items={NGHIEP_VU} />}
      {isNhaXe && <Grid title="Quản lý" items={QUAN_LY} />}
      {adminItems.length > 0 && <Grid title="Quản trị" items={adminItems} />}
    </div>
  )
}
