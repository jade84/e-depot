import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader, PhotoUploadSlot, FeeBreakdown } from '../../components/mobile'
import { useVehicles } from '../../features/vehicles'
import { useDrivers } from '../../features/drivers'
import { useCreateOrder } from '../../features/orders'
import { useCatalog } from '../../features/catalog'
import { usePricing, matchPrice, withVat } from '../../features/pricing'
import { useVatPercent, DEFAULT_VAT } from '../../features/settings'
import { supabase } from '../../lib/supabase'
import { DEPOTS, CARRIERS, CONT_TYPES } from '../../lib/options'

const DRAFT_KEY = 'draft_laycont'
function loadDraft(): Record<string, unknown> {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}') } catch { return {} }
}

export function LayContPage() {
  const nav = useNavigate()
  const create = useCreateOrder()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()

  // Danh mục từ DB (admin quản lý) — nếu chưa có thì tạm dùng list mặc định trong code
  const { data: depotList } = useCatalog('depot')
  const { data: carrierList } = useCatalog('carrier')
  const { data: contList } = useCatalog('cont_type')
  const { data: prices } = usePricing()
  const { data: vat } = useVatPercent()
  const depots = depotList?.length ? depotList : DEPOTS
  const carriers = carrierList?.length ? carrierList : CARRIERS
  const contTypes = contList?.length ? contList : CONT_TYPES

  const d0 = loadDraft()
  const [soBl, setSoBl] = useState((d0.soBl as string) || '')
  const [depot, setDepot] = useState((d0.depot as string) || '')
  const [hangTau, setHangTau] = useState((d0.hangTau as string) || '')
  const [loaiCont, setLoaiCont] = useState((d0.loaiCont as string) || '')
  const [soLuong, setSoLuong] = useState<string>((d0.soLuong as string) || '1')
  const [vehicleId, setVehicleId] = useState((d0.vehicleId as string) || '')
  const [manualDriverId, setManualDriverId] = useState((d0.manualDriverId as string) || '')
  const [congTyHd, setCongTyHd] = useState((d0.congTyHd as string) || '')
  const [mst, setMst] = useState((d0.mst as string) || '')
  const [phi, setPhi] = useState<string>((d0.phi as string) || '')
  const [photos, setPhotos] = useState<(string | null)[]>((d0.photos as (string | null)[]) || [null, null, null])
  const [uid, setUid] = useState<string | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)) }, [])
  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      soBl, depot, hangTau, loaiCont, soLuong, vehicleId, manualDriverId, congTyHd, mst, phi, photos,
    }))
  }, [soBl, depot, hangTau, loaiCont, soLuong, vehicleId, manualDriverId, congTyHd, mst, phi, photos])
  const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY)

  const vehicle = useMemo(() => vehicles?.find(v => v.id === vehicleId), [vehicles, vehicleId])
  const assignedDriver = useMemo(() => drivers?.find(d => d.id === vehicle?.driver_id) || null, [drivers, vehicle])
  const driver = assignedDriver || drivers?.find(d => d.id === manualDriverId) || null

  // Đơn giá theo bảng giá (admin) là CHƯA VAT → phí = tạm tính × (1 + VAT).
  // null = chưa có giá → tài xế nhập tay.
  const vatPct = vat ?? DEFAULT_VAT
  const soLuongNum = parseInt(soLuong, 10) || 0
  const unitPrice = matchPrice(prices, { loai_cont: loaiCont, depot, hang_tau: hangTau })
  const subtotal = unitPrice != null ? unitPrice * soLuongNum : null
  const autoTotal = subtotal != null ? withVat(subtotal, vatPct) : null

  function setPhoto(i: number, u: string | null) {
    setPhotos(p => { const n = [...p]; n[i] = u; return n })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!soBl.trim()) { setErr('Nhập số B/L / vận đơn.'); return }
    if (!depot) { setErr('Chọn depot.'); return }
    if (!hangTau) { setErr('Chọn hãng tàu.'); return }
    if (!loaiCont) { setErr('Chọn loại cont.'); return }
    const sl = parseInt(soLuong, 10)
    if (!sl || sl < 1) { setErr('Số lượng cont phải ≥ 1.'); return }
    if (!vehicleId || !vehicle) { setErr('Chọn xe vận chuyển.'); return }
    if (!driver) { setErr('Xe chưa gán tài xế — chọn tài xế bên dưới (hoặc gán trong Quản lý phương tiện).'); return }
    const anhLenh = photos.filter(Boolean) as string[]
    if (anhLenh.length === 0) { setErr('Cần ảnh lệnh lấy rỗng.'); return }

    try {
      await create.mutateAsync({
        loai: 'lay',
        so_bl: soBl.trim(),
        depot, hang_tau: hangTau, loai_cont: loaiCont, so_luong: sl, so_cont: [],
        vehicle_id: vehicleId, bien_so: vehicle.plate,
        driver_id: driver.id, tai_xe_ten: driver.name, tai_xe_cccd: driver.cccd,
        cong_ty_hd: congTyHd.trim(), mst: mst.trim(),
        photos: anhLenh,
        phi_nang_ha: autoTotal != null ? autoTotal : (parseFloat(phi) || 0),
      })
      clearDraft()
      nav('/don-hang', { replace: true })
    } catch (e) {
      setErr('Lỗi tạo đơn: ' + (e as Error).message)
    }
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Lấy cont rỗng" />

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
        {/* Thông tin Container */}
        <Card title="Thông tin Container">
          <Field label="Số B/L // số vận đơn" req>
            <input value={soBl} onChange={e => setSoBl(e.target.value.toUpperCase())} placeholder="VD: ABCDEF123"
              className={inputCls + ' uppercase'} />
          </Field>
          <Field label="Depot" req>
            <Select value={depot} onChange={setDepot} options={depots} placeholder="Chọn depot" />
          </Field>
          <Field label="Hãng tàu" req>
            <Select value={hangTau} onChange={setHangTau} options={carriers} placeholder="Chọn hãng tàu" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại cont" req>
              <Select value={loaiCont} onChange={setLoaiCont} options={contTypes} placeholder="Chọn loại" />
            </Field>
            <Field label="Số lượng" req>
              <input value={soLuong} onChange={e => setSoLuong(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" placeholder="1" className={inputCls} />
            </Field>
          </div>
        </Card>

        {/* Xe & tài xế */}
        <Card title="Xe & tài xế">
          <Field label="Chọn xe (biển số)" req>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className={inputCls}>
              <option value="">— Chọn xe —</option>
              {vehicles?.map(v => (
                <option key={v.id} value={v.id}>{v.plate}{v.name ? ` · ${v.name}` : ''}</option>
              ))}
            </select>
            {vehicles && vehicles.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">Chưa có xe. Vào Quản lý phương tiện thêm xe trước.</p>
            )}
          </Field>

          {vehicle && (
            assignedDriver ? (
              <div className="bg-green-50 rounded-lg px-3 py-2 text-[12.5px] text-green-800">
                Tài xế: <b>{assignedDriver.name}</b> · CCCD {assignedDriver.cccd}
              </div>
            ) : (
              <Field label="Tài xế (xe chưa gán — chọn tại đây)" req>
                <select value={manualDriverId} onChange={e => setManualDriverId(e.target.value)} className={inputCls}>
                  <option value="">— Chọn tài xế —</option>
                  {drivers?.map(d => <option key={d.id} value={d.id}>{d.name} · {d.cccd}</option>)}
                </select>
              </Field>
            )
          )}
        </Card>

        {/* Hóa đơn */}
        <Card title="Thông tin hóa đơn">
          <Field label="Công ty xuất hóa đơn">
            <input value={congTyHd} onChange={e => setCongTyHd(e.target.value)} placeholder="Tên công ty" className={inputCls} />
          </Field>
          <Field label="Mã số thuế (MST)">
            <input value={mst} onChange={e => setMst(e.target.value.replace(/\D/g, ''))} inputMode="numeric"
              placeholder="VD: 0312345678" className={inputCls} />
          </Field>
        </Card>

        {/* Thủ tục */}
        <Card title="Thủ tục">
          <Field label="Ảnh lệnh lấy rỗng / giấy giới thiệu" req>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((u, i) => (
                <PhotoUploadSlot key={i} url={u} bucket="orders" userId={uid} label="Thêm ảnh"
                  onChange={val => setPhoto(i, val)} />
              ))}
            </div>
          </Field>
          {autoTotal != null ? (
            <Field label="Phí nâng hạ (tự tính theo bảng giá)">
              <FeeBreakdown subtotal={subtotal!} vatPct={vatPct} total={autoTotal}
                unitPrice={unitPrice!} qty={soLuongNum} />
            </Field>
          ) : (
            <Field label="Phí nâng hạ (nếu biết)">
              <input value={phi} onChange={e => setPhi(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric"
                placeholder="0" className={inputCls} />
            </Field>
          )}
        </Card>

        {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex gap-3 pb-2">
          <button type="button" onClick={() => { clearDraft(); nav(-1) }}
            className="flex-1 h-12 rounded-xl bg-white text-ink-700 font-bold text-[15px] border border-ink-200 active:bg-ink-100">
            Hủy
          </button>
          <button type="submit" disabled={create.isPending}
            className="flex-1 h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60">
            {create.isPending ? 'Đang tạo…' : 'Tạo đơn'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-[13px] font-bold text-brand-800 mb-3">{title}</div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-ink-600">{label}{req && <span className="text-red-500"> *</span>}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
