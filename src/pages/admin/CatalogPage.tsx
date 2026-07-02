import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, ShieldAlert } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import {
  useCatalogAdmin, useUpsertCatalog, useDeleteCatalog,
  CARRIER_GROUPS, CARRIER_GROUP_LABEL,
  type CatalogType, type CatalogItem, type CatalogInput,
} from '../../features/catalog'

const inputCls = 'w-full h-11 px-3 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

const TABS: { type: CatalogType; label: string }[] = [
  { type: 'depot', label: 'Depot' },
  { type: 'carrier', label: 'Hãng tàu' },
  { type: 'cont_type', label: 'Loại cont' },
]

export function CatalogPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<CatalogType>('depot')
  const [editing, setEditing] = useState<CatalogInput | null>(null)
  const { data: items, isLoading } = useCatalogAdmin(tab)
  const del = useDeleteCatalog()

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Danh mục" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
          </div>
        </div>
      </div>
    )
  }

  const nextSort = (items?.length ? Math.max(...items.map(i => i.sort)) : -1) + 1

  async function onDelete(it: CatalogItem) {
    if (!confirm(`Xoá "${it.name}"?`)) return
    await del.mutateAsync({ id: it.id, type: it.type })
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader
        title="Quản lý danh mục"
        right={
          <button
            onClick={() => setEditing({ type: tab, name: '', nhom: null, sort: nextSort, active: true })}
            className="flex items-center gap-1 bg-white/15 text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg active:bg-white/25"
          >
            <Plus size={15} /> Thêm
          </button>
        }
      />

      {/* Tabs */}
      <div className="bg-brand-800 px-3 pb-2 flex gap-1.5">
        {TABS.map(t => (
          <button key={t.type} onClick={() => setTab(t.type)}
            className={`flex-1 h-9 rounded-lg text-[12.5px] font-semibold transition ${
              tab === t.type ? 'bg-white text-brand-800' : 'bg-white/10 text-white/80'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (items?.length ?? 0) === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-10">
            Chưa có mục nào. Bấm <b>Thêm</b> để tạo.
          </div>
        ) : (
          items!.map(it => (
            <div key={it.id}
              className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 ${it.active ? '' : 'opacity-60'}`}>
              <span className="w-7 h-7 rounded-lg bg-ink-100 text-ink-500 text-[12px] font-bold flex items-center justify-center shrink-0">
                {it.sort}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink-800 truncate">{it.name}</span>
                  {it.type === 'carrier' && it.nhom && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded shrink-0">
                      {CARRIER_GROUP_LABEL[it.nhom] ?? it.nhom}
                    </span>
                  )}
                </div>
                {!it.active && <span className="text-[10px] text-ink-400">Đang tắt</span>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing({ ...it })} className="p-2 rounded-lg text-ink-500 active:bg-ink-100"><Pencil size={16} /></button>
                <button onClick={() => onDelete(it)} className="p-2 rounded-lg text-red-500 active:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
        <div className="pb-6" />
      </div>

      {editing && <CatalogEditor value={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CatalogEditor({ value, onClose }: { value: CatalogInput; onClose: () => void }) {
  const upsert = useUpsertCatalog()
  const [f, setF] = useState<CatalogInput>(value)
  const [err, setErr] = useState('')
  const set = <K extends keyof CatalogInput>(k: K, v: CatalogInput[K]) => setF(s => ({ ...s, [k]: v }))
  const typeLabel = TABS.find(t => t.type === f.type)?.label ?? ''

  async function save() {
    setErr('')
    if (!f.name.trim()) { setErr('Nhập tên.'); return }
    try {
      await upsert.mutateAsync(f)
      onClose()
    } catch (e) {
      const msg = (e as Error).message
      setErr(msg.includes('duplicate') || msg.includes('unique')
        ? `"${f.name.trim()}" đã tồn tại trong ${typeLabel}.`
        : 'Lỗi lưu: ' + msg)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-4 max-h-[88vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-ink-800">
            {f.id ? 'Sửa' : 'Thêm'} — {typeLabel}
          </h2>
          <button onClick={onClose} className="p-1 text-ink-400"><X size={22} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Tên" req>
            <input value={f.name} onChange={e => set('name', e.target.value)}
              placeholder={f.type === 'cont_type' ? "VD: 20'DC" : f.type === 'carrier' ? 'VD: MAERSK' : 'VD: GreenLogistics Depot'}
              className={inputCls} autoFocus />
          </Field>

          {f.type === 'carrier' && (
            <Field label="Nhóm (để bảng giá áp theo nhóm)">
              <div className="grid grid-cols-2 gap-2">
                {CARRIER_GROUPS.map(g => (
                  <button key={g.value} type="button"
                    onClick={() => set('nhom', f.nhom === g.value ? null : g.value)}
                    className={`h-11 rounded-xl text-[14px] font-semibold border transition ${
                      f.nhom === g.value ? 'bg-brand-700 text-white border-brand-700' : 'bg-ink-50 text-ink-600 border-ink-200'
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
              <p className="text-[10.5px] text-ink-400 mt-1">Bấm lần nữa để bỏ chọn (không thuộc nhóm nào).</p>
            </Field>
          )}

          <Field label="Thứ tự hiển thị">
            <input value={String(f.sort)} onChange={e => set('sort', parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
              inputMode="numeric" className={inputCls} />
          </Field>

          <label className="flex items-center gap-2 text-[13px] text-ink-700 py-1">
            <input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)}
              className="w-4 h-4 accent-brand-600" />
            Đang hiển thị (bật)
          </label>

          {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

          <button onClick={save} disabled={upsert.isPending}
            className="h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
            {upsert.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {f.id ? 'Lưu thay đổi' : 'Thêm'}
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
