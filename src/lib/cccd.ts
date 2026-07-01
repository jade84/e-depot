import jsQR from 'jsqr'

export type CccdInfo = {
  cccd: string
  cmnd: string
  name: string
  dob: string        // DD/MM/YYYY
  gender: string
  address: string
}

// Cắt 1 vùng ảnh (theo tỉ lệ), vẽ ra canvas ở kích thước mong muốn rồi giải mã.
function decodeRegion(
  bitmap: ImageBitmap,
  region: [number, number, number, number],  // rx, ry, rw, rh (0..1)
  target: number,                            // độ dài cạnh dài khi vẽ
): string | null {
  const W = bitmap.width, H = bitmap.height
  const sx = Math.round(region[0] * W), sy = Math.round(region[1] * H)
  const sw = Math.max(1, Math.round(region[2] * W)), sh = Math.max(1, Math.round(region[3] * H))
  const scale = Math.min(2, target / Math.max(sw, sh))
  const cw = Math.max(1, Math.round(sw * scale)), ch = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, cw, ch)
  const img = ctx.getImageData(0, 0, cw, ch)
  const code = jsQR(img.data, cw, ch, { inversionAttempts: 'attemptBoth' })
  return code?.data ?? null
}

// Dùng BarcodeDetector gốc của trình duyệt (mạnh hơn jsQR với ảnh chụp).
async function tryBarcodeDetector(bitmap: ImageBitmap): Promise<string | null> {
  const BD = (globalThis as unknown as { BarcodeDetector?: new (o?: { formats?: string[] }) => {
    detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]>
  } }).BarcodeDetector
  if (!BD) return null
  try {
    const detector = new BD({ formats: ['qr_code'] })
    const codes = await detector.detect(bitmap)
    return codes?.[0]?.rawValue ?? null
  } catch {
    return null
  }
}

// Giải mã QR từ 1 ảnh (File) → chuỗi dữ liệu, hoặc null.
// 1) Thử BarcodeDetector (nếu có). 2) jsQR trên toàn ảnh + từng vùng ở nhiều độ phóng.
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file)

  const native = await tryBarcodeDetector(bitmap)
  if (native) return native

  const regions: [number, number, number, number][] = [
    [0, 0, 1, 1],           // toàn ảnh
    [0.5, 0, 0.5, 0.5],     // góc phải trên
    [0, 0.5, 0.5, 0.5],     // góc trái dưới
    [0.5, 0.5, 0.5, 0.5],   // góc phải dưới
    [0.5, 0, 0.5, 1],       // nửa phải
    [0, 0, 1, 0.55],        // nửa trên
    [0, 0.45, 1, 0.55],     // nửa dưới
    [0.25, 0.2, 0.5, 0.6],  // giữa
  ]
  const targets = [1100, 1700, 2400]
  for (const region of regions) {
    for (const target of targets) {
      const res = decodeRegion(bitmap, region, target)
      if (res) return res
    }
  }
  return null
}

// Phân tích chuỗi QR trên CCCD gắn chip.
// Định dạng: SoCCCD|SoCMND|HoTen|NgaySinh(ddMMyyyy)|GioiTinh|DiaChi|NgayCap
export function parseCccdQR(text: string): CccdInfo | null {
  const p = text.split('|')
  if (p.length < 4) return null
  const cccd = (p[0] ?? '').trim()
  const name = (p[2] ?? '').trim()
  const dobRaw = (p[3] ?? '').trim()
  if (!/^\d{9,12}$/.test(cccd)) return null
  const dob = /^\d{8}$/.test(dobRaw)
    ? `${dobRaw.slice(0, 2)}/${dobRaw.slice(2, 4)}/${dobRaw.slice(4, 8)}`
    : ''
  return {
    cccd,
    cmnd: (p[1] ?? '').trim(),
    name,
    dob,
    gender: (p[4] ?? '').trim(),
    address: (p[5] ?? '').trim(),
  }
}

// Chuẩn hoá tên để so sánh (bỏ dấu cách thừa, viết hoa)
export function normName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toUpperCase()
}
