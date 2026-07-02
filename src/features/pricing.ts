import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Pricing = {
  id: string
  loai: 'lay' | 'tra'
  loai_cont: string
  depot: string | null
  hang_tau: string | null
  don_gia: number
  active: boolean
  created_at: string
}

export type PricingInput = {
  id?: string
  loai: 'lay' | 'tra'
  loai_cont: string
  depot: string | null
  hang_tau: string | null
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
        .order('loai', { ascending: true })
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
        loai: p.loai,
        loai_cont: p.loai_cont,
        depot: p.depot || null,
        hang_tau: p.hang_tau || null,
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

// Tìm đơn giá /1 cont khớp nhất. Dòng có depot/hãng tàu cụ thể được ưu tiên
// hơn dòng "mọi depot/mọi hãng tàu" (null). Trả null nếu chưa có giá.
export function matchPrice(
  rows: Pricing[] | undefined,
  q: { loai: 'lay' | 'tra'; loai_cont: string; depot?: string; hang_tau?: string },
): number | null {
  if (!rows || !q.loai_cont) return null
  const cands = rows.filter(r =>
    r.active &&
    r.loai === q.loai &&
    r.loai_cont === q.loai_cont &&
    (r.depot == null || r.depot === q.depot) &&
    (r.hang_tau == null || r.hang_tau === q.hang_tau),
  )
  if (!cands.length) return null
  const score = (r: Pricing) => (r.depot ? 2 : 0) + (r.hang_tau ? 1 : 0)
  cands.sort((a, b) => score(b) - score(a))
  return cands[0].don_gia
}
