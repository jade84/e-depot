import { useEffect, useState } from 'react'
import { Check, Loader2, ShieldAlert, QrCode } from 'lucide-react'
import { ScreenHeader } from '../../components/mobile'
import { useAuth } from '../../lib/AuthContext'
import { useBankInfo, useSaveBankInfo, DEFAULT_BANK, type BankInfo } from '../../features/settings'

const inputCls = 'w-full h-11 px-3 rounded-xl border border-ink-200 bg-ink-50 text-[14px] outline-none focus:border-brand-500 focus:bg-white transition'

export function BankSettingsPage() {
  const { profile } = useAuth()
  const { data: bank, isLoading } = useBankInfo()
  const save = useSaveBankInfo()
  const [f, setF] = useState<BankInfo>(DEFAULT_BANK)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Nạp dữ liệu hiện tại vào form khi tải xong.
  useEffect(() => { if (bank) setF(bank) }, [bank])

  const isAdmin = profile?.role === 'admin'
  const set = <K extends keyof BankInfo>(k: K, v: BankInfo[K]) => setF(s => ({ ...s, [k]: v }))

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-ink-100">
        <ScreenHeader title="Thông tin ngân hàng" />
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
    if (!f.bankId.trim() || !f.accountNo.trim() || !f.accountName.trim()) {
      setMsg({ type: 'err', text: 'Nhập đủ mã ngân hàng, số tài khoản và tên chủ tài khoản.' }); return
    }
    try {
      await save.mutateAsync({
        bankId: f.bankId.trim().toUpperCase(),
        accountNo: f.accountNo.trim(),
        accountName: f.accountName.trim().toUpperCase(),
        bankName: f.bankName.trim(),
      })
      setMsg({ type: 'ok', text: 'Đã lưu thông tin ngân hàng.' })
    } catch (e) {
      setMsg({ type: 'err', text: 'Lỗi lưu: ' + (e as Error).message })
    }
  }

  // Preview QR VietQR (số tiền mẫu để xem trước).
  const previewQr = f.bankId && f.accountNo
    ? `https://img.vietqr.io/image/${f.bankId.trim().toUpperCase()}-${f.accountNo.trim()}-compact2.png?accountName=${encodeURIComponent(f.accountName.trim().toUpperCase())}`
    : ''

  return (
    <div className="h-full flex flex-col bg-ink-100">
      <ScreenHeader title="Thông tin ngân hàng" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-ink-400 text-sm py-10">
            <Loader2 size={18} className="animate-spin" /> Đang tải…
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="text-[11px] text-ink-400 leading-snug">
                Thông tin này dùng để sinh <b>mã QR VietQR</b> và hiển thị số tài khoản ở trang Thanh toán của nhà xe.
              </div>

              <Field label="Mã ngân hàng (VietQR)" req>
                <input value={f.bankId} onChange={e => set('bankId', e.target.value.toUpperCase())}
                  placeholder="VD: VCB, TCB, ACB, MB, BIDV…" className={inputCls + ' uppercase'} />
                <p className="text-[10.5px] text-ink-400 mt-1">Mã ngắn theo VietQR (VCB=Vietcombank, TCB=Techcombank, MB=MBBank…).</p>
              </Field>

              <Field label="Số tài khoản" req>
                <input value={f.accountNo} onChange={e => set('accountNo', e.target.value.replace(/\s/g, ''))}
                  inputMode="numeric" placeholder="VD: 1234567890" className={inputCls} />
              </Field>

              <Field label="Tên chủ tài khoản" req>
                <input value={f.accountName} onChange={e => set('accountName', e.target.value.toUpperCase())}
                  placeholder="VD: CONG TY GREENLOGISTICS" className={inputCls + ' uppercase'} />
                <p className="text-[10.5px] text-ink-400 mt-1">Viết IN HOA, không dấu (theo chuẩn chuyển khoản).</p>
              </Field>

              <Field label="Tên ngân hàng (hiển thị)">
                <input value={f.bankName} onChange={e => set('bankName', e.target.value)}
                  placeholder="VD: Vietcombank" className={inputCls} />
              </Field>
            </div>

            {previewQr && (
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-3">
                  <QrCode size={13} /> Xem trước mã QR
                </div>
                <img src={previewQr} alt="QR xem trước" className="w-48 h-48 object-contain rounded-xl" loading="lazy" />
              </div>
            )}

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

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-ink-600">{label}{req && <span className="text-red-500"> *</span>}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
