import { useState } from 'react'
import { UserRound, Check, X, Loader2, ShieldAlert, Clock } from 'lucide-react'
import { ScreenHeader, RejectReasonModal } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useAllDrivers, useReviewDriver, type Driver } from '../../features/drivers'

const STATUS = {
  hoat_dong: { label: 'Đang hoạt động', cls: 'bg-green-100 text-green-700' },
  cho_duyet: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  tu_choi:   { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
} as const

export function DriverApprovalPage() {
  const { can } = useAuth()
  const { data: drivers, isLoading } = useAllDrivers()
  const review = useReviewDriver()
  const [tab, setTab] = useState<'cho_duyet' | 'all'>('cho_duyet')
  const [rejecting, setRejecting] = useState<Driver | null>(null)

  if (!can('approve_driver')) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Duyệt tài xế" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
          </div>
        </div>
      </div>
    )
  }

  const list = (drivers ?? []).filter(d => tab === 'all' || d.status === 'cho_duyet')
  const pending = (drivers ?? []).filter(d => d.status === 'cho_duyet').length

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Duyệt tài xế" />
      <div className="bg-brand-800 px-3 pb-2 flex gap-1.5">
        <TabBtn active={tab === 'cho_duyet'} onClick={() => setTab('cho_duyet')}>Chờ duyệt{pending ? ` (${pending})` : ''}</TabBtn>
        <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>Tất cả</TabBtn>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10"><Loader2 size={18} className="animate-spin" /> Đang tải…</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center text-center text-ink-400 py-16">
            <Clock size={40} className="mb-3 text-ink-300" />
            <div className="text-[14px] font-semibold text-ink-600">{tab === 'cho_duyet' ? 'Không có tài xế chờ duyệt' : 'Chưa có tài xế nào'}</div>
          </div>
        ) : (
          list.map(d => (
            <DriverCard key={d.id} d={d} busy={review.isPending}
              onApprove={() => review.mutate({ driver: d, status: 'hoat_dong' })}
              onReject={() => setRejecting(d)} />
          ))
        )}
        <div className="pb-6" />
      </div>

      {rejecting && (
        <RejectReasonModal
          title={`Từ chối tài xế ${rejecting.name}`}
          busy={review.isPending}
          onCancel={() => setRejecting(null)}
          onConfirm={async reason => { await review.mutateAsync({ driver: rejecting, status: 'tu_choi', reason }); setRejecting(null) }}
        />
      )}
    </div>
  )
}

function DriverCard({ d, busy, onApprove, onReject }: {
  d: Driver; busy: boolean; onApprove: () => void; onReject: () => void
}) {
  const st = STATUS[d.status] ?? { label: d.status, cls: 'bg-ink-100 text-ink-500' }
  const imgs = [d.photo_face, d.photo_cccd_front, d.photo_cccd_back].filter(Boolean) as string[]
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-ink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {d.photo_face ? <img src={d.photo_face} alt="" className="w-full h-full object-cover" /> : <UserRound size={24} className="text-ink-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink-900 text-[15px] truncate">{d.name}</div>
          <div className="text-[12px] text-ink-500">CCCD {d.cccd}{d.phone ? ` · ${d.phone}` : ''}</div>
          <span className={`inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
        </div>
      </div>
      {imgs.length > 0 && (
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {imgs.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={u} alt="" className="w-20 h-20 rounded-lg object-cover border border-ink-100" />
            </a>
          ))}
        </div>
      )}
      {d.status === 'cho_duyet' ? (
        <div className="flex border-t border-ink-100">
          <button onClick={onReject} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-red-600 font-semibold text-[13px] active:bg-red-50 disabled:opacity-60"><X size={16} /> Từ chối</button>
          <button onClick={onApprove} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white bg-brand-700 font-semibold text-[13px] active:bg-brand-800 disabled:opacity-60"><Check size={16} /> Duyệt</button>
        </div>
      ) : (
        <button onClick={d.status === 'tu_choi' ? onApprove : onReject} disabled={busy}
          className="w-full py-2.5 border-t border-ink-100 text-[12.5px] font-semibold text-ink-500 active:bg-ink-50 disabled:opacity-60">
          {d.status === 'tu_choi' ? 'Duyệt lại' : 'Chuyển sang từ chối'}
        </button>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 h-9 rounded-lg text-[12.5px] font-semibold transition ${active ? 'bg-white text-brand-800' : 'bg-white/10 text-white/80'}`}>{children}</button>
  )
}
