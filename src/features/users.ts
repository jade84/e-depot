import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type AdminUser = {
  id: string
  name: string
  phone: string
  role: string
  perms: string[]
}

// Danh sách toàn bộ user (chỉ admin đọc được — RLS 18_permissions.sql).
export function useAllUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from('users').select('id, name, phone, role, perms')
        .order('role', { ascending: true }).order('name', { ascending: true })
      if (error) throw error
      return (data ?? []).map(u => ({ ...(u as AdminUser), perms: (u as AdminUser).perms ?? [] }))
    },
  })
}

export function useUpdateUserAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role, perms }: { id: string; role: string; perms: string[] }) => {
      const { error } = await supabase.from('users').update({ role, perms }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-admin'] }),
  })
}
