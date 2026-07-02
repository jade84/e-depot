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
  status: 'cho_duyet' | 'kich_hoat' | 'tu_choi'
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
        status: 'cho_duyet',          // chờ admin duyệt trước khi dùng
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}

// ── Admin: duyệt xe (đọc tất cả xe của mọi nhà xe) ──────────────────────────
export function useAllVehicles() {
  return useQuery({
    queryKey: ['vehicles-admin'],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from('vehicles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Vehicle[]
    },
  })
}

// Admin duyệt/từ chối xe + gửi thông báo cho nhà xe (owner).
export function useReviewVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ vehicle, status, reason }: { vehicle: Vehicle; status: Vehicle['status']; reason?: string }) => {
      const { error } = await supabase.from('vehicles').update({ status }).eq('id', vehicle.id)
      if (error) throw error

      const approved = status === 'kich_hoat'
      const title = approved ? 'Xe đã được duyệt' : 'Xe bị từ chối'
      const body = approved
        ? `Xe ${vehicle.plate} đã được kích hoạt, có thể dùng để tạo đơn.`
        : `Xe ${vehicle.plate} bị từ chối.${reason?.trim() ? ' Lý do: ' + reason.trim() : ''}`
      const { error: e2 } = await supabase.from('notifications').insert({
        owner_id: vehicle.owner_id,
        title, body,
        type: approved ? 'vehicle_approve' : 'vehicle_reject',
        ref_id: vehicle.id,
      })
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      qc.invalidateQueries({ queryKey: ['vehicles-admin'] })
    },
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
