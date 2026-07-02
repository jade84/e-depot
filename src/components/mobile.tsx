import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ImagePlus, X, Loader2, AlertTriangle, Camera, Image as ImageIcon } from 'lucide-react'
import { uploadImage } from '../lib/storage'

// Thanh tiêu đề màn hình con (có nút back)
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="safe-top bg-brand-800 text-white flex items-center gap-2 px-3 py-3.5 sticky top-0 z-10">
      <button onClick={() => nav(-1)} className="p-1 -ml-1"><ChevronLeft size={24} /></button>
      <h1 className="text-[15px] font-bold flex-1 truncate">{title}</h1>
      {right}
    </header>
  )
}

// Bảng phí: giá trước VAT → tiền VAT → thành tiền sau VAT.
export function FeeBreakdown({ subtotal, vatPct, total, unitPrice, qty }: {
  subtotal: number; vatPct: number; total: number; unitPrice: number; qty: number
}) {
  const row = 'flex items-center justify-between px-3.5 py-2'
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 divide-y divide-brand-100">
      <div className={row}>
        <span className="text-[12px] text-ink-500">Giá trước VAT ({unitPrice.toLocaleString('vi-VN')}đ × {qty})</span>
        <span className="text-[13px] font-semibold text-ink-700">{subtotal.toLocaleString('vi-VN')} đ</span>
      </div>
      <div className={row}>
        <span className="text-[12px] text-ink-500">VAT {vatPct}%</span>
        <span className="text-[13px] font-semibold text-ink-700">{(total - subtotal).toLocaleString('vi-VN')} đ</span>
      </div>
      <div className={row}>
        <span className="text-[12.5px] font-bold text-brand-800">Thành tiền (đã VAT)</span>
        <span className="text-[16px] font-extrabold text-brand-800">{total.toLocaleString('vi-VN')} đ</span>
      </div>
    </div>
  )
}

// Ô chụp/chọn 1 ảnh — bấm mở camera (điện thoại) hoặc thư viện.
export function PhotoSlot({ file, onPick, onClear, label }: {
  file: File | null
  onPick: (f: File) => void
  onClear: () => void
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>('')

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full aspect-square rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 flex flex-col items-center justify-center gap-1 overflow-hidden active:bg-ink-100 transition"
      >
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-cover" />
          : <>
              <ImagePlus size={24} className="text-ink-400" />
              {label && <span className="text-[10px] text-ink-400 px-1 text-center">{label}</span>}
            </>
        }
      </button>
      {file && (
        <button type="button" onClick={onClear}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
          <X size={14} />
        </button>
      )}
      <input
        ref={ref} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }}
      />
    </div>
  )
}

// Ô ảnh TẢI LÊN NGAY khi chọn → giữ URL (chuỗi) thay vì File.
// Nhờ vậy nếu trang reload (mở camera trên điện thoại) ảnh đã lên server không mất.
export function PhotoUploadSlot({ url, onChange, bucket, userId, label }: {
  url: string | null
  onChange: (u: string | null) => void
  bucket: string
  userId: string | null
  label?: string
}) {
  const camRef = useRef<HTMLInputElement>(null)   // chụp bằng camera
  const libRef = useRef<HTMLInputElement>(null)   // chọn từ thư viện
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [menu, setMenu] = useState(false)

  async function onPick(f: File) {
    if (!userId) return
    setBusy(true); setFailed(false)
    try {
      const u = await uploadImage(bucket, userId, f)
      onChange(u)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenu(true)}
        disabled={busy}
        className="w-full aspect-square rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 flex flex-col items-center justify-center gap-1 overflow-hidden active:bg-ink-100 transition"
      >
        {busy
          ? <><Loader2 size={22} className="text-brand-500 animate-spin" /><span className="text-[10px] text-ink-400">Đang tải…</span></>
          : url
            ? <img src={url} alt="" className="w-full h-full object-cover" />
            : failed
              ? <><AlertTriangle size={22} className="text-red-500" /><span className="text-[10px] text-red-500 px-1 text-center">Lỗi tải, bấm thử lại</span></>
              : <><ImagePlus size={24} className="text-ink-400" />{label && <span className="text-[10px] text-ink-400 px-1 text-center">{label}</span>}</>
        }
      </button>
      {url && !busy && (
        <button type="button" onClick={() => onChange(null)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
          <X size={14} />
        </button>
      )}

      {/* Chọn: chụp ảnh hoặc lấy từ thư viện */}
      {menu && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={() => setMenu(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-3 space-y-2" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => { setMenu(false); camRef.current?.click() }}
              className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:bg-brand-800">
              <Camera size={18} /> Chụp ảnh
            </button>
            <button type="button" onClick={() => { setMenu(false); libRef.current?.click() }}
              className="w-full h-12 rounded-xl bg-ink-100 text-ink-700 font-semibold text-[15px] flex items-center justify-center gap-2 active:bg-ink-200">
              <ImageIcon size={18} /> Chọn từ thư viện
            </button>
            <button type="button" onClick={() => setMenu(false)}
              className="w-full h-11 rounded-xl text-ink-500 font-semibold text-[14px]">Huỷ</button>
            <div className="pb-2" />
          </div>
        </div>
      )}

      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onInput} />
      <input ref={libRef} type="file" accept="image/*" hidden onChange={onInput} />
    </div>
  )
}
