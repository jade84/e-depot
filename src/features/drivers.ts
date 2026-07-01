import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Driver = {
  id: string
  owner_id: string
  name: string
  cccd: string
  phone: string | null
  dob: string | null
  email: string | null
  photo_cccd_front: string | null
  photo_cccd_back: string | null
  photo_face: string | null
  status: 'hoat_dong' | 'cho_duyet'
  created_at: string
}

export type NewDriver = {
  name: string
  cccd: string
  phone: string
  dob: string
  email: string
  photoFront: string | null   // URL đã upload
  photoBack: string | null
  photoFace: string | null
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async (): Promise<Driver[]> => {
      const { data, error } = await supabase
        .from('drivers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Driver[]
    },
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (d: NewDriver) => {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error('Chưa đăng nhập')

      const { error } = await supabase.from('drivers').insert({
        owner_id: uid,
        name: d.name,
        cccd: d.cccd,
        phone: d.phone || null,
        dob: d.dob || null,
        email: d.email || null,
        photo_cccd_front: d.photoFront,
        photo_cccd_back: d.photoBack,
        photo_face: d.photoFace,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })
}

export function useDeleteDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drivers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })
}
