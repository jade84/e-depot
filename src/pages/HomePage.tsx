import { useNavigate } from 'react-router-dom'
import {
  Truck, Users, LogIn, LogOut, ClipboardList,
  BookOpen, History, RotateCcw, BarChart3, ClipboardCheck, Search, Tags,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

type IconType = React.ComponentType<{ size?: number; className?: string; color?: string }>
type Item = { label: string; icon: IconType; to?: string; color: string; bg: string }

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

// Quản trị (chỉ hiện với admin)
const ADMIN: Item[] = [
  { label: 'Bảng giá', icon: Tags, color: '#0d9488', bg: '#ccfbf1', to: '/admin/bang-gia' },
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
  const { profile } = useAuth()
  const displayName = profile?.name?.trim() || profile?.phone || 'Người dùng'
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

        {/* Ô tìm kiếm */}
        <div className="mt-4 bg-white rounded-xl flex items-center gap-2 px-3 h-11">
          <Search size={18} className="text-ink-400" />
          <input placeholder="Tìm Depot / Dịch vụ / Sản phẩm…"
            className="flex-1 text-[13px] text-ink-700 outline-none bg-transparent" />
        </div>
      </div>

      <Grid title="Nghiệp vụ nhà xe" items={NGHIEP_VU} />
      <Grid title="Quản lý" items={QUAN_LY} />
      {profile?.role === 'admin' && <Grid title="Quản trị" items={ADMIN} />}
    </div>
  )
}
