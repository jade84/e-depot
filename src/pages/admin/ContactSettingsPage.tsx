import { useEffect, useState } from 'react'
import { Check, Loader2, ShieldAlert } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useCompanyInfo, useSaveCompanyInfo, DEFAULT_COMPANY, type CompanyInfo } from '../../features/settings'

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

export function ContactSettingsPage() {
  const { can } = useAuth()
  const { data: company, isLoading } = useCompanyInfo()
  const save = useSaveCompanyInfo()
  const [f, setF] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { if (company) setF(company) }, [company])

  const isAdmin = can('contact')
  const set = <K extends keyof CompanyInfo>(k: K, v: CompanyInfo[K]) => setF(s => ({ ...s, [k]: v }))

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Thông tin liên hệ" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-ink-500">
            <ShieldAlert size={40} className="mx-auto mb-2 text-ink-300" />
            <div className="text-[14px] font-semibold">Chỉ dành cho quản trị viên</div>
          </div>
        </div>
      </div>
    )
  }

  async function onSave() {
    setMsg(null)
    try {
      await save.mutateAsync({
        truSo: f.truSo.trim(),
        vanPhong: f.vanPhong.trim(),
        dienThoai: f.dienThoai.trim(),
        email: f.email.trim(),
      })
      setMsg({ type: 'ok', text: 'Đã lưu thông tin liên hệ.' })
    } catch (e) {
      setMsg({ type: 'err', text: 'Lỗi lưu: ' + (e as Error).message })
    }
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Thông tin liên hệ" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="text-[11px] text-ink-400 leading-snug">
                Thông tin này hiển thị ở mục <b>Liên hệ công việc</b> trên trang Thông tin.
              </div>

              <Field label="Trụ sở">
                <textarea value={f.truSo} onChange={e => set('truSo', e.target.value)} rows={2}
                  placeholder="Địa chỉ trụ sở" className={inputCls + ' leading-relaxed'} />
              </Field>

              <Field label="Văn phòng">
                <textarea value={f.vanPhong} onChange={e => set('vanPhong', e.target.value)} rows={2}
                  placeholder="Địa chỉ văn phòng (để trống nếu không có)" className={inputCls + ' leading-relaxed'} />
              </Field>

              <Field label="Điện thoại">
                <input value={f.dienThoai} onChange={e => set('dienThoai', e.target.value)}
                  placeholder="VD: (028) 2210.8750" className={inputCls} />
              </Field>

              <Field label="Email">
                <input value={f.email} onChange={e => set('email', e.target.value)}
                  inputMode="email" placeholder="VD: info@grlogs.com" className={inputCls} />
              </Field>
            </div>

            {msg && (
              <div className={`text-[12.5px] rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {msg.text}
              </div>
            )}

            <button onClick={onSave} disabled={save.isPending}
              className="w-full h-12 rounded-xl bg-brand-700 text-white font-bold text-[15px] active:bg-brand-800 disabled:opacity-60 flex items-center justify-center gap-2">
              {save.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Lưu thay đổi
            </button>
            <div className="pb-6" />
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-ink-600">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
