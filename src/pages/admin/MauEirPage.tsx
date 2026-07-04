import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, ShieldAlert, ImagePlus, X } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useEirSettings, useSaveEirSettings, EIR_SETTINGS_DEFAULTS, type EirSettings } from '../../features/eir'

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

// Các trường text sửa được (bỏ logo_uri — logo xử lý riêng qua upload).
const FIELDS: { key: keyof EirSettings; label: string; ph?: string; multi?: boolean }[] = [
  { key: 'cn_vi', label: 'Tên công ty (tiếng Việt)' },
  { key: 'cn_en', label: 'Tên công ty (tiếng Anh)' },
  { key: 'logo_caption', label: 'Chữ dưới logo', ph: 'VD: Green Logistics' },
  { key: 'mst', label: 'Mã số thuế' },
  { key: 'dienthoai', label: 'Điện thoại' },
  { key: 'diachi', label: 'Địa chỉ', multi: true },
  { key: 'vpdd', label: 'VPĐD (bỏ trống nếu không có)', multi: true },
  { key: 'bank1', label: 'Ngân hàng - dòng 1' },
  { key: 'bank2', label: 'Ngân hàng - dòng 2 (bỏ trống nếu không có)' },
  { key: 'bank3', label: 'Ngân hàng - dòng 3 (bỏ trống nếu không có)' },
]

export function MauEirPage() {
  const { can } = useAuth()
  const { data: cfg, isLoading } = useEirSettings()
  const save = useSaveEirSettings()
  const [f, setF] = useState<EirSettings>(EIR_SETTINGS_DEFAULTS)
  const [newLogo, setNewLogo] = useState<{ mime: string; b64: string } | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (cfg) setF(cfg) }, [cfg])

  const isAdmin = can('eir_form')
  const set = <K extends keyof EirSettings>(k: K, v: EirSettings[K]) => setF(s => ({ ...s, [k]: v }))

  // Logo đang xem: ảnh mới chọn > logo đã lưu > logo e-depot.
  const logoPreview = newLogo ? `data:${newLogo.mime};base64,${newLogo.b64}` : (f.logo_uri || '/logo.png')

  function pickLogo(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)  // data:<mime>;base64,<b64>
      const m = url.match(/^data:([^;]+);base64,(.+)$/)
      if (m) setNewLogo({ mime: m[1], b64: m[2] })
    }
    reader.readAsDataURL(file)
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Mẫu phiếu EIR" />
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
      const vals: Record<string, string> = {}
      for (const { key } of FIELDS) vals[key] = (f[key] || '').trim()
      if (newLogo) { vals.logo_mime = newLogo.mime; vals.logo_b64 = newLogo.b64 }
      await save.mutateAsync(vals)
      setNewLogo(null)
      setMsg({ type: 'ok', text: 'Đã lưu. Phiếu EIR từ giờ dùng thông tin mới.' })
    } catch (e) {
      setMsg({ type: 'err', text: 'Lỗi lưu: ' + (e as Error).message })
    }
  }

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Mẫu phiếu EIR" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="text-[11px] text-ink-400 leading-snug">
                Thông tin này hiện trên <b>header phiếu EIR</b> (tra cứu / in / tải).
              </div>

              {/* Logo */}
              <div>
                <label className="text-[12px] font-semibold text-ink-600">Logo</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="w-20 h-16 rounded-xl border border-ink-200 bg-ink-50 flex items-center justify-center overflow-hidden">
                    <img src={logoPreview} alt="logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5 active:bg-brand-100">
                      <ImagePlus size={15} /> Chọn logo (PNG/JPG)
                    </button>
                    {newLogo && (
                      <button type="button" onClick={() => setNewLogo(null)}
                        className="flex items-center gap-1 text-[12px] text-ink-500">
                        <X size={13} /> Bỏ ảnh vừa chọn
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {FIELDS.map(({ key, label, ph, multi }) => (
                <div key={key}>
                  <label className="text-[12px] font-semibold text-ink-600">{label}</label>
                  <div className="mt-1.5">
                    {multi
                      ? <textarea value={f[key] || ''} onChange={e => set(key, e.target.value)} rows={2}
                          placeholder={ph} className={inputCls + ' leading-relaxed'} />
                      : <input value={f[key] || ''} onChange={e => set(key, e.target.value)}
                          placeholder={ph} className={inputCls} />}
                  </div>
                </div>
              ))}
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

      <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,image/*" hidden
        onChange={e => { const file = e.target.files?.[0]; if (file) pickLogo(file); e.target.value = '' }} />
    </div>
  )
}
