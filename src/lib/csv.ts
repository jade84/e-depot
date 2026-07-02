// Tiện ích CSV nhẹ (không cần thư viện) — đủ dùng cho import/export Excel.

// Parse CSV → mảng dòng × ô. Xử lý ô có dấu ngoặc kép "" và dấu phẩy bên trong.
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '') // bỏ BOM nếu có
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') { field += '"'; i++ } // "" → "
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* bỏ qua */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  // bỏ dòng trống hoàn toàn
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

// Bọc 1 ô nếu chứa , " hoặc xuống dòng.
function cell(v: string | number): string {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Dựng chuỗi CSV (kèm BOM để Excel đọc đúng tiếng Việt).
export function buildCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header.map(cell).join(',')]
  for (const r of rows) lines.push(r.map(cell).join(','))
  return '﻿' + lines.join('\r\n')
}

// Tải file CSV về máy.
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
