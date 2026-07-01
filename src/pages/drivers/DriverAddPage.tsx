import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, CheckCircle2, Loader2, Camera, ImageUp, X } from 'lucide-react'
import { ScreenHeader, PhotoUploadSlot } from '../../components/mobile'
import { useCreateDriver } from '../../features/drivers'
import { supabase } from '../../lib/supabase'
import { digitsOnly, isValidCccd, isValidPhone, maskDate, parseDob } from '../../lib/validate'
import { decodeQrFromFile, parseCccdQR, normName, type CccdInfo } from '../../lib/cccd'

const DRAFT_KEY = 'draft_driver'
function loadDraft(): Record<string, unknown> {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}') } catch { return {} }
}

export function DriverAddPage() {
  const nav = useNavigate()
  const create = useCreateDriver()

  const d0 = loadDraft()
  const [name, setName] = useState((d0.name as string) || '')
  const [cccd, setCccd] = useState((d0.cccd as string) || '')
  const [phone, setPhone] = useState((d0.phone as string) || '')
  const [dob, setDob] = useState((d0.dob as string) || '')
  const [email, setEmail] = useState((d0.email as string) || '')
  const [front, setFront] = useState<string | null>((d0.front as string) || null)   // URL đã upload
  const [back, setBack] = useState<string | null>((d0.back as string) || null)
  const [face, setFace] = useState<string | null>((d0.face as string) || null)
  const [scanned, setScanned] = useState<CccdInfo | null>((d0.scanned as CccdInfo) || null)   // dữ liệu đọc từ QR CCCD
  const [attest, setAttest] = useState(false)                     // tự xác nhận khi không quét được
  const [scanning, setScanning] = useState(false)
  const [err, setErr] = useState('')
  const [scanMenu, setScanMenu] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)) }, [])

  // Tự lưu nháp (gồm cả URL ảnh) → trang reload (mở camera) vẫn giữ được dữ liệu + ảnh
  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, cccd, phone, dob, email, scanned, front, back, face }))
  }, [name, cccd, phone, dob, email, scanned, front, back, face])
  const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY)

  async function onScan(file: File) {
    setScanning(true); setErr('')
    try {
      const raw = await decodeQrFromFile(file)
      if (!raw) {
        setErr('Không tìm thấy mã QR trong ảnh. Chọn ảnh rõ nét, thấy đủ ô QR (góc phải mặt trước CCCD), hoặc nhập tay rồi tick xác nhận.')
        return
      }
      const info = parseCccdQR(raw)
      if (!info) {
        setErr('Đọc được QR nhưng chưa đúng định dạng CCCD. Nội dung: ' + raw.slice(0, 140))
        return
      }
      // Chỉ tự điền thông tin — KHÔNG đụng vào ô ảnh mặt trước/sau (bạn tự chụp riêng)
      setName(info.name)
      setCccd(info.cccd.slice(0, 12))
      if (info.dob) setDob(info.dob)
      setScanned(info)
      setAttest(false)
    } catch {
      setErr('Lỗi xử lý ảnh. Thử ảnh khác hoặc nhập tay.')
    } finally {
      setScanning(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!name.trim()) { setErr('Nhập tên lái xe.'); return }
    if (!isValidCccd(cccd)) { setErr('Số CCCD phải 12 số (hoặc CMND 9 số).'); return }
    if (phone && !isValidPhone(phone)) { setErr('Số điện thoại phải 10 số, bắt đầu bằng 0.'); return }
    let dobISO = ''
    if (dob.trim()) {
      const parsed = parseDob(dob)
      if (!parsed) { setErr('Ngày sinh chưa đúng. Nhập kiểu DD/MM/YYYY, VD 15/03/1990.'); return }
      dobISO = parsed
    }

    // ── Đối chiếu với CCCD đã quét ──
    if (scanned) {
      const diffs: string[] = []
      if (normName(name) !== normName(scanned.name)) diffs.push('Họ tên')
      if (cccd !== scanned.cccd) diffs.push('Số CCCD')
      if (scanned.dob && dob.trim() && dob.trim() !== scanned.dob) diffs.push('Ngày sinh')
      if (diffs.length) {
        setErr(`Thông tin không khớp CCCD đã quét: ${diffs.join(', ')}. Sửa lại cho đúng mới lưu được.`)
        return
      }
    } else if (!attest) {
      setErr('Chưa quét được CCCD. Hãy tick "Tôi xác nhận thông tin khớp với CCCD" để lưu.')
      return
    }

    if (!face) { setErr('Cần ảnh khuôn mặt tài xế (để check-in tại depot).'); return }
    if (!front) { setErr('Cần ảnh CCCD mặt trước.'); return }

    try {
      await create.mutateAsync({
        name: name.trim(), cccd, phone, dob: dobISO, email: email.trim(),
        photoFront: front, photoBack: back, photoFace: face,
      })
      clearDraft()
      nav('/nhan-su', { replace: true })
    } catch (e) {
      setErr('Lỗi lưu: ' + (e as Error).message)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <ScreenHeader title="Thêm nhân sự mới" />

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-4">
        {/* Quét mã QR CCCD / Căn cước — 1 nút mở menu Chụp / Chọn ảnh */}
        <div>
          <button type="button" onClick={() => setScanMenu(true)} disabled={scanning}
            className="w-full h-12 rounded-xl border-2 border-brand-500 text-brand-700 font-bold text-[14px] flex items-center justify-center gap-2 active:bg-brand-50 disabled:opacity-60">
            {scanning ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
            {scanning ? 'Đang đọc mã QR…' : 'Quét mã QR (tự điền)'}
          </button>
          <p className="text-[10.5px] text-ink-400 mt-1 px-1">
            Quét mặt có mã QR — <b>CCCD gắn chip:</b> mặt trước · <b>thẻ Căn cước mới:</b> mặt sau.
          </p>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onScan(f); e.target.value = '' }} />
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onScan(f); e.target.value = '' }} />

        {scanned && (
          <div className="flex items-center gap-2 text-[12.5px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle2 size={16} /> Đã quét từ CCCD — thông tin sẽ được đối chiếu khi lưu.
          </div>
        )}

        <Text label="Tên lái xe" req value={name} onChange={setName} placeholder="Nguyễn Văn A" />
        <Text label="Số CCCD" req value={cccd} onChange={v => setCccd(digitsOnly(v).slice(0, 12))}
          placeholder="0123456789xx" inputMode="numeric" hint="12 số (CMND cũ: 9 số)" />
        <Text label="Số điện thoại" value={phone} onChange={v => setPhone(digitsOnly(v).slice(0, 10))}
          placeholder="0987654321" inputMode="numeric" />

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Ngày sinh</label>
          <input value={dob} onChange={e => setDob(maskDate(e.target.value))}
            inputMode="numeric" maxLength={10} placeholder="DD/MM/YYYY"
            className="mt-1.5 w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition tracking-wide" />
          <p className="text-[10.5px] text-ink-400 mt-1 px-1">Nhập ngày → tháng → năm, tự thêm dấu / (VD 15/03/1990)</p>
        </div>

        <Text label="Email" value={email} onChange={setEmail} placeholder="email@vidu.com" inputMode="text" />

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Ảnh khuôn mặt <span className="text-red-500">*</span></label>
          <div className="mt-1.5 w-32">
            <PhotoUploadSlot url={face} bucket="drivers" userId={uid} label="Ảnh chân dung" onChange={setFace} />
          </div>
          <p className="text-[10.5px] text-ink-400 mt-1">Chụp cận cảnh khuôn mặt để tự động check-in tại Depot.</p>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-ink-600">Ảnh CCCD / Căn cước <span className="text-red-500">*</span></label>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <PhotoUploadSlot url={front} bucket="drivers" userId={uid} label="Mặt trước" onChange={setFront} />
            <PhotoUploadSlot url={back} bucket="drivers" userId={uid} label="Mặt sau" onChange={setBack} />
          </div>
        </div>

        {/* Xác nhận thủ công khi không quét được */}
        {!scanned && (
          <label className="flex items-start gap-2 text-[12.5px] text-ink-700 bg-ink-50 rounded-lg px-3 py-2.5">
            <input type="checkbox" checked={attest} onChange={e => setAttest(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span>Tôi xác nhận thông tin nhập trên <b>khớp với CCCD</b> của tài xế.</span>
          </label>
        )}

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

      {/* Menu chọn Chụp / Thư viện */}
      {scanMenu && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40"
          onClick={() => setScanMenu(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-2xl p-4 safe-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[14px] font-bold text-ink-900">Quét mã QR từ…</div>
              <button onClick={() => setScanMenu(false)} className="p-1 text-ink-400"><X size={20} /></button>
            </div>
            <button type="button"
              onClick={() => { setScanMenu(false); camRef.current?.click() }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-ink-50 active:bg-ink-100 mb-2">
              <Camera size={20} className="text-brand-600" />
              <span className="text-[14px] font-medium text-ink-800">Chụp ảnh</span>
            </button>
            <button type="button"
              onClick={() => { setScanMenu(false); fileRef.current?.click() }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-ink-50 active:bg-ink-100">
              <ImageUp size={20} className="text-brand-600" />
              <span className="text-[14px] font-medium text-ink-800">Chọn từ thư viện</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Text({ label, value, onChange, placeholder, inputMode, hint, req }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
  inputMode?: 'numeric' | 'tel' | 'text'; hint?: string; req?: boolean
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-ink-600">{label}{req && <span className="text-red-500"> *</span>}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        className="mt-1.5 w-full h-12 px-4 rounded-xl border border-ink-200 bg-ink-50 text-[15px] outline-none focus:border-brand-500 focus:bg-white transition" />
      {hint && <p className="text-[10.5px] text-ink-400 mt-1 px-1">{hint}</p>}
    </div>
  )
}
