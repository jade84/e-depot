import { Bell, CheckCheck, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useNotifications, useMarkAllRead, useDeleteNotification, type AppNotification } from '../features/notifications'

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return d.toLocaleDateString('vi-VN')
}

export function NotificationsPage() {
  const { data: items, isLoading } = useNotifications()
  const markAll = useMarkAllRead()
  const del = useDeleteNotification()
  const hasUnread = (items ?? []).some(n => !n.read)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="safe-top bg-brand-800 text-white px-4 py-3.5 flex items-center gap-2 sticky top-0 z-10">
        <h1 className="text-[15px] font-bold flex-1">Thông báo</h1>
        {hasUnread && (
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending}
            className="flex items-center gap-1 text-[12px] font-semibold bg-white/15 px-2.5 py-1.5 rounded-lg active:bg-white/25">
            <CheckCheck size={14} /> Đọc tất cả
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (items?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center text-center text-ink-400 py-20">
            <Bell size={40} className="mb-3 text-ink-300" />
            <div className="text-[14px] font-semibold text-ink-600">Chưa có thông báo</div>
          </div>
        ) : (
          items!.map(n => <NotiCard key={n.id} n={n} onDelete={() => del.mutate(n.id)} />)
        )}
        <div className="pb-4" />
      </div>
    </div>
  )
}

function NotiCard({ n, onDelete }: { n: AppNotification; onDelete: () => void }) {
  const reject = n.type === 'vehicle_reject'
  const Icon = reject ? XCircle : CheckCircle2
  const color = reject ? 'text-red-500' : 'text-brand-600'
  return (
    <div className={`rounded-2xl p-3 shadow-sm flex gap-3 ${n.read ? 'bg-white' : 'bg-brand-50 border border-brand-100'}`}>
      <Icon size={22} className={`${color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-ink-800">{n.title}</span>
          {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
        </div>
        {n.body && <div className="text-[12.5px] text-ink-600 mt-0.5 leading-snug">{n.body}</div>}
        <div className="text-[10.5px] text-ink-400 mt-1">{timeAgo(n.created_at)}</div>
      </div>
      <button onClick={onDelete} className="p-1.5 text-ink-300 active:text-red-500 self-start"><Trash2 size={15} /></button>
    </div>
  )
}
