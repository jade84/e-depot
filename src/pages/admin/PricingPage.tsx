import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, ShieldAlert } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useCatalog } from '../../features/catalog'
import { DEPOTS, CARRIERS, CONT_TYPES } from '../../lib/options'
import {
  usePricing, useUpsertPricing, useDeletePricing,
  type Pricing, type PricingInput,
} from '../../features/pricing'

const inputCls = 'w-full h-11 px-3 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

const LOAI_LABEL: Record<'lay' | 'tra', string> = { lay: 'Lấy cont', tra: 'Trả cont' }

const emptyForm = (loai: 'lay' | 'tra'): PricingInput => ({
  loai, loai_cont: '', depot: null, hang_tau: null, don_gia: 0, active: true,
})

export function PricingPage() {
  const { profile } = useAuth()
  const { data: rows, isLoading } = usePricing()
  const del = useDeletePricing()
  const [editing, setEditing] = useState<PricingInput | null>(null)

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Bảng giá" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
            <div className="text-[12px] mt-1">Tài khoản của bạn không có quyền quản lý bảng giá.</div>
          </div>
        </div>
      </div>
    )
  }

  const grouped: Record<'lay' | 'tra', Pricing[]> = { lay: [], tra: [] }
  for (const r of rows ?? []) grouped[r.loai]?.push(r)

  async function onDelete(r: Pricing) {
    if (!confirm(`Xoá đơn giá ${LOAI_LABEL[r.loai]} · ${r.loai_cont}?`)) return
    await del.mutateAsync(r.id)
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader
        title="Bảng giá phí nâng/hạ"
        right={
          <button
            onClick={() => setEditing(emptyForm('lay'))}
            className="flex items-center gap-1 bg-white/15 text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg active:bg-white/25"
          >
            <Plus size={15} /> Thêm
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (rows?.length ?? 0) === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-10">
            Chưa có đơn giá. Bấm <b>Thêm</b> để tạo.
          </div>
        ) : (
          (['lay', 'tra'] as const).map(loai => (
            <section key={loai}>
              <div className="text-[12px] font-bold text-brand-800 mb-2 px-1">{LOAI_LABEL[loai]}</div>
              {grouped[loai].length === 0 ? (
                <div className="text-[12px] text-ink-400 px-1">— chưa có —</div>
              ) : (
                <div className="space-y-2">
                  {grouped[loai].map(r => (
                    <PriceRow key={r.id} row={r}
                      onEdit={() => setEditing({ ...r })}
                      onDelete={() => onDelete(r)} />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
        <div className="pb-6" />
      </div>

      {editing && (
        <PriceEditor
          value={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function PriceRow({ row, onEdit, onDelete }: { row: Pricing; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 ${row.active ? '' : 'opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-ink-800">{row.loai_cont}</span>
          {!row.active && <span className="text-[10px] bg-ink-200 text-ink-500 px-1.5 py-0.5 rounded font-semibold">Tắt</span>}
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5 truncate">
          {row.depot || 'Mọi depot'} · {row.hang_tau || 'Mọi hãng tàu'}
        </div>
      </div>
      <div className="text-[15px] font-extrabold text-brand-700 whitespace-nowrap">
        {row.don_gia.toLocaleString('vi-VN')} đ
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 rounded-lg text-ink-500 active:bg-ink-100"><Pencil size={16} /></button>
        <button onClick={onDelete} className="p-2 rounded-lg text-red-500 active:bg-red-50"><Trash2 size={16} /></button>
      </div>
    </div>
  )
}

function PriceEditor({ value, onClose }: { value: PricingInput; onClose: () => void }) {
  const upsert = useUpsertPricing()
  const { data: depotList } = useCatalog('depot')
  const { data: carrierList } = useCatalog('carrier')
  const { data: contList } = useCatalog('cont_type')
  const depots = depotList?.length ? depotList : DEPOTS
  const carriers = carrierList?.length ? carrierList : CARRIERS
  const contTypes = contList?.length ? contList : CONT_TYPES

  const [f, setF] = useState<PricingInput>(value)
  const [err, setErr] = useState('')
  const set = <K extends keyof PricingInput>(k: K, v: PricingInput[K]) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    setErr('')
    if (!f.loai_cont) { setErr('Chọn loại cont.'); return }
    if (!f.don_gia || f.don_gia < 0) { setErr('Nhập đơn giá hợp lệ.'); return }
    try {
      await upsert.mutateAsync(f)
      onClose()
    } catch (e) {
      const msg = (e as Error).message
      setErr(msg.includes('duplicate') || msg.includes('unique')
        ? 'Đã có đơn giá cho tổ hợp này (loại/cont/depot/hãng tàu). Sửa dòng cũ thay vì tạo mới.'
        : 'Lỗi lưu: ' + msg)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-4 max-h-[88vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-ink-800">{f.id ? 'Sửa đơn giá' : 'Thêm đơn giá'}</h2>
          <button onClick={onClose} className="p-1 text-ink-400"><X size={22} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Loại nghiệp vụ" req>
            <div className="grid grid-cols-2 gap-2">
              {(['lay', 'tra'] as const).map(l => (
                <button key={l} type="button" onClick={() => set('loai', l)}
                  className={`h-11 rounded-xl text-[14px] font-semibold border transition ${
                    f.loai === l ? 'bg-brand-700 text-white border-brand-700' : 'bg-ink-50 text-ink-600 border-ink-200'
                  }`}>
                  {LOAI_LABEL[l]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Loại cont" req>
            <select value={f.loai_cont} onChange={e => set('loai_cont', e.target.value)} className={inputCls}>
              <option value="">— Chọn loại cont —</option>
              {contTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Đơn giá / 1 cont (VND)" req>
            <input
              value={f.don_gia ? String(f.don_gia) : ''}
              onChange={e => set('don_gia', parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
              inputMode="numeric" placeholder="VD: 200000" className={inputCls} />
            {f.don_gia > 0 && (
              <p className="text-[11px] text-brand-600 mt-1 font-semibold">{f.don_gia.toLocaleString('vi-VN')} đ</p>
            )}
          </Field>

          <Field label="Depot (bỏ trống = mọi depot)">
            <select value={f.depot ?? ''} onChange={e => set('depot', e.target.value || null)} className={inputCls}>
              <option value="">Mọi depot</option>
              {depots.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Hãng tàu (bỏ trống = mọi hãng)">
            <select value={f.hang_tau ?? ''} onChange={e => set('hang_tau', e.target.value || null)} className={inputCls}>
              <option value="">Mọi hãng tàu</option>
              {carriers.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-[13px] text-ink-700 py-1">
            <input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)}
              className="w-4 h-4 accent-brand-600" />
            Đang áp dụng (bật)
          </label>

          {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

          <button onClick={save} disabled={upsert.isPending}
            className="h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
            {upsert.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {f.id ? 'Lưu thay đổi' : 'Thêm đơn giá'}
          </button>
          <div className="pb-4" />
        </div>
      </div>
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
