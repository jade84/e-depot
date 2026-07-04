import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, Loader2 } from 'lucide-react'

// Quét QR bằng CAMERA TRỰC TIẾP (liên tục), không phải chụp 1 ảnh.
// Ưu tiên BarcodeDetector (Chrome Android); iOS/Safari fallback sang jsQR.
export function QrScanModal({ onClose, onDetect }: { onClose: () => void; onDetect: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cbRef = useRef(onDetect)
  cbRef.current = onDetect
  const [err, setErr] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const BD = (window as unknown as {
      BarcodeDetector?: new (o?: { formats?: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> }
    }).BarcodeDetector
    const detector = BD ? new BD({ formats: ['qr_code'] }) : null

    const stop = () => {
      stopped = true
      if (raf) cancelAnimationFrame(raf)
      stream?.getTracks().forEach(t => t.stop())
    }

    const tick = async () => {
      if (stopped) return
      const v = videoRef.current
      if (v && v.readyState >= 2 && v.videoWidth) {
        try {
          let text: string | null = null
          if (detector) {
            const codes = await detector.detect(v)
            text = codes[0]?.rawValue ?? null
          } else {
            canvas.width = v.videoWidth
            canvas.height = v.videoHeight
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!
            ctx.drawImage(v, 0, 0)
            const d = ctx.getImageData(0, 0, canvas.width, canvas.height)
            text = jsQR(d.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' })?.data ?? null
          }
          if (text) { stop(); cbRef.current(text); return }
        } catch { /* bỏ qua lỗi từng khung hình */ }
      }
      raf = requestAnimationFrame(tick)
    }

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play()
          setReady(true)
          tick()
        }
      } catch {
        setErr('Không mở được camera. Hãy cấp quyền camera cho trình duyệt, hoặc dùng nút "Tải hình".')
      }
    })()

    return stop
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white safe-top">
        <span className="font-semibold text-[15px]">Quét QR trên phiếu</span>
        <button onClick={onClose} className="p-1 -mr-1"><X size={24} /></button>
      </div>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-60 h-60 border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        {!ready && !err && (
          <div className="absolute inset-0 flex items-center justify-center text-white gap-2 text-[14px]">
            <Loader2 size={20} className="animate-spin" /> Đang mở camera…
          </div>
        )}
      </div>
      <div className="p-4 text-center text-[13px]">
        {err ? <span className="text-red-300">{err}</span> : <span className="text-white/80">Đưa ô QR ở góc phiếu vào khung</span>}
      </div>
    </div>
  )
}
