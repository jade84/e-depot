import { useNavigate } from 'react-router-dom'
import { Plus, UserRound, Trash2, Loader2, Phone, RefreshCw } from 'lucide-react'
import { useDrivers, useDeleteDriver, type Driver } from '../../features/drivers'
import { ScreenHeader } from '../../components/mobile'

export function DriversPage() {
  const nav = useNavigate()
  const { data: drivers, isLoading, isFetching, error, refetch } = useDrivers()
  const del = useDeleteDriver()

  function onDelete(d: Driver) {
    if (!confirm(`Xóa tài xế ${d.name}?`)) return
    del.mutate(d.id)
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Quản lý nhân sự" right={
        <button onClick={() => refetch()} className="p-1.5" aria-label="Tải lại">
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
        </button>
      } />

      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        )}
        {error && <div className="text-red-600 text-[13px] bg-red-50 rounded-lg p-3">Lỗi tải danh sách. Bạn đã chạy SQL 04 chưa?</div>}

        {drivers && drivers.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center text-ink-400 py-16">
            <UserRound size={40} className="mb-3 text-ink-300" />
            <div className="text-[14px] font-semibold text-ink-600">Chưa có tài xế</div>
            <div className="text-[12px] mt-1">Bấm nút <b>+</b> để thêm tài xế đầu tiên.</div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {drivers?.map(d => (
            <div key={d.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-ink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {d.photo_face
                  ? <img src={d.photo_face} alt="" className="w-full h-full object-cover" />
                  : <UserRound size={24} className="text-ink-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900 text-[15px] truncate">{d.name}</div>
                <div className="text-[12px] text-ink-500">CCCD: {d.cccd}</div>
                {d.phone && (
                  <div className="text-[12px] text-ink-500 flex items-center gap-1"><Phone size={11} /> {d.phone}</div>
                )}
                <StatusBadge status={d.status} />
              </div>
              <button onClick={() => onDelete(d)} disabled={del.isPending}
                className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center active:bg-red-100 flex-shrink-0">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => nav('/nhan-su/them')}
        className="safe-bottom fixed bottom-5 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center active:bg-brand-700"
        style={{ right: 'max(1.25rem, calc((100vw - 480px)/2 + 1.25rem))' }}
      >
        <Plus size={26} />
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: Driver['status'] }) {
  const on = status === 'hoat_dong'
  return (
    <span className={`inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
      on ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {on ? 'Hoạt động' : 'Chờ duyệt'}
    </span>
  )
}
