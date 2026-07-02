import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type CatalogType = 'depot' | 'carrier' | 'cont_type'

// Nhóm hãng tàu — để bảng giá áp theo nhóm (Nội địa / Quốc tế) thay vì từng hãng.
export type CarrierGroup = 'noi_dia' | 'quoc_te'
export const CARRIER_GROUPS: { value: CarrierGroup; label: string }[] = [
  { value: 'noi_dia', label: 'Nội địa' },
  { value: 'quoc_te', label: 'Quốc tế' },
]
export const CARRIER_GROUP_LABEL: Record<string, string> = {
  noi_dia: 'Nội địa', quoc_te: 'Quốc tế',
}

export type CatalogItem = {
  id: string
  type: CatalogType
  name: string
  nhom: string | null      // nhóm — chỉ dùng cho carrier ('noi_dia'|'quoc_te')
  sort: number
  active: boolean
  created_at: string
}

export type CatalogInput = {
  id?: string
  type: CatalogType
  name: string
  nhom: string | null
  sort: number
  active: boolean
}

// Đọc danh mục dùng chung (depot / hãng tàu / loại cont) từ database.
// Sau này admin thêm/sửa trong bảng catalog thì form tự cập nhật.
export function useCatalog(type: CatalogType) {
  return useQuery({
    queryKey: ['catalog', type],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('catalog').select('name').eq('type', type).eq('active', true)
        .order('sort', { ascending: true }).order('name', { ascending: true })
      if (error) throw error
      return (data ?? []).map(r => (r as { name: string }).name)
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Đọc hãng tàu kèm nhóm (Nội địa/Quốc tế) — dùng để tra nhóm khi tính giá.
export function useCarriers() {
  return useQuery({
    queryKey: ['carriers'],
    queryFn: async (): Promise<{ name: string; nhom: CarrierGroup | null }[]> => {
      const { data, error } = await supabase
        .from('catalog').select('name, nhom').eq('type', 'carrier').eq('active', true)
        .order('sort', { ascending: true }).order('name', { ascending: true })
      if (error) throw error
      return (data ?? []).map(r => ({
        name: (r as { name: string }).name,
        nhom: ((r as { nhom: CarrierGroup | null }).nhom) ?? null,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Admin: quản lý danh mục (đọc CẢ dòng đang tắt) ──────────────────────────
export function useCatalogAdmin(type: CatalogType) {
  return useQuery({
    queryKey: ['catalog-admin', type],
    queryFn: async (): Promise<CatalogItem[]> => {
      const { data, error } = await supabase
        .from('catalog').select('*').eq('type', type)
        .order('sort', { ascending: true }).order('name', { ascending: true })
      if (error) throw error
      return data as CatalogItem[]
    },
  })
}

function invalidateCatalog(qc: ReturnType<typeof useQueryClient>, type: CatalogType) {
  qc.invalidateQueries({ queryKey: ['catalog', type] })
  qc.invalidateQueries({ queryKey: ['catalog-admin', type] })
  if (type === 'carrier') qc.invalidateQueries({ queryKey: ['carriers'] })
}

export function useUpsertCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CatalogInput) => {
      const row = {
        type: c.type,
        name: c.name.trim(),
        // nhóm chỉ áp dụng cho hãng tàu
        nhom: c.type === 'carrier' ? (c.nhom || null) : null,
        sort: c.sort,
        active: c.active,
      }
      const { error } = c.id
        ? await supabase.from('catalog').update(row).eq('id', c.id)
        : await supabase.from('catalog').insert(row)
      if (error) throw error
      return c.type
    },
    onSuccess: type => invalidateCatalog(qc, type),
  })
}

export function useDeleteCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; type: CatalogType }) => {
      const { error } = await supabase.from('catalog').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => invalidateCatalog(qc, v.type),
  })
}
