import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type CatalogType = 'depot' | 'carrier' | 'cont_type'

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
