import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Order = {
  id: string
  owner_id: string
  loai: 'lay' | 'tra'
  so_bl: string | null
  depot: string | null
  hang_tau: string | null
  loai_cont: string | null
  so_luong: number
  so_cont: string[]
  vehicle_id: string | null
  bien_so: string | null
  driver_id: string | null
  tai_xe_ten: string | null
  tai_xe_cccd: string | null
  cong_ty_hd: string | null
  mst: string | null
  photos: string[]
  phi_nang_ha: number
  trang_thai: string
  created_at: string
}

export type NewOrder = {
  loai: 'lay' | 'tra'
  so_bl: string
  depot: string
  hang_tau: string
  loai_cont: string
  so_luong: number
  so_cont: string[]
  vehicle_id: string | null
  bien_so: string
  driver_id: string | null
  tai_xe_ten: string
  tai_xe_cccd: string
  cong_ty_hd: string
  mst: string
  photos: string[]
  phi_nang_ha: number
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (o: NewOrder) => {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error('Chưa đăng nhập')
      const { error } = await supabase.from('orders').insert({ owner_id: uid, ...o })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').update({ trang_thai: 'huy' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
