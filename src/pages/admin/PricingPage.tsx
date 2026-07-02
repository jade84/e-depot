import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, ShieldAlert, Download, Upload, Percent } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useCatalog, CARRIER_GROUPS, CARRIER_GROUP_LABEL } from '../../features/catalog'
import { useVatPercent, useSaveVatPercent, DEFAULT_VAT } from '../../features/settings'
import { DEPOTS, CONT_TYPES } from '../../lib/options'
import { parseCsv, buildCsv, downloadCsv } from '../../lib/csv'
import {
  usePricing, useUpsertPricing, useDeletePricing, useImportPricing, withVat,
  type Pricing, type PricingInput,
} from '../../features/pricing'

const CSV_HEADER = ['loai_cont', 'depot', 'hang_tau_nhom', 'don_gia', 'active']

const inputCls = 'w-full h-11 px-3 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

const emptyForm = (): PricingInput => ({
  loai_cont: '', depot: null, hang_tau_nhom: null, don_gia: 0, active: true,
})

// Chuẩn hoá giá trị nhóm hãng tàu từ CSV: 'nội địa'/'noi_dia'/'nd' → 'noi_dia'; …
function normGroup(s: string): 'noi_dia' | 'quoc_te' | null {
  const x = s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s_]/g, '')
  if (!x) return null
  if (x.startsWith('noidia') || x === 'nd') return 'noi_dia'
  if (x.startsWith('quocte') || x === 'qt') return 'quoc_te'
  return null
}

export function PricingPage() {
  const { profile } = useAuth()
  const { data: rows, isLoading } = usePricing()
  const del = useDeletePricing()
  const imp = useImportPricing()
  const { data: contList } = useCatalog('cont_type')
  const contTypes = contList?.length ? contList : CONT_TYPES
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<PricingInput | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { data: vat } = useVatPercent()
  const saveVat = useSaveVatPercent()
  const [vatInput, setVatInput] = useState('')
  useEffect(() => { if (vat != null) setVatInput(String(vat)) }, [vat])

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

  async function onDelete(r: Pricing) {
    if (!confirm(`Xoá đơn giá ${r.loai_cont}?`)) return
    await del.mutateAsync(r.id)
  }

  // Tải template CSV: mỗi loại cont 1 dòng, điền sẵn giá hiện có (nếu có).
  function handleDownload() {
    const body: (string | number)[][] = []
    for (const ct of contTypes) {
      const cur = (rows ?? []).find(r => r.loai_cont === ct && !r.depot && !r.hang_tau_nhom)
      body.push([ct, '', '', cur ? cur.don_gia : '', 'TRUE'])
    }
    downloadCsv('bang-gia-template.csv', buildCsv(CSV_HEADER, body))
  }

  // Import CSV → upsert theo (loai_cont, depot, hang_tau_nhom). Bỏ qua ô giá trống.
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMsg(null)
    try {
      const grid = parseCsv(await file.text())
      if (grid.length < 2) { setMsg({ type: 'err', text: 'File rỗng hoặc chỉ có dòng tiêu đề.' }); return }
      const head = grid[0].map(h => h.trim().toLowerCase())
      const col = (aliases: string[]) => head.findIndex(h => aliases.includes(h))
      const iCont = col(['loai_cont', 'loại cont', 'cont'])
      const iDepot = col(['depot'])
      const iNhom = col(['hang_tau_nhom', 'nhom', 'nhóm', 'hang_tau', 'hãng tàu'])
      const iGia = col(['don_gia', 'đơn giá', 'gia', 'don gia'])
      const iAct = col(['active', 'bật', 'bat'])
      if (iCont < 0 || iGia < 0) {
        setMsg({ type: 'err', text: 'Thiếu cột bắt buộc: loai_cont, don_gia.' }); return
      }
      const inputs: PricingInput[] = []
      let bad = 0
      for (let r = 1; r < grid.length; r++) {
        const c = grid[r]
        const giaRaw = (c[iGia] ?? '').replace(/[^\d]/g, '')
        if (giaRaw === '') continue // ô giá trống → bỏ qua dòng
        const cont = (c[iCont] ?? '').trim()
        if (!cont) { bad++; continue }
        const actRaw = (iAct >= 0 ? (c[iAct] ?? '') : '').trim().toLowerCase()
        inputs.push({
          loai_cont: cont,
          depot: (iDepot >= 0 ? (c[iDepot] ?? '').trim() : '') || null,
          hang_tau_nhom: iNhom >= 0 ? normGroup(c[iNhom] ?? '') : null,
          don_gia: parseInt(giaRaw, 10) || 0,
          active: !['false', '0', 'off', 'tắt', 'tat', 'khong', 'không', 'no'].includes(actRaw),
        })
      }
      if (!inputs.length) { setMsg({ type: 'err', text: 'Không có dòng hợp lệ (nhớ điền cột don_gia).' }); return }
      const res = await imp.mutateAsync(inputs)
      setMsg({
        type: 'ok',
        text: `Đã nhập: ${res.inserted} thêm mới, ${res.updated} cập nhật.` + (bad ? ` Bỏ qua ${bad} dòng lỗi.` : ''),
      })
    } catch (err) {
      setMsg({ type: 'err', text: 'Lỗi import: ' + (err as Error).message })
    }
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader
        title="Bảng giá phí nâng/hạ"
        right={
          <button
            onClick={() => setEditing(emptyForm())}
            className="flex items-center gap-1 bg-white/15 text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg active:bg-white/25"
          >
            <Plus size={15} /> Thêm
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-4">
        {/* Thuế VAT */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Percent size={16} className="text-brand-700 shrink-0" />
            <span className="text-[13px] font-semibold text-ink-700 flex-1">Thuế VAT</span>
            <input value={vatInput}
              onChange={e => setVatInput(e.target.value.replace(/[^\d.]/g, ''))}
              inputMode="decimal" placeholder={String(DEFAULT_VAT)}
              className="w-16 h-9 px-2 text-center rounded-lg border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500" />
            <span className="text-[13px] text-ink-500">%</span>
            <button
              onClick={() => saveVat.mutate(parseFloat(vatInput) || 0)}
              disabled={saveVat.isPending}
              className="h-9 px-3 rounded-lg bg-brand-700 text-white text-[12.5px] font-semibold active:bg-brand-800 disabled:opacity-60">
              {saveVat.isPending ? '…' : 'Lưu'}
            </button>
          </div>
          <p className="text-[10.5px] text-ink-400 mt-2 leading-snug">
            Đơn giá bên dưới nhập <b>chưa gồm VAT</b>. Phí trên đơn = đơn giá × số lượng × (1 + VAT%).
          </p>
        </div>

        {/* Toolbar: template + import CSV */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex gap-2">
            <button onClick={handleDownload}
              className="flex-1 h-10 rounded-xl border border-ink-200 text-ink-700 text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-ink-100">
              <Download size={16} /> Tải template
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={imp.isPending}
              className="flex-1 h-10 rounded-xl bg-brand-700 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-brand-800 disabled:opacity-60">
              {imp.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
          </div>
          <p className="text-[10.5px] text-ink-400 mt-2 leading-snug">
            Tải template → điền cột <b>don_gia</b> bằng Excel → Import. Cột <b>hang_tau_nhom</b> nhập <b>noi_dia</b>/<b>quoc_te</b> (bỏ trống = mọi hãng); <b>depot</b> bỏ trống = mọi depot.
          </p>
          {msg && (
            <div className={`mt-2 text-[12px] rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (rows?.length ?? 0) === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-10">
            Chưa có đơn giá. Bấm <b>Thêm</b> để tạo.
          </div>
        ) : (
          <div className="space-y-2">
            {rows!.map(r => (
              <PriceRow key={r.id} row={r} vatPct={parseFloat(vatInput) || DEFAULT_VAT}
                onEdit={() => setEditing({ ...r })}
                onDelete={() => onDelete(r)} />
            ))}
          </div>
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

function PriceRow({ row, vatPct, onEdit, onDelete }: {
  row: Pricing; vatPct: number; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 ${row.active ? '' : 'opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-ink-800">{row.loai_cont}</span>
          {!row.active && <span className="text-[10px] bg-ink-200 text-ink-500 px-1.5 py-0.5 rounded font-semibold">Tắt</span>}
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5 truncate">
          {row.depot || 'Mọi depot'} · {row.hang_tau_nhom ? CARRIER_GROUP_LABEL[row.hang_tau_nhom] : 'Mọi hãng tàu'}
        </div>
      </div>
      <div className="text-right whitespace-nowrap flex flex-col items-end gap-1">
        <div className="text-[15px] font-extrabold text-brand-700">{row.don_gia.toLocaleString('vi-VN')} đ</div>
        <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
          đã VAT: {withVat(row.don_gia, vatPct).toLocaleString('vi-VN')} đ
        </span>
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
  const { data: contList } = useCatalog('cont_type')
  const depots = depotList?.length ? depotList : DEPOTS
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
        ? 'Đã có đơn giá cho tổ hợp này (loại cont/depot/hãng tàu). Sửa dòng cũ thay vì tạo mới.'
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
          <Field label="Loại cont" req>
            <select value={f.loai_cont} onChange={e => set('loai_cont', e.target.value)} className={inputCls}>
              <option value="">— Chọn loại cont —</option>
              {contTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Đơn giá / 1 cont (VND, chưa VAT)" req>
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

          <Field label="Nhóm hãng tàu (bỏ trống = mọi hãng)">
            <select value={f.hang_tau_nhom ?? ''} onChange={e => set('hang_tau_nhom', e.target.value || null)} className={inputCls}>
              <option value="">Mọi hãng tàu</option>
              {CARRIER_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
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
