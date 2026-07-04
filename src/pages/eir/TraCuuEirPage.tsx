import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ScanLine, Loader2, FileText, ChevronRight, Camera, Image as ImageIcon } from 'lucide-react'
import { useEirSearch, eirIdFromQr, type Eir } from '../../features/eir'
import { decodeQrFromFile } from '../../lib/cccd'

// Nhãn IN/OUT (nâng/hạ) từ field loai.
function LoaiBadge({ loai }: { loai?: string }) {
  const v = (loai || '').toUpperCase()
  if (v !== 'IN' && v !== 'OUT') return null
  const cls = v === 'IN' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{v}</span>
}

function EirRow({ e, onOpen }: { e: Eir; onOpen: () => void }) {
  const f = e.fields_json || {}
  return (
    <button onClick={onOpen}
      className="w-full flex items-center gap-3 px-3.5 py-3 bg-white active:bg-ink-50 text-left">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
        <FileText size={20} className="text-brand-700" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[14px] text-ink-800 truncate">{e.container_no || '(không số cont)'}</span>
          <LoaiBadge loai={f.loai} />
        </div>
        <div className="text-[12px] text-ink-500 truncate">
          {[e.bien_so, e.ngay, e.so_phieu].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <ChevronRight size={18} className="text-ink-300 shrink-0" />
    </button>
  )
}

export function TraCuuEirPage() {
  const nav = useNavigate()
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')            // chỉ đặt khi bấm Tìm / Enter
  const [scanning, setScanning] = useState(false)
  const [scanErr, setScanErr] = useState('')
  const [scanMenu, setScanMenu] = useState(false)
  const camRef = useRef<HTMLInputElement>(null)
  const libRef = useRef<HTMLInputElement>(null)

  const { data: rows = [], isLoading, isFetching } = useEirSearch(q)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setQ(input.trim())
  }

  async function onScan(file: File) {
    setScanMenu(false)
    setScanning(true); setScanErr('')
    try {
      const text = await decodeQrFromFile(file)
      const id = text ? eirIdFromQr(text) : null
      if (id) nav(`/eir/${id}`)
      else setScanErr('Không đọc được mã QR trên phiếu. Hãy chụp/chọn ảnh rõ ô QR góc phiếu.')
    } catch {
      setScanErr('Không đọc được ảnh. Thử lại.')
    } finally {
      setScanning(false)
    }
  }

  const searched = q.length > 0

  return (
    <div className="h-full bg-ink-100 flex flex-col">
      {/* Header tab */}
      <div className="safe-top bg-brand-800 text-white px-4 py-3.5 flex items-center gap-2 sticky top-0 z-10">
        <h1 className="text-[15px] font-bold flex-1">Tra cứu phiếu EIR</h1>
        <button onClick={() => setScanMenu(true)}
          className="flex items-center gap-1 text-[12px] font-semibold bg-white/15 px-2.5 py-1.5 rounded-lg active:bg-white/25">
          <ScanLine size={14} /> Quét QR
        </button>
      </div>

      {/* Ô tìm kiếm — nhập ĐÚNG số rồi bấm Tìm */}
      <div className="p-3">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="flex-1 bg-white rounded-xl flex items-center gap-2 px-3 h-11 border border-ink-200">
            <Search size={18} className="text-ink-400" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              inputMode="search"
              enterKeyHint="search"
              placeholder="Nhập đúng số container / biển số / số phiếu"
              className="flex-1 text-[14px] text-ink-700 outline-none bg-transparent"
            />
          </div>
          <button type="submit"
            className="px-4 h-11 rounded-xl bg-brand-700 text-white font-semibold text-[14px] active:bg-brand-800">
            Tìm
          </button>
        </form>
        <button
          onClick={() => setScanMenu(true)}
          className="mt-2 w-full h-11 rounded-xl bg-brand-50 text-brand-800 border border-brand-200 font-semibold text-[14px] flex items-center justify-center gap-2 active:bg-brand-100"
        >
          <ScanLine size={18} /> Quét QR trên phiếu
        </button>
        {scanErr && <p className="mt-2 text-[12px] text-red-600">{scanErr}</p>}
      </div>

      {/* Kết quả */}
      <div className="flex-1">
        {scanning ? (
          <div className="flex items-center justify-center gap-2 py-16 text-ink-400 text-[13px]">
            <Loader2 size={18} className="animate-spin" /> Đang đọc mã QR…
          </div>
        ) : !searched ? (
          <div className="text-center text-ink-400 text-[13px] py-16 px-8">
            Nhập <b>đúng</b> số container, biển số hoặc số phiếu rồi bấm <b>Tìm</b> — hoặc <b>Quét QR</b> trên phiếu.
          </div>
        ) : isLoading || isFetching ? (
          <div className="flex items-center justify-center gap-2 py-16 text-ink-400 text-[13px]">
            <Loader2 size={18} className="animate-spin" /> Đang tìm…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-16 px-6">
            Không tìm thấy phiếu khớp "{q}". Kiểm tra lại số đã nhập.
          </div>
        ) : (
          <>
            <div className="px-4 pt-1 pb-1.5 text-[11px] text-ink-400">{rows.length} phiếu</div>
            <div className="divide-y divide-ink-100">
              {rows.map(e => <EirRow key={e.id} e={e} onOpen={() => nav(`/eir/${e.id}`)} />)}
            </div>
          </>
        )}
      </div>

      {/* Menu chọn nguồn ảnh QR: mở camera hoặc tải hình */}
      {scanMenu && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={() => setScanMenu(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-3 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="text-center text-[13px] font-semibold text-ink-500 pb-1">Quét QR trên phiếu</div>
            <button onClick={() => camRef.current?.click()}
              className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:bg-brand-800">
              <Camera size={18} /> Mở camera
            </button>
            <button onClick={() => libRef.current?.click()}
              className="w-full h-12 rounded-xl bg-ink-100 text-ink-700 font-semibold text-[15px] flex items-center justify-center gap-2 active:bg-ink-200">
              <ImageIcon size={18} /> Tải hình
            </button>
            <button onClick={() => setScanMenu(false)}
              className="w-full h-11 rounded-xl text-ink-500 font-semibold text-[14px]">Huỷ</button>
            <div className="pb-2" />
          </div>
        </div>
      )}

      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onScan(f); e.target.value = '' }} />
      <input ref={libRef} type="file" accept="image/*" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onScan(f); e.target.value = '' }} />
    </div>
  )
}
