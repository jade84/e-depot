import { useNavigate } from 'react-router-dom'
import { Plus, Truck, Trash2, Loader2, UserRound, ChevronRight, RefreshCw } from 'lucide-react'
import { useVehicles, useDeleteVehicle, type Vehicle } from '../../features/vehicles'
import { useDrivers } from '../../features/drivers'
import { ScreenHeader } from '../../components/mobile'

export function VehiclesPage() {
  const nav = useNavigate()
  const { data: vehicles, isLoading, isFetching, error, refetch } = useVehicles()
  const { data: drivers } = useDrivers()
  const del = useDeleteVehicle()

  const driverName = (id: string | null) => drivers?.find(d => d.id === id)?.name ?? null

  function onDelete(v: Vehicle) {
    if (!confirm(`Xóa xe ${v.plate}?`)) return
    del.mutate(v.id)
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Quản lý phương tiện" right={
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
        {error && <div className="text-red-600 text-[13px] bg-red-50 rounded-lg p-3">Lỗi tải danh sách. Bạn đã chạy SQL 03 chưa?</div>}

        {vehicles && vehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center text-ink-400 py-16">
            <Truck size={40} className="mb-3 text-ink-300" />
            <div className="text-[14px] font-semibold text-ink-600">Chưa có phương tiện</div>
            <div className="text-[12px] mt-1">Bấm nút <b>+</b> để thêm xe đầu tiên.</div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {vehicles?.map(v => (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-ink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {v.photos_xe[0]
                    ? <img src={v.photos_xe[0]} alt="" className="w-full h-full object-cover" />
                    : <Truck size={26} className="text-ink-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink-900 text-[15px]">{v.plate}</div>
                  {v.name && <div className="text-[12.5px] text-ink-500 truncate">{v.name}</div>}
                  <StatusBadge status={v.status} />
                </div>
                <button onClick={() => onDelete(v)} disabled={del.isPending}
                  className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center active:bg-red-100 flex-shrink-0">
                  <Trash2 size={17} />
                </button>
              </div>
              {/* Gán tài xế */}
              <button onClick={() => nav(`/phuong-tien/${v.id}/gan-tai-xe`)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-ink-100 active:bg-ink-50 text-left">
                <UserRound size={15} className="text-ink-400 flex-shrink-0" />
                <span className="flex-1 text-[12.5px] text-ink-600 truncate">
                  {driverName(v.driver_id)
                    ? <>Tài xế: <b className="text-ink-800">{driverName(v.driver_id)}</b></>
                    : <span className="text-ink-400">Chưa gán tài xế — bấm để chọn</span>}
                </span>
                <ChevronRight size={16} className="text-ink-300 flex-shrink-0" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Nút thêm xe */}
      <button
        onClick={() => nav('/phuong-tien/them')}
        className="safe-bottom fixed bottom-5 right-5 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center active:bg-brand-700"
        style={{ right: 'max(1.25rem, calc((100vw - 480px)/2 + 1.25rem))' }}
      >
        <Plus size={26} />
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: Vehicle['status'] }) {
  const map = {
    kich_hoat: { label: 'Đã kích hoạt', cls: 'bg-green-100 text-green-700' },
    cho_duyet: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
    tu_choi:   { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
  }[status] ?? { label: status, cls: 'bg-ink-100 text-ink-500' }
  return (
    <span className={`inline-block mt-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${map.cls}`}>
      {map.label}
    </span>
  )
}
