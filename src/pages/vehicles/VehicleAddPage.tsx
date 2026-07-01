import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader, PhotoUploadSlot } from '../../components/mobile'
import { useCreateVehicle } from '../../features/vehicles'
import { supabase } from '../../lib/supabase'
import { normalizePlate, isValidPlate } from '../../lib/validate'

const DRAFT_KEY = 'draft_vehicle'
function loadDraft(): Record<string, unknown> {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}') } catch { return {} }
}

export function VehicleAddPage() {
  const nav = useNavigate()
  const create = useCreateVehicle()

  const d0 = loadDraft()
  const [name, setName] = useState((d0.name as string) || '')
  const [plate, setPlate] = useState((d0.plate as string) || '')
  const [xe, setXe] = useState<(string | null)[]>((d0.xe as (string | null)[]) || [null, null])       // URL ảnh xe
  const [giay, setGiay] = useState<(string | null)[]>((d0.giay as (string | null)[]) || [null, null]) // URL ảnh giấy tờ
  const [uid, setUid] = useState<string | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)) }, [])

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, plate, xe, giay }))
  }, [name, plate, xe, giay])
  const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY)

  function setSlot(list: (string | null)[], setList: (v: (string | null)[]) => void, i: number, u: string | null) {
    const next = [...list]; next[i] = u; setList(next)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!isValidPlate(plate)) { setErr('Biển số chưa đúng. VD: 01A-1234, 51H-12345.'); return }
    const photosXe = xe.filter(Boolean) as string[]
    const photosGiay = giay.filter(Boolean) as string[]
    if (photosXe.length === 0) { setErr('Cần ít nhất 1 ảnh xe.'); return }
    if (photosGiay.length === 0) { setErr('Cần ảnh cà vẹt / đăng kiểm.'); return }

    try {
      await create.mutateAsync({ name: name.trim(), plate: normalizePlate(plate), photosXe, photosGiay })
      clearDraft()
      nav('/phuong-tien', { replace: true })
    } catch (e) {
      setErr('Lỗi lưu: ' + (e as Error).message)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <ScreenHeader title="Thêm phương tiện" />

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-semibold text-ink-600">Tên phương tiện</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Xe số 10"
            className="mt-1.5 w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition" />
        </div>

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Biển số <span className="text-red-500">*</span></label>
          <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="01A-1234"
            className="mt-1.5 w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition uppercase" />
          <p className="text-[10.5px] text-ink-400 mt-1 px-1">Định dạng: 01A-1234 · 01AB-1234 · 51H-12345</p>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Ảnh xe <span className="text-red-500">*</span></label>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {xe.map((u, i) => (
              <PhotoUploadSlot key={i} url={u} bucket="vehicles" userId={uid} label="Thêm ảnh xe"
                onChange={val => setSlot(xe, setXe, i, val)} />
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Ảnh cà vẹt & giấy đăng kiểm <span className="text-red-500">*</span></label>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {giay.map((u, i) => (
              <PhotoUploadSlot key={i} url={u} bucket="vehicles" userId={uid} label="Thêm giấy tờ"
                onChange={val => setSlot(giay, setGiay, i, val)} />
            ))}
          </div>
        </div>

        {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex gap-3 pt-2 pb-1">
          <button type="button" onClick={() => { clearDraft(); nav(-1) }}
            className="flex-1 h-12 rounded-xl bg-ink-100 text-ink-700 font-bold text-[15px] active:bg-ink-200">
            Hủy
          </button>
          <button type="submit" disabled={create.isPending}
            className="flex-1 h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60">
            {create.isPending ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
