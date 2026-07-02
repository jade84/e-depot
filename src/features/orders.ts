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

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async (): Promise<Order> => {
      const { data, error } = await supabase
        .from('orders').select('*').eq('id', id).single()
      if (error) throw error
      return data as Order
    },
    enabled: !!id,
  })
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

// ── Admin: duyệt đơn (đọc tất cả đơn của mọi nhà xe) ────────────────────────
export function useAllOrders() {
  return useQuery({
    queryKey: ['orders-admin'],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
  })
}

// Duyệt (→ chua_tt: chờ thanh toán) hoặc từ chối (→ tu_choi) + gửi thông báo.
export function useReviewOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ order, approve, reason }: { order: Order; approve: boolean; reason?: string }) => {
      const trang_thai = approve ? 'chua_tt' : 'tu_choi'
      const { error } = await supabase.from('orders').update({ trang_thai }).eq('id', order.id)
      if (error) throw error

      const ma = order.so_bl || order.id.slice(0, 8).toUpperCase()
      const title = approve ? 'Đơn đã được duyệt' : 'Đơn bị từ chối'
      const body = approve
        ? `Đơn ${ma} đã được duyệt, vui lòng thanh toán phí nâng hạ.`
        : `Đơn ${ma} bị từ chối.${reason?.trim() ? ' Lý do: ' + reason.trim() : ''}`
      const { error: e2 } = await supabase.from('notifications').insert({
        owner_id: order.owner_id,
        title, body,
        type: approve ? 'order_approve' : 'order_reject',
        ref_id: order.id,
      })
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['orders-admin'] })
    },
  })
}
