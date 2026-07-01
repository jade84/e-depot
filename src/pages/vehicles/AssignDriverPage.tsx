import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserRound, Check, Loader2 } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useVehicles, useAssignDriver } from '../../features/vehicles'
import { useDrivers } from '../../features/drivers'

export function AssignDriverPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: vehicles } = useVehicles()
  const { data: drivers, isLoading } = useDrivers()
  const assign = useAssignDriver()

  const vehicle = vehicles?.find(v => v.id === id)
  const [selected, setSelected] = useState<string | null>(vehicle?.driver_id ?? null)

  async function onSave() {
    if (!id) return
    try {
      await assign.mutateAsync({ vehicleId: id, driverId: selected })
      nav('/phuong-tien', { replace: true })
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message)
    }
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Gán tài xế cho xe" />

      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        {vehicle && (
          <div className="bg-white rounded-2xl p-3 mb-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-ink-100 overflow-hidden flex items-center justify-center">
              {vehicle.photos_xe[0]
                ? <img src={vehicle.photos_xe[0]} alt="" className="w-full h-full object-cover" />
                : <span className="text-ink-300 text-xs">Xe</span>}
            </div>
            <div>
              <div className="font-bold text-ink-900">{vehicle.plate}</div>
              {vehicle.name && <div className="text-[12px] text-ink-500">{vehicle.name}</div>}
            </div>
          </div>
        )}

        <div className="text-[11px] font-bold text-ink-400 uppercase px-2 mb-1.5">Chọn tài xế</div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-8">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        )}

        {drivers && drivers.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12.5px] text-amber-800">
            Chưa có tài xế. Vào <b>Quản lý nhân sự</b> thêm tài xế trước.
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-ink-100">
          {/* Bỏ gán */}
          <Option label="— Không gán tài xế —" active={selected === null} onClick={() => setSelected(null)} />
          {drivers?.map(d => (
            <Option key={d.id}
              label={d.name} sub={`CCCD: ${d.cccd}${d.phone ? ' · ' + d.phone : ''}`}
              photo={d.photo_face}
              active={selected === d.id}
              onClick={() => setSelected(d.id)} />
          ))}
        </div>
      </div>

      <div className="safe-bottom p-3 bg-white border-t border-ink-200">
        <button onClick={onSave} disabled={assign.isPending}
          className="w-full h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60">
          {assign.isPending ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </div>
  )
}

function Option({ label, sub, photo, active, onClick }: {
  label: string; sub?: string; photo?: string | null; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 active:bg-ink-50 text-left">
      <div className="w-10 h-10 rounded-full bg-ink-100 overflow-hidden flex items-center justify-center flex-shrink-0">
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <UserRound size={18} className="text-ink-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium text-ink-800 truncate">{label}</div>
        {sub && <div className="text-[11px] text-ink-500 truncate">{sub}</div>}
      </div>
      {active && <Check size={20} className="text-brand-600 flex-shrink-0" />}
    </button>
  )
}
