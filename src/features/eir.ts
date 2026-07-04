import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Một phiếu EIR (bắt từ lệnh in của phần mềm depot, lưu bởi hệ thống e-EIR).
export type Eir = {
  id: string                 // = content_hash (mã tra cứu / verify code)
  so_phieu: string | null
  container_no: string | null
  bien_so: string | null
  ngay: string | null
  tinh_trang: string | null
  fields_json: Record<string, string>
  raw_text: string | null
  pdf_url: string | null
  pdf_ref: string | null
  created_at: string
}

// Cấu hình công ty cho mẫu phiếu EIR (do trang /settings của e-EIR ghi vào eir_settings).
export type EirSettings = {
  cn_vi: string
  cn_en: string
  logo_caption: string
  mst: string
  dienthoai: string
  diachi: string
  vpdd: string
  bank1: string
  bank2: string
  bank3: string
  retention_months: string  // tự xoá phiếu cũ hơn X tháng (0 = giữ mãi)
  logo_uri: string   // data URI của logo (ghép từ logo_mime + logo_b64), '' nếu chưa có
}

// Mặc định = Green Logistics (khớp SETTINGS_DEFAULTS bên e-EIR); DB có thì đè lên.
export const EIR_SETTINGS_DEFAULTS: EirSettings = {
  cn_vi: 'CÔNG TY CỔ PHẦN TIẾP VẬN XANH',
  cn_en: 'GREEN LOGISTICS JOINT STOCK COMPANY',
  logo_caption: 'Green Logistics',
  mst: '0305013204',
  dienthoai: '02822108750',
  diachi: '161 Nguyễn Văn Quỳ, Phường Phú Thuận, TP. Hồ Chí Minh, Việt Nam',
  vpdd: 'Tầng M, Tòa nhà Titan Tower, 70-72-74 Đường số 37, KP 5, P. Bình Trưng, TP. Hồ Chí Minh',
  bank1: '0071003931964, Vietcombank TP.HCM',
  bank2: '221180700000014, Eximbank - CN Sài Gòn',
  bank3: '67210329, ACB - CN Sài Gòn - TP.HCM',
  retention_months: '0',
  logo_uri: '',
}

// Tra cứu phiếu — KHỚP CHÍNH XÁC (không phân biệt hoa/thường) theo
// số container / biển số / số phiếu / ngày. Chỉ chạy khi có từ khoá.
export function useEirSearch(q: string, enabled = true) {
  const kw = q.trim()
  return useQuery({
    queryKey: ['eir', 'search', kw],
    enabled: enabled && kw.length > 0,
    queryFn: async (): Promise<Eir[]> => {
      // ilike KHÔNG có ký tự đại diện `*` = khớp đúng cả chuỗi (bỏ ký tự phá cú pháp).
      const exact = kw.replace(/[(),]/g, ' ').trim()
      const { data, error } = await supabase
        .from('eir')
        .select('*')
        .or(`container_no.ilike.${exact},bien_so.ilike.${exact},so_phieu.ilike.${exact},ngay.ilike.${exact}`)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as Eir[]
    },
  })
}

// Một phiếu theo id (mã tra cứu).
export function useEir(id: string | undefined) {
  return useQuery({
    queryKey: ['eir', id],
    queryFn: async (): Promise<Eir> => {
      const { data, error } = await supabase.from('eir').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Eir
    },
    enabled: !!id,
  })
}

// Cấu hình công ty cho phiếu (ghép logo từ logo_mime + logo_b64).
export function useEirSettings() {
  return useQuery({
    queryKey: ['eir_settings'],
    queryFn: async (): Promise<EirSettings> => {
      const { data, error } = await supabase.from('eir_settings').select('key,value')
      if (error) throw error
      const map: Record<string, string> = {}
      for (const row of data ?? []) map[(row as { key: string }).key] = (row as { value: string }).value
      const cfg: EirSettings = { ...EIR_SETTINGS_DEFAULTS }
      for (const k of Object.keys(EIR_SETTINGS_DEFAULTS) as (keyof EirSettings)[]) {
        if (k !== 'logo_uri' && map[k] != null) cfg[k] = map[k]
      }
      if (map.logo_mime && map.logo_b64) cfg.logo_uri = `data:${map.logo_mime};base64,${map.logo_b64}`
      return cfg
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Admin: lưu cấu hình mẫu phiếu (upsert key-value vào eir_settings).
// Cần policy ghi (SQL 20_eir_settings_admin.sql) + quyền 'eir_form'.
export function useSaveEirSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vals: Record<string, string>) => {
      const rows = Object.entries(vals).map(([key, value]) => ({ key, value: value ?? '' }))
      const { error } = await supabase.from('eir_settings').upsert(rows)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eir_settings'] }),
  })
}

// Lấy mã phiếu (id) từ chuỗi QR trên phiếu in (dạng https://.../form/<id> hoặc /eir/<id>).
export function eirIdFromQr(text: string): string | null {
  const s = text.trim()
  // Ưu tiên bắt sau /form/ hoặc /eir/
  const m = s.match(/\/(?:form|eir)\/([A-Za-z0-9]+)/)
  if (m) return m[1]
  // Nếu QR chỉ chứa đúng mã hash (không phải URL)
  if (/^[A-Za-z0-9]{16,64}$/.test(s)) return s
  return null
}
