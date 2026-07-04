import { NavLink, Outlet } from 'react-router-dom'
import { Info, Bell, ScanSearch, User } from 'lucide-react'
import { useUnreadCount } from '../features/notifications'

type Tab = { to: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; end?: boolean; badge?: number }

const RIGHT: Tab[] = [
  { to: '/tra-cuu',   label: 'Tra cứu',   icon: ScanSearch },
  { to: '/tai-khoan', label: 'Tài khoản', icon: User },
]

function TabLink({ t }: { t: Tab }) {
  const Icon = t.icon
  return (
    <NavLink
      to={t.to} end={t.end}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10.5px] font-medium transition-colors ${
          isActive ? 'text-brand-700' : 'text-ink-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
            {!!t.badge && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            )}
          </div>
          <span>{t.label}</span>
        </>
      )}
    </NavLink>
  )
}

export function MobileLayout() {
  const { data: unread } = useUnreadCount()
  const LEFT: Tab[] = [
    { to: '/thong-tin', label: 'Thông tin', icon: Info },
    { to: '/thong-bao', label: 'Thông báo', icon: Bell, badge: unread ?? 0 },
  ]
  return (
    <div className="h-full flex flex-col bg-ink-100 mx-auto max-w-[480px] shadow-xl">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-2">
        <Outlet />
      </main>

      {/* Thanh điều hướng dưới — nút GIỮA là Trang chủ (logo GreenLogs) */}
      <nav className="safe-bottom relative bg-white border-t border-ink-200">
        <div className="flex items-stretch">
          <div className="flex flex-1">{LEFT.map(t => <TabLink key={t.to} t={t} />)}</div>
          <div className="w-16 flex-shrink-0" />{/* chừa chỗ cho nút giữa */}
          <div className="flex flex-1">{RIGHT.map(t => <TabLink key={t.to} t={t} />)}</div>
        </div>

        {/* Nút Trang chủ nổi ở giữa */}
        <NavLink
          to="/" end
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-16 h-16 rounded-full bg-white border-4 border-ink-100 shadow-lg flex items-center justify-center active:scale-95 transition"
          aria-label="Trang chủ"
        >
          {({ isActive }) => (
            <div className={`w-full h-full rounded-full flex items-center justify-center ${isActive ? 'ring-2 ring-brand-500' : ''}`}>
              <img src="/logo.png" alt="Trang chủ" className="w-10 h-10 object-contain" />
            </div>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
