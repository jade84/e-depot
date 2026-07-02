import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { ScreenHeader, PhotoUploadSlot, FeeBreakdown } from '../../components/mobile'
import { useVehicles } from '../../features/vehicles'
import { useDrivers } from '../../features/drivers'
import { useCreateOrder } from '../../features/orders'
import { useCatalog, useCarriers } from '../../features/catalog'
import { usePricing, matchPrice, withVat } from '../../features/pricing'
import { useVatPercent, DEFAULT_VAT } from '../../features/settings'
import { supabase } from '../../lib/supabase'
import { DEPOTS, CARRIERS, CONT_TYPES } from '../../lib/options'
import { normalizeCont, isValidContNo } from '../../lib/validate'

const DRAFT_KEY = 'draft_tracont'
function loadDraft(): Record<string, unknown> {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}') } catch { return {} }
}

export function TraContPage() {
  const nav = useNavigate()
  const create = useCreateOrder()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { data: depotList } = useCatalog('depot')
  const { data: carrierList } = useCatalog('carrier')
  const { data: contList } = useCatalog('cont_type')
  const { data: prices } = usePricing()
  const { data: vat } = useVatPercent()
  const { data: carriersInfo } = useCarriers()
  const depots = depotList?.length ? depotList : DEPOTS
  const carriers = carrierList?.length ? carrierList : CARRIERS
  const contTypes = contList?.length ? contList : CONT_TYPES

  const d0 = loadDraft()
  const [soBl, setSoBl] = useState((d0.soBl as string) || '')
  const [depot, setDepot] = useState((d0.depot as string) || '')
  const [hangTau, setHangTau] = useState((d0.hangTau as string) || '')
  const [loaiCont, setLoaiCont] = useState((d0.loaiCont as string) || '')
  const [conts, setConts] = useState<string[]>((d0.conts as string[]) || [])
  const [contInput, setContInput] = useState('')
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
      soBl, depot, hangTau, loaiCont, conts, vehicleId, manualDriverId, congTyHd, mst, phi, photos,
    }))
  }, [soBl, depot, hangTau, loaiCont, conts, vehicleId, manualDriverId, congTyHd, mst, phi, photos])
  const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY)

  const vehicle = useMemo(() => vehicles?.find(v => v.id === vehicleId), [vehicles, vehicleId])
  const assignedDriver = useMemo(() => drivers?.find(d => d.id === vehicle?.driver_id) || null, [drivers, vehicle])
  const driver = assignedDriver || drivers?.find(d => d.id === manualDriverId) || null

  // Đơn giá bảng giá (admin) là CHƯA VAT → phí = tạm tính × (1 + VAT).
  const vatPct = vat ?? DEFAULT_VAT
  const carrierGroup = carriersInfo?.find(c => c.name === hangTau)?.nhom ?? null
  const unitPrice = matchPrice(prices, { loai_cont: loaiCont, depot, carrierGroup })
  const subtotal = unitPrice != null ? unitPrice * conts.length : null
  const autoTotal = subtotal != null ? withVat(subtotal, vatPct) : null

  function addCont() {
    // Cho phép dán nhiều số cùng lúc (cách nhau bởi dấu cách/phẩy/xuống dòng)
    const parts = contInput.split(/[\s,;]+/).map(normalizeCont).filter(Boolean)
    const invalid: string[] = []
    const next = [...conts]
    for (const p of parts) {
      if (!isValidContNo(p)) { invalid.push(p); continue }
      if (!next.includes(p)) next.push(p)
    }
    setConts(next)
    setContInput('')
    setErr(invalid.length ? `Số cont không hợp lệ (bỏ qua): ${invalid.join(', ')}` : '')
  }
  function removeCont(c: string) { setConts(conts.filter(x => x !== c)) }
  function setPhoto(i: number, u: string | null) { setPhotos(p => { const n = [...p]; n[i] = u; return n }) }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!soBl.trim()) { setErr('Nhập số B/L / vận đơn.'); return }
    if (!depot) { setErr('Chọn depot.'); return }
    if (!hangTau) { setErr('Chọn hãng tàu.'); return }
    if (!loaiCont) { setErr('Chọn loại cont.'); return }
    if (conts.length === 0) { setErr('Nhập ít nhất 1 số cont (ISO 6346).'); return }
    if (!vehicleId || !vehicle) { setErr('Chọn xe vận chuyển.'); return }
    if (!driver) { setErr('Xe chưa gán tài xế — chọn tài xế bên dưới.'); return }
    const anh = photos.filter(Boolean) as string[]
    if (anh.length === 0) { setErr('Cần ảnh lệnh hạ rỗng / phiếu EIR.'); return }

    try {
      await create.mutateAsync({
        loai: 'tra',
        so_bl: soBl.trim(),
        depot, hang_tau: hangTau, loai_cont: loaiCont, so_luong: conts.length, so_cont: conts,
        vehicle_id: vehicleId, bien_so: vehicle.plate,
        driver_id: driver.id, tai_xe_ten: driver.name, tai_xe_cccd: driver.cccd,
        cong_ty_hd: congTyHd.trim(), mst: mst.trim(),
        photos: anh,
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
      <ScreenHeader title="Trả cont rỗng" />

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
        <Card title="Thông tin Container">
          <Field label="Số B/L // số vận đơn" req>
            <input value={soBl} onChange={e => setSoBl(e.target.value.toUpperCase())} placeholder="VD: ABCDEF123" className={inputCls + ' uppercase'} />
          </Field>
          <Field label="Depot" req><Select value={depot} onChange={setDepot} options={depots} placeholder="Chọn depot" /></Field>
          <Field label="Hãng tàu" req><Select value={hangTau} onChange={setHangTau} options={carriers} placeholder="Chọn hãng tàu" /></Field>
          <Field label="Loại cont" req><Select value={loaiCont} onChange={setLoaiCont} options={contTypes} placeholder="Chọn loại" /></Field>

          <Field label="Số cont (ISO 6346)" req>
            <div className="flex gap-2">
              <input value={contInput}
                onChange={e => setContInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCont() } }}
                placeholder="VD: MEDU1234567" className={inputCls + ' uppercase flex-1'} />
              <button type="button" onClick={addCont}
                className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center active:bg-brand-700 flex-shrink-0">
                <Plus size={20} />
              </button>
            </div>
            <p className="text-[10.5px] text-ink-400 mt-1">4 chữ + 7 số. Có thể dán nhiều số cùng lúc.</p>
            {conts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {conts.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[12px] font-semibold px-2 py-1 rounded-lg">
                    {c}
                    <button type="button" onClick={() => removeCont(c)}><X size={13} /></button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </Card>

        <Card title="Xe & tài xế">
          <Field label="Chọn xe (biển số)" req>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className={inputCls}>
              <option value="">— Chọn xe —</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.plate}{v.name ? ` · ${v.name}` : ''}</option>)}
            </select>
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

        <Card title="Thông tin hóa đơn">
          <Field label="Công ty xuất hóa đơn">
            <input value={congTyHd} onChange={e => setCongTyHd(e.target.value)} placeholder="Tên công ty" className={inputCls} />
          </Field>
          <Field label="Mã số thuế (MST)">
            <input value={mst} onChange={e => setMst(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="VD: 0312345678" className={inputCls} />
          </Field>
        </Card>

        <Card title="Thủ tục">
          <Field label="Ảnh lệnh hạ rỗng / phiếu EIR" req>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((u, i) => (
                <PhotoUploadSlot key={i} url={u} bucket="orders" userId={uid} label="Thêm ảnh" onChange={val => setPhoto(i, val)} />
              ))}
            </div>
          </Field>
          {autoTotal != null ? (
            <Field label="Phí nâng hạ (tự tính theo bảng giá)">
              <FeeBreakdown subtotal={subtotal!} vatPct={vatPct} total={autoTotal}
                unitPrice={unitPrice!} qty={conts.length} />
            </Field>
          ) : (
            <Field label="Phí nâng hạ (nếu biết)">
              <input value={phi} onChange={e => setPhi(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="0" className={inputCls} />
            </Field>
          )}
        </Card>

        {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex gap-3 pb-2">
          <button type="button" onClick={() => { clearDraft(); nav(-1) }}
            className="flex-1 h-12 rounded-xl bg-white text-ink-700 font-bold text-[15px] border border-ink-200 active:bg-ink-100">Hủy</button>
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
