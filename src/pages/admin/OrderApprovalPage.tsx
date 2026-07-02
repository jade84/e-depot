import { useState } from 'react'
import { Check, X, Loader2, ShieldAlert, Clock } from 'lucide-react'
import { ScreenHeader, RejectReasonModal } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useAllOrders, useReviewOrder, type Order } from '../../features/orders'
import { ORDER_STATUS } from '../../lib/options'

const TONE: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-ink-200 text-ink-500',
}

export function OrderApprovalPage() {
  const { profile } = useAuth()
  const { data: orders, isLoading } = useAllOrders()
  const review = useReviewOrder()
  const [tab, setTab] = useState<'cho_duyet' | 'all'>('cho_duyet')
  const [rejecting, setRejecting] = useState<Order | null>(null)

  if (profile?.role !== 'admin') {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Duyệt đơn" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
          </div>
        </div>
      </div>
    )
  }

  const list = (orders ?? []).filter(o => tab === 'all' || o.trang_thai === 'cho_duyet')
  const pending = (orders ?? []).filter(o => o.trang_thai === 'cho_duyet').length

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Duyệt đơn hàng" />
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
            <div className="text-[14px] font-semibold text-ink-600">{tab === 'cho_duyet' ? 'Không có đơn chờ duyệt' : 'Chưa có đơn nào'}</div>
          </div>
        ) : (
          list.map(o => (
            <OrderCard key={o.id} o={o} busy={review.isPending}
              onApprove={() => review.mutate({ order: o, approve: true })}
              onReject={() => setRejecting(o)} />
          ))
        )}
        <div className="pb-6" />
      </div>

      {rejecting && (
        <RejectReasonModal
          title={`Từ chối đơn ${rejecting.so_bl || rejecting.id.slice(0, 8).toUpperCase()}`}
          busy={review.isPending}
          onCancel={() => setRejecting(null)}
          onConfirm={async reason => { await review.mutateAsync({ order: rejecting, approve: false, reason }); setRejecting(null) }}
        />
      )}
    </div>
  )
}

function OrderCard({ o, busy, onApprove, onReject }: {
  o: Order; busy: boolean; onApprove: () => void; onReject: () => void
}) {
  const st = ORDER_STATUS[o.trang_thai] ?? { label: o.trang_thai, tone: 'gray' }
  const ma = o.so_bl || o.id.slice(0, 8).toUpperCase()
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${o.loai === 'lay' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {o.loai === 'lay' ? 'Lấy cont' : 'Trả cont'}
          </span>
          <span className="text-[14px] font-bold text-ink-900 flex-1 truncate">{ma}</span>
          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${TONE[st.tone] ?? TONE.gray}`}>{st.label}</span>
        </div>
        <div className="mt-2 text-[12.5px] text-ink-600 space-y-0.5">
          <div>{o.depot || '—'} · {o.hang_tau || '—'}</div>
          <div>{o.loai_cont || '—'} × {o.so_luong} · Xe {o.bien_so || '—'}</div>
          {o.tai_xe_ten && <div>Tài xế: {o.tai_xe_ten}</div>}
          <div className="font-bold text-brand-700">Phí: {o.phi_nang_ha.toLocaleString('vi-VN')} đ</div>
        </div>
      </div>
      {o.photos?.length > 0 && (
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {o.photos.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={u} alt="" className="w-20 h-20 rounded-lg object-cover border border-ink-100" />
            </a>
          ))}
        </div>
      )}
      {o.trang_thai === 'cho_duyet' && (
        <div className="flex border-t border-ink-100">
          <button onClick={onReject} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-red-600 font-semibold text-[13px] active:bg-red-50 disabled:opacity-60"><X size={16} /> Từ chối</button>
          <button onClick={onApprove} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white bg-brand-700 font-semibold text-[13px] active:bg-brand-800 disabled:opacity-60"><Check size={16} /> Duyệt</button>
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 h-9 rounded-lg text-[12.5px] font-semibold transition ${active ? 'bg-white text-brand-800' : 'bg-white/10 text-white/80'}`}>{children}</button>
  )
}
