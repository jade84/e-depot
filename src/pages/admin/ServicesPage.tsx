import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, ShieldAlert } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import {
  useServicesAdmin, useUpsertService, useDeleteService,
  SERVICE_ICON_KEYS, serviceIcon,
  type Service, type ServiceInput,
} from '../../features/services'

const inputCls = 'w-full h-11 px-3 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

const emptyForm = (sort: number): ServiceInput => ({
  title: '', mo_ta: '', noi_dung: '', icon: 'container', sort, active: true,
})

export function ServicesPage() {
  const { profile } = useAuth()
  const { data: rows, isLoading } = useServicesAdmin()
  const del = useDeleteService()
  const [editing, setEditing] = useState<ServiceInput | null>(null)

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Dịch vụ" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
          </div>
        </div>
      </div>
    )
  }

  const nextSort = (rows?.length ? Math.max(...rows.map(r => r.sort)) : -1) + 1

  async function onDelete(s: Service) {
    if (!confirm(`Xoá dịch vụ "${s.title}"?`)) return
    await del.mutateAsync(s.id)
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader
        title="Quản lý dịch vụ"
        right={
          <button onClick={() => setEditing(emptyForm(nextSort))}
            className="flex items-center gap-1 bg-white/15 text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg active:bg-white/25">
            <Plus size={15} /> Thêm
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (rows?.length ?? 0) === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-10">Chưa có dịch vụ. Bấm <b>Thêm</b>.</div>
        ) : (
          rows!.map(s => {
            const Icon = serviceIcon(s.icon)
            return (
              <div key={s.id} className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 ${s.active ? '' : 'opacity-60'}`}>
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-ink-800 truncate">{s.title}</span>
                    {!s.active && <span className="text-[10px] bg-ink-200 text-ink-500 px-1.5 py-0.5 rounded font-semibold shrink-0">Ẩn</span>}
                  </div>
                  {s.mo_ta && <div className="text-[11px] text-ink-400 mt-0.5 truncate">{s.mo_ta}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing({ ...s, mo_ta: s.mo_ta ?? '', noi_dung: s.noi_dung ?? '' })}
                    className="p-2 rounded-lg text-ink-500 active:bg-ink-100"><Pencil size={16} /></button>
                  <button onClick={() => onDelete(s)} className="p-2 rounded-lg text-red-500 active:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })
        )}
        <div className="pb-6" />
      </div>

      {editing && <ServiceEditor value={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ServiceEditor({ value, onClose }: { value: ServiceInput; onClose: () => void }) {
  const upsert = useUpsertService()
  const [f, setF] = useState<ServiceInput>(value)
  const [err, setErr] = useState('')
  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    setErr('')
    if (!f.title.trim()) { setErr('Nhập tên dịch vụ.'); return }
    try {
      await upsert.mutateAsync(f)
      onClose()
    } catch (e) {
      setErr('Lỗi lưu: ' + (e as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-ink-800">{f.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h2>
          <button onClick={onClose} className="p-1 text-ink-400"><X size={22} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Tên dịch vụ" req>
            <input value={f.title} onChange={e => set('title', e.target.value)}
              placeholder="VD: Green Trucking" className={inputCls} autoFocus />
          </Field>

          <Field label="Icon">
            <div className="grid grid-cols-4 gap-2">
              {SERVICE_ICON_KEYS.map(k => {
                const Icon = serviceIcon(k)
                return (
                  <button key={k} type="button" onClick={() => set('icon', k)}
                    className={`h-11 rounded-xl border flex items-center justify-center transition ${
                      f.icon === k ? 'bg-brand-700 text-white border-brand-700' : 'bg-ink-50 text-ink-500 border-ink-200'
                    }`}>
                    <Icon size={20} />
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Mô tả ngắn">
            <input value={f.mo_ta} onChange={e => set('mo_ta', e.target.value)}
              placeholder="Hiện ở danh sách dịch vụ" className={inputCls} />
          </Field>

          <Field label="Nội dung chi tiết">
            <textarea value={f.noi_dung} onChange={e => set('noi_dung', e.target.value)}
              rows={6} placeholder="Nội dung hiển thị khi bấm vào dịch vụ (có thể để trống, điền sau)."
              className="w-full px-3 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition leading-relaxed" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Thứ tự">
              <input value={String(f.sort)} onChange={e => set('sort', parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                inputMode="numeric" className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-ink-700 self-end pb-2.5">
              <input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)}
                className="w-4 h-4 accent-brand-600" />
              Hiển thị
            </label>
          </div>

          {err && <div className="text-[12.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

          <button onClick={save} disabled={upsert.isPending}
            className="h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
            {upsert.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {f.id ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
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
