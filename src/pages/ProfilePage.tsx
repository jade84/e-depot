import { useNavigate } from 'react-router-dom'
import {
  UserCircle, KeyRound, Globe, Fingerprint, HelpCircle, Trash2, FileText, LogOut, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

type Row = { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; danger?: boolean; onClick?: () => void }

export function ProfilePage() {
  const { profile, signOut } = useAuth()
  const nav = useNavigate()

  async function onLogout() {
    await signOut()
    nav('/login', { replace: true })
  }

  const account: Row[] = [
    { label: 'Thông tin tài khoản', icon: UserCircle },
    { label: 'Đổi mật khẩu', icon: KeyRound },
    { label: 'Cài đặt ngôn ngữ', icon: Globe },
    { label: 'Xác thực vân tay', icon: Fingerprint },
  ]
  const general: Row[] = [
    { label: 'Trợ giúp?', icon: HelpCircle },
    { label: 'Xóa tài khoản', icon: Trash2, danger: true },
    { label: 'Điều khoản hệ thống', icon: FileText },
    { label: 'Đăng xuất', icon: LogOut, danger: true, onClick: onLogout },
  ]

  return (
    <div className="pb-6">
      {/* Header hồ sơ */}
      <div className="safe-top bg-white px-5 pt-6 pb-5 flex items-center gap-4 border-b border-ink-100">
        <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
          {profile?.name?.[0] ?? 'U'}
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold text-ink-900 truncate">{profile?.name}</div>
          <div className="text-[12.5px] text-ink-500 truncate">{profile?.phone}</div>
        </div>
      </div>

      <Section title="Tài khoản" rows={account} />
      <Section title="Chung" rows={general} />

      <p className="text-center text-[11px] text-ink-400 mt-6">e-Depot • v0.1.0</p>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="mt-4 px-3">
      <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wide px-2 mb-1.5">{title}</div>
      <div className="bg-white rounded-2xl overflow-hidden divide-y divide-ink-100">
        {rows.map(({ label, icon: Icon, danger, onClick }) => (
          <button key={label} onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-ink-50 transition text-left">
            <Icon size={19} className={danger ? 'text-red-500' : 'text-ink-500'} />
            <span className={`flex-1 text-[13.5px] ${danger ? 'text-red-600 font-medium' : 'text-ink-800'}`}>{label}</span>
            <ChevronRight size={16} className="text-ink-300" />
          </button>
        ))}
      </div>
    </section>
  )
}
