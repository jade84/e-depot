import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Giá nâng hạ Lấy & Trả như nhau → không tách theo nghiệp vụ, chỉ theo loại cont
// (tuỳ chọn thêm depot + nhóm hãng tàu Nội địa/Quốc tế). Đơn giá nhập là CHƯA VAT.
export type Pricing = {
  id: string
  loai_cont: string
  depot: string | null
  hang_tau_nhom: string | null   // null = mọi hãng tàu | 'noi_dia' | 'quoc_te'
  don_gia: number
  active: boolean
  created_at: string
}

export type PricingInput = {
  id?: string
  loai_cont: string
  depot: string | null
  hang_tau_nhom: string | null
  don_gia: number
  active: boolean
}

// Bảng giá — nhà xe đọc được dòng active; admin đọc/ghi tất cả (RLS).
export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: async (): Promise<Pricing[]> => {
      const { data, error } = await supabase
        .from('pricing').select('*')
        .order('loai_cont', { ascending: true })
      if (error) throw error
      return data as Pricing[]
    },
  })
}

export function useUpsertPricing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: PricingInput) => {
      const row = {
        loai_cont: p.loai_cont,
        depot: p.depot || null,
        hang_tau_nhom: p.hang_tau_nhom || null,
        don_gia: p.don_gia,
        active: p.active,
      }
      const { error } = p.id
        ? await supabase.from('pricing').update(row).eq('id', p.id)
        : await supabase.from('pricing').insert(row)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })
}

export function useDeletePricing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })
}

// Import hàng loạt từ CSV: khớp theo (loai_cont, depot, hang_tau_nhom) →
// có thì update, chưa có thì insert. Trả số dòng thêm/cập nhật.
export function useImportPricing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: PricingInput[]): Promise<{ inserted: number; updated: number }> => {
      const { data: existing, error: e1 } = await supabase
        .from('pricing').select('id, loai_cont, depot, hang_tau_nhom')
      if (e1) throw e1
      const key = (r: { loai_cont: string; depot: string | null; hang_tau_nhom: string | null }) =>
        `${r.loai_cont}|${r.depot ?? ''}|${r.hang_tau_nhom ?? ''}`
      const idByKey = new Map(
        (existing ?? []).map(e => [key(e as Pricing), (e as Pricing).id]),
      )

      const toInsert: Omit<Pricing, 'id' | 'created_at'>[] = []
      let updated = 0
      for (const r of rows) {
        const row = {
          loai_cont: r.loai_cont,
          depot: r.depot || null,
          hang_tau_nhom: r.hang_tau_nhom || null,
          don_gia: r.don_gia,
          active: r.active,
        }
        const id = idByKey.get(key(row))
        if (id) {
          const { error } = await supabase.from('pricing').update(row).eq('id', id)
          if (error) throw error
          updated++
        } else {
          toInsert.push(row)
        }
      }
      if (toInsert.length) {
        const { error } = await supabase.from('pricing').insert(toInsert)
        if (error) throw error
      }
      return { inserted: toInsert.length, updated }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })
}

// Cộng VAT vào tạm tính (làm tròn về đồng).
export function withVat(subtotal: number, vatPercent: number): number {
  return Math.round(subtotal * (1 + vatPercent / 100))
}

// Tìm đơn giá /1 cont khớp nhất. Dòng có depot/nhóm hãng tàu cụ thể được ưu tiên
// hơn dòng "mọi depot/mọi hãng tàu" (null). Trả null nếu chưa có giá.
// carrierGroup = nhóm (Nội địa/Quốc tế) của hãng tàu trên đơn.
export function matchPrice(
  rows: Pricing[] | undefined,
  q: { loai_cont: string; depot?: string; carrierGroup?: string | null },
): number | null {
  if (!rows || !q.loai_cont) return null
  const cands = rows.filter(r =>
    r.active &&
    r.loai_cont === q.loai_cont &&
    (r.depot == null || r.depot === q.depot) &&
    (r.hang_tau_nhom == null || r.hang_tau_nhom === q.carrierGroup),
  )
  if (!cands.length) return null
  const score = (r: Pricing) => (r.depot ? 2 : 0) + (r.hang_tau_nhom ? 1 : 0)
  cands.sort((a, b) => score(b) - score(a))
  return cands[0].don_gia
}
