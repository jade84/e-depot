import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type CatalogType = 'depot' | 'carrier' | 'cont_type'

export type CatalogItem = {
  id: string
  type: CatalogType
  name: string
  sort: number
  active: boolean
  created_at: string
}

export type CatalogInput = {
  id?: string
  type: CatalogType
  name: string
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
}

export function useUpsertCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CatalogInput) => {
      const row = { type: c.type, name: c.name.trim(), sort: c.sort, active: c.active }
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
