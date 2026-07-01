import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Vehicle = {
  id: string
  owner_id: string
  name: string | null
  plate: string
  photos_xe: string[]
  photos_giay: string[]
  driver_id: string | null
  status: 'cho_duyet' | 'kich_hoat'
  created_at: string
}

export type NewVehicle = {
  name: string
  plate: string
  photosXe: string[]      // URL đã upload
  photosGiay: string[]
}

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from('vehicles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Vehicle[]
    },
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: NewVehicle) => {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error('Chưa đăng nhập')

      const { error } = await supabase.from('vehicles').insert({
        owner_id: uid,
        name: v.name || null,
        plate: v.plate,
        photos_xe: v.photosXe,
        photos_giay: v.photosGiay,
        status: 'kich_hoat',          // bỏ duyệt — kích hoạt ngay
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}

export function useAssignDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ vehicleId, driverId }: { vehicleId: string; driverId: string | null }) => {
      const { error } = await supabase.from('vehicles').update({ driver_id: driverId }).eq('id', vehicleId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}
