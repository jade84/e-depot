// Chỉ giữ chữ số
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

// Số điện thoại VN: 10 số, bắt đầu bằng 0 (VD 0987654321)
export function isValidPhone(s: string): boolean {
  return /^0\d{9}$/.test(s)
}

// CCCD 12 số hoặc CMND cũ 9 số
export function isValidCccd(s: string): boolean {
  return /^\d{9}$/.test(s) || /^\d{12}$/.test(s)
}

// Định dạng ngày khi gõ: tự chèn "/" → DD/MM/YYYY
export function maskDate(s: string): string {
  const d = digitsOnly(s).slice(0, 8)         // DDMMYYYY
  let out = d.slice(0, 2)
  if (d.length > 2) out += '/' + d.slice(2, 4)
  if (d.length > 4) out += '/' + d.slice(4, 8)
  return out
}

// Kiểm tra + đổi "DD/MM/YYYY" → ISO "YYYY-MM-DD" (null nếu sai)
export function parseDob(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim())
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const day = +dd, mon = +mm, year = +yyyy
  const dt = new Date(year, mon - 1, day)
  if (dt.getFullYear() !== year || dt.getMonth() !== mon - 1 || dt.getDate() !== day) return null
  if (year < 1900 || dt > new Date()) return null
  return `${yyyy}-${mm}-${dd}`
}

// Chuẩn hoá biển số: bỏ khoảng trắng, viết hoa
export function normalizePlate(s: string): string {
  return s.toUpperCase().replace(/\s+/g, '').replace(/[^0-9A-Z-]/g, '')
}

// Biển số VN: 2 số + 1-2 chữ + (-) + 4-5 số. VD 01A-1234, 01AB-12345
export function isValidPlate(s: string): boolean {
  return /^\d{2}[A-Z]{1,2}-?\d{4,5}$/.test(normalizePlate(s))
}

// Số container theo ISO 6346: 4 chữ + 7 số (VD MEDU1234567)
export function normalizeCont(s: string): string {
  return s.toUpperCase().replace(/[^0-9A-Z]/g, '')
}
export function isValidContNo(s: string): boolean {
  return /^[A-Z]{4}\d{7}$/.test(normalizeCont(s))
}
