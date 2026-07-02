import { useState } from 'react'
import { Truck, Check, X, Loader2, ShieldAlert, Clock } from 'lucide-react'
import { ScreenHeader, RejectReasonModal } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useAllVehicles, useReviewVehicle, type Vehicle } from '../../features/vehicles'

const STATUS = {
  kich_hoat: { label: 'Đã kích hoạt', cls: 'bg-green-100 text-green-700' },
  cho_duyet: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  tu_choi:   { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
} as const

export function VehicleApprovalPage() {
  const { profile } = useAuth()
  const { data: vehicles, isLoading } = useAllVehicles()
  const review = useReviewVehicle()
  const [tab, setTab] = useState<'cho_duyet' | 'all'>('cho_duyet')
  const [rejecting, setRejecting] = useState<Vehicle | null>(null)

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Duyệt xe" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
          </div>
        </div>
      </div>
    )
  }

  const list = (vehicles ?? []).filter(v => tab === 'all' || v.status === 'cho_duyet')
  const pendingCount = (vehicles ?? []).filter(v => v.status === 'cho_duyet').length

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Duyệt phương tiện" />

      {/* Tabs */}
      <div className="bg-brand-800 px-3 pb-2 flex gap-1.5">
        <TabBtn active={tab === 'cho_duyet'} onClick={() => setTab('cho_duyet')}>
          Chờ duyệt{pendingCount ? ` (${pendingCount})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>Tất cả</TabBtn>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center text-center text-ink-400 py-16">
            <Clock size={40} className="mb-3 text-ink-300" />
            <div className="text-[14px] font-semibold text-ink-600">
              {tab === 'cho_duyet' ? 'Không có xe chờ duyệt' : 'Chưa có xe nào'}
            </div>
          </div>
        ) : (
          list.map(v => (
            <VehicleCard key={v.id} v={v}
              busy={review.isPending}
              onApprove={() => review.mutate({ vehicle: v, status: 'kich_hoat' })}
              onReject={() => setRejecting(v)} />
          ))
        )}
        <div className="pb-6" />
      </div>

      {rejecting && (
        <RejectReasonModal
          title={`Từ chối xe ${rejecting.plate}`}
          busy={review.isPending}
          onCancel={() => setRejecting(null)}
          onConfirm={async reason => {
            await review.mutateAsync({ vehicle: rejecting, status: 'tu_choi', reason })
            setRejecting(null)
          }}
        />
      )}
    </div>
  )
}

function VehicleCard({ v, busy, onApprove, onReject }: {
  v: Vehicle; busy: boolean; onApprove: () => void; onReject: () => void
}) {
  const st = STATUS[v.status] ?? { label: v.status, cls: 'bg-ink-100 text-ink-500' }
  const imgs = [...v.photos_xe, ...v.photos_giay]
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-ink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {v.photos_xe[0]
            ? <img src={v.photos_xe[0]} alt="" className="w-full h-full object-cover" />
            : <Truck size={24} className="text-ink-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink-900 text-[15px]">{v.plate}</div>
          {v.name && <div className="text-[12.5px] text-ink-500 truncate">{v.name}</div>}
          <span className={`inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
        </div>
      </div>

      {/* Ảnh xe + cà vẹt để đối chiếu */}
      {imgs.length > 0 && (
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {imgs.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={u} alt="" className="w-20 h-20 rounded-lg object-cover border border-ink-100" />
            </a>
          ))}
        </div>
      )}

      {v.status === 'cho_duyet' ? (
        <div className="flex border-t border-ink-100">
          <button onClick={onReject} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-red-600 font-semibold text-[13px] active:bg-red-50 disabled:opacity-60">
            <X size={16} /> Từ chối
          </button>
          <button onClick={onApprove} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white bg-brand-700 font-semibold text-[13px] active:bg-brand-800 disabled:opacity-60">
            <Check size={16} /> Duyệt
          </button>
        </div>
      ) : (
        <button onClick={v.status === 'tu_choi' ? onApprove : onReject} disabled={busy}
          className="w-full py-2.5 border-t border-ink-100 text-[12.5px] font-semibold text-ink-500 active:bg-ink-50 disabled:opacity-60">
          {v.status === 'tu_choi' ? 'Duyệt lại (kích hoạt)' : 'Chuyển sang từ chối'}
        </button>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex-1 h-9 rounded-lg text-[12.5px] font-semibold transition ${
        active ? 'bg-white text-brand-800' : 'bg-white/10 text-white/80'
      }`}>
      {children}
    </button>
  )
}
