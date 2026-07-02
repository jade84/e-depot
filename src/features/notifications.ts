import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type AppNotification = {
  id: string
  owner_id: string
  title: string
  body: string | null
  type: string | null
  ref_id: string | null
  read: boolean
  created_at: string
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as AppNotification[]
    },
  })
}

// Số thông báo chưa đọc (cho chấm đỏ ở bottom nav).
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('notifications').select('id', { count: 'exact', head: true }).eq('read', false)
      if (error) throw error
      return count ?? 0
    },
    staleTime: 30_000,
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
