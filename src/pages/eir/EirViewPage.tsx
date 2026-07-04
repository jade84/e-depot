import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { Printer, ChevronLeft, Loader2, AlertCircle, Download } from 'lucide-react'
import { useEir, useEirSettings, EIR_SETTINGS_DEFAULTS, type Eir, type EirSettings } from '../../features/eir'

// Địa chỉ công khai để dựng link/QR trên phiếu (điện thoại khác quét được).
// Ưu tiên biến môi trường VITE_PUBLIC_URL; mặc định = app e-depot đã deploy.
const PUBLIC_URL = ((import.meta.env.VITE_PUBLIC_URL as string | undefined) || 'https://e-depot.vercel.app').replace(/\/+$/, '')

// CSS port nguyên từ mẫu phiếu web (FORM_CSS của e-EIR), prefix .ef- để không đụng Tailwind.
const FORM_CSS = `
.ef-root { --g:#198754; background:#e9ecef; }
.ef-root .ef-sheet { position:relative; width:210mm; min-height:148mm; margin:12px auto; padding:6mm;
  background:#fff; box-shadow:0 1px 6px rgba(0,0,0,.2); font-family:Arial,"Segoe UI",sans-serif; color:#000; box-sizing:border-box; }
.ef-root .ef-sheet * { box-sizing:border-box; }
.ef-root .ef-watermark { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:.06; z-index:0; pointer-events:none; }
.ef-root .ef-watermark img { width:55%; }
.ef-root .ef-content { position:relative; z-index:1; }
.ef-root .ef-hdr { display:flex; align-items:flex-start; gap:12px; }
.ef-root .ef-logo { text-align:center; flex-shrink:0; width:96px; }
.ef-root .ef-mark { width:54px; height:54px; margin:0 auto; border:2.5px solid var(--g); border-radius:12px;
  color:var(--g); font-size:26px; font-weight:bold; display:flex; align-items:center; justify-content:center; }
.ef-root .ef-logo img { max-width:90px; max-height:62px; }
.ef-root .ef-lt { font-size:10px; font-weight:bold; color:var(--g); margin-top:2px; letter-spacing:.3px; }
.ef-root .ef-rl { color:#c00; }
.ef-root .ef-org { flex:1; min-width:0; }
.ef-root .ef-cnvi { font-weight:bold; font-size:15px; color:var(--g); }
.ef-root .ef-ln { font-size:9.5px; color:#222; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ef-root .ef-ln i { color:#666; }
.ef-root .ef-bank { flex-shrink:0; width:225px; margin-left:auto; text-align:left; font-size:9.5px; color:#222; }
.ef-root .ef-bt { margin-bottom:2px; }
.ef-root .ef-bank i { color:#666; }
.ef-root .ef-rule { border:0; border-top:2px solid var(--g); margin:7px 0; }
.ef-root .ef-titlebar { text-align:center; margin-bottom:6px; }
.ef-root .ef-titlebar b { font-size:17px; letter-spacing:.5px; }
.ef-root .ef-titlebar i { font-size:12px; display:block; }
.ef-root .ef-subno { font-size:11px; margin-top:3px; }
.ef-root .ef-grid { width:100%; border-collapse:collapse; margin-top:6px; table-layout:fixed; }
.ef-root .ef-grid td { border:1px solid #000; padding:5px 7px; vertical-align:middle; font-size:11px; word-wrap:break-word; }
.ef-root .ef-cellrow { display:flex; align-items:center; gap:8px; }
.ef-root .ef-lblblock { display:flex; flex-direction:column; line-height:1.05; flex-shrink:0; min-width:62px; border-right:1px dashed #9aa; padding-right:8px; }
.ef-root .ef-lbl { font-weight:bold; }
.ef-root .ef-en { font-style:italic; color:#555; font-size:9px; }
.ef-root .ef-val { font-weight:bold; font-size:13px; word-break:break-word; }
.ef-root .ef-sign { display:flex; justify-content:space-between; margin-top:10px; font-size:11px; text-align:center; }
.ef-root .ef-sign > div { flex:1; padding:4px; }
.ef-root .ef-sign b { display:block; }
.ef-root .ef-sign i { font-size:9px; color:#555; display:block; margin-bottom:28px; }
.ef-root .ef-verify { display:flex; gap:8px; align-items:center; margin:8px 0 0; width:fit-content; text-align:left;
  border:1px solid var(--g); border-radius:6px; padding:5px 8px; font-size:9px; color:#222; background:#f6fdf9; }
.ef-root .ef-vqr { width:54px; height:54px; }
.ef-root .ef-vok { color:var(--g); font-weight:bold; font-size:10px; }
.ef-root .ef-vurl { color:#666; }
.ef-root .ef-verify i { color:#666; font-size:8.5px; }
@media print {
  /* Bỏ mọi ràng buộc layout của app + chỉ in phiếu */
  html, body { height:auto !important; overflow:visible !important; margin:0 !important; padding:0 !important; background:#fff !important; }
  body * { visibility:hidden !important; }
  .ef-root, .ef-root * { visibility:visible !important; }
  .ef-root { position:absolute !important; left:0 !important; top:0 !important; width:100% !important;
    margin:0 !important; padding:0 !important; background:#fff !important; overflow:visible !important; }
  .ef-root .ef-sheet { position:static !important; margin:0 auto !important; box-shadow:none !important;
    width:190mm !important; min-height:auto !important; padding:0 !important; zoom:1 !important; transform:none !important; }
  .ef-root .ef-verify { background:#fff; page-break-inside:avoid; }
  .no-print { display:none !important; }
  @page { size:A5 landscape; margin:8mm; }
}
`

function LogoCaption({ caption }: { caption: string }) {
  return (
    <>
      {caption.split(' ').map((w, i) => (
        <span key={i}>
          {i > 0 && ' '}
          <span className="ef-rl">{w[0]}</span>{w.slice(1)}
        </span>
      ))}
    </>
  )
}

function Cell({ vi, en, value, colSpan, valStyle }: {
  vi: string; en?: string; value?: string; colSpan?: number; valStyle?: React.CSSProperties
}) {
  return (
    <td colSpan={colSpan}>
      <div className="ef-cellrow">
        <div className="ef-lblblock">
          <span className="ef-lbl">{vi}</span>
          {en && <span className="ef-en">{en}</span>}
        </div>
        <div className="ef-val" style={valStyle}>{value || ' '}</div>
      </div>
    </td>
  )
}

function Receipt({ e, cfg, qr, verifyUrl }: { e: Eir; cfg: EirSettings; qr: string; verifyUrl: string }) {
  const f = e.fields_json || {}
  const g = (k: string) => f[k] || ''
  const tauChuyen = g('tau_chuyen') || [g('tau'), g('chuyen')].filter(Boolean).join(' / ')
  const printedAt = new Date().toLocaleString('vi-VN')
  const banks = [cfg.bank1, cfg.bank2, cfg.bank3].filter(Boolean)
  // Logo: ưu tiên logo cấu hình trong eir_settings; chưa có thì dùng logo e-depot.
  const logoSrc = cfg.logo_uri || '/logo.png'

  return (
    <div className="ef-sheet">
      <div className="ef-watermark"><img src={logoSrc} alt="" /></div>
      <div className="ef-content">
        {/* Header */}
        <div className="ef-hdr">
          <div className="ef-logo">
            <img src={logoSrc} alt="logo" />
            <div className="ef-lt"><LogoCaption caption={cfg.logo_caption} /></div>
          </div>
          <div className="ef-org">
            <div className="ef-cnvi">{cfg.cn_vi}</div>
            <div className="ef-ln"><b>Mã số thuế</b> <i>(Tax code)</i>: {cfg.mst} &nbsp;·&nbsp; <b>Điện thoại</b> <i>(Tel)</i>: {cfg.dienthoai}</div>
            <div className="ef-ln"><b>Địa chỉ</b> <i>(Address)</i>: {cfg.diachi}</div>
            {cfg.vpdd && <div className="ef-ln"><b>VPĐD</b>: {cfg.vpdd}</div>}
          </div>
          <div className="ef-bank">
            <div className="ef-bt"><b>Ngân hàng</b> <i>(Bank account)</i>:</div>
            {banks.map((b, i) => <div key={i}>{b}</div>)}
          </div>
        </div>
        <hr className="ef-rule" />

        {/* Tiêu đề */}
        <div className="ef-titlebar">
          <b>PHIẾU GIAO NHẬN CONTAINER</b>
          <i>EQUIPMENT INTERCHANGE RECEIPT</i>
          <div className="ef-subno">Số thứ tự phiếu: ________________</div>
        </div>

        {/* Bảng thông tin trên */}
        <table className="ef-grid">
          <tbody>
            <tr>
              <Cell vi="Giao cho / Nhận của" en="Deliver to / Receive from" value={g('khach_hang')} colSpan={2} />
              <Cell vi="Số xe" en="Truck No" value={g('so_xe')} />
            </tr>
            <tr>
              <Cell vi="Lệnh giao hàng" en="D.O / B.N ref" value={g('do_bn_ref')} />
              <Cell vi="Ngày" en="Date" value={g('ngay')} />
              <Cell vi="Số điện thoại" en="Phone" value={g('so_dt')} />
            </tr>
          </tbody>
        </table>

        {/* Bảng chính */}
        <table className="ef-grid">
          <tbody>
            <tr>
              <Cell vi="Số Cont" en="Cont. No" value={g('container_no')} />
              <Cell vi="Hãng cont" en="Operator" value={g('operator')} />
              <Cell vi="Tàu / Chuyến" en="Vessel / Voy" value={tauChuyen} colSpan={2} />
            </tr>
            <tr>
              <Cell vi="Cỡ" en="Length" value={g('kich_co')} />
              <Cell vi="Trạng thái" en="Status" value={g('trang_thai')} />
              <Cell vi="Vị trí thực tế" en="Act. CY Location" value={g('act_cy')} />
              <Cell vi="Siêu trọng / trường" en="OH/OW/OL/ES" />
            </tr>
            <tr>
              <Cell vi="Trọng lượng" en="Weight" value={g('trong_luong')} />
              <Cell vi="Nhiệt độ" en="Reefer-Temp" />
              <Cell vi="IMO" en="DG" />
              <Cell vi="Số hóa đơn nội bộ" en="Internal Invoice" />
            </tr>
            <tr>
              <Cell vi="Thời điểm vào cổng" en="Time In" value={g('time_in')} colSpan={2} />
              <Cell vi="Thời điểm ra cổng" en="Time Out" value={g('time_out')} colSpan={2} />
            </tr>
            <tr>
              <Cell vi="Số Seal" en="Shipper's Seal" value={g('seal')} />
              <Cell vi="Số Seal HQ" en="Customs Seal" />
              <Cell vi="Cảng đi đến" en="POL / POD / FPD" value={g('cang_do')} colSpan={2} />
            </tr>
          </tbody>
        </table>
        <table className="ef-grid">
          <tbody>
            <tr>
              <td style={{ width: '28%' }}>
                <div className="ef-cellrow">
                  <div className="ef-lblblock"><span className="ef-lbl">Nâng hạ</span><span className="ef-en">IN / OUT</span></div>
                  <div className="ef-val" style={{ fontSize: 16 }}>{g('loai') || ' '}</div>
                </div>
              </td>
              <Cell vi="Ghi chú" en="Remarks" value={g('ghi_chu')} />
            </tr>
          </tbody>
        </table>

        {/* Hàng chữ ký */}
        <div className="ef-sign">
          {[['Người phát hành', 'Issuer'], ['Cổng vào / ra', 'Gate In / Out'], ['Bãi Container', 'CY'], ['Người giao / nhận', 'Deliver / Receiver']].map(([vi, en]) => (
            <div key={vi}><b>{vi}</b><i>{en}</i></div>
          ))}
        </div>

        {/* Khối xác thực + QR */}
        <div className="ef-verify">
          {qr && <img className="ef-vqr" src={qr} alt="QR tra cứu" />}
          <div>
            <div className="ef-vok">✔ Đã kiểm tra — bản in lại từ hệ thống e-EIR</div>
            <div>In lúc <i>(Reprinted at)</i>: {printedAt}</div>
            <div>Mã tra cứu <i>(Verify code)</i>: <b>{e.id}</b></div>
            <div className="ef-vurl">Quét QR hoặc mở: {verifyUrl}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EirViewPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: e, isLoading, error } = useEir(id)
  const { data: cfg = EIR_SETTINGS_DEFAULTS } = useEirSettings()
  const [qr, setQr] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)

  const verifyUrl = `${PUBLIC_URL}/eir/${id}`

  // Chụp trọn mẫu phiếu (khổ thật, kể cả khối QR) thành canvas. Nạp lib động.
  async function captureSheet(): Promise<HTMLCanvasElement | null> {
    const sheet = rootRef.current?.querySelector('.ef-sheet') as HTMLElement | null
    if (!sheet) return null
    const prevZoom = sheet.style.zoom
    sheet.style.zoom = '1'
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      return await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff' })
    } finally {
      sheet.style.zoom = prevZoom
    }
  }

  function fileName() {
    const f = e?.fields_json || {}
    return `EIR-${f.container_no || (e?.id || '').slice(0, 8)}-${f.loai || ''}`.replace(/-+$/, '')
  }

  // Tải PDF: ảnh chụp phiếu → 1 trang A5 ngang.
  async function download() {
    if (!e) return
    setDownloading(true)
    try {
      const canvas = await captureSheet()
      if (!canvas) return
      const { jsPDF } = await import('jspdf')
      // Trang PDF lấy ĐÚNG tỉ lệ phiếu → ảnh phủ kín, 1 trang, không lề thừa.
      const pw = 210, ph = +(pw * canvas.height / canvas.width).toFixed(1)
      const pdf = new jsPDF({ orientation: ph > pw ? 'portrait' : 'landscape', unit: 'mm', format: [pw, ph] })
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pw, ph)
      pdf.save(`${fileName()}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Không tạo được PDF. Anh thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  // In: ảnh phiếu vào iframe ẩn, ép object-fit vừa ĐÚNG 1 trang A5 ngang (không tràn 2 trang).
  async function printSheet() {
    if (!e) return
    setPrinting(true)
    try {
      const canvas = await captureSheet()
      if (!canvas) return
      const img = canvas.toDataURL('image/png')
      // Trang in lấy ĐÚNG tỉ lệ phiếu → ảnh phủ kín cả trang, 1 trang, không lề thừa.
      const pw = 210, ph = +(pw * canvas.height / canvas.width).toFixed(1)
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
      document.body.appendChild(iframe)
      const doc = iframe.contentWindow!.document
      doc.open()
      doc.write(
        '<!doctype html><html><head><meta charset="utf-8"><style>' +
        '@page{size:' + pw + 'mm ' + ph + 'mm;margin:0}html,body{margin:0;padding:0}' +
        'img{width:' + pw + 'mm;height:' + ph + 'mm;display:block}' +
        '</style></head><body><img src="' + img + '"></body></html>'
      )
      doc.close()
      const imgEl = doc.querySelector('img') as HTMLImageElement
      const go = () => {
        iframe.contentWindow!.focus()
        iframe.contentWindow!.print()
        setTimeout(() => iframe.remove(), 1500)
      }
      if (imgEl.complete) go()
      else imgEl.onload = go
    } catch (err) {
      console.error(err)
      alert('Không in được. Anh thử lại.')
    } finally {
      setPrinting(false)
    }
  }

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 }).then(setQr).catch(() => setQr(''))
  }, [verifyUrl])

  // Thu nhỏ mẫu phiếu (210mm ≈ 794px) vừa bề ngang màn hình (in ra vẫn full khổ).
  // Phụ thuộc `e` để chạy LẠI sau khi phiếu render xong (lúc đầu đang loading, chưa có .ef-root).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const SHEET_PX = (210 / 25.4) * 96
    const compute = () => setZoom(Math.min(1, el.clientWidth / SHEET_PX))
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [e])

  return (
    <div className="min-h-full bg-ink-200 flex flex-col">
      {/* Thanh công cụ (ẩn khi in) */}
      <div className="no-print sticky top-0 z-10 bg-brand-800 text-white flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => nav(-1)} className="p-1 -ml-1"><ChevronLeft size={22} /></button>
        <span className="font-bold text-[14px] flex-1 truncate">Phiếu EIR {e?.container_no ? `· ${e.container_no}` : ''}</span>
        <button onClick={download} disabled={downloading || !e}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Tải
        </button>
        <button onClick={printSheet} disabled={printing || !e}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50">
          {printing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} In
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-400 text-[13px]">
          <Loader2 size={18} className="animate-spin" /> Đang tải phiếu…
        </div>
      ) : error || !e ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-ink-500 text-[13px] px-6 text-center">
          <AlertCircle size={28} className="text-red-500" />
          Không tìm thấy phiếu này (mã có thể sai hoặc phiếu chưa được đưa lên hệ thống).
        </div>
      ) : (
        <div className="ef-root" ref={rootRef}>
          <Receipt e={e} cfg={cfg} qr={qr} verifyUrl={verifyUrl} />
        </div>
      )}

      <style>{FORM_CSS}</style>
      {/* Zoom chỉ áp cho màn hình; khi in giữ khổ thật */}
      <style>{`@media screen { .ef-root .ef-sheet { zoom: ${zoom}; } }`}</style>
    </div>
  )
}
