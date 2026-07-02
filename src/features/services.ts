import type { ComponentType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Warehouse, Boxes, Truck, Ship, Container, Package, Anchor, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

type IconType = ComponentType<{ size?: number; className?: string }>

// Bộ icon cho dịch vụ — admin chọn theo key (lưu chuỗi trong DB).
export const SERVICE_ICONS: Record<string, IconType> = {
  container: Container,
  warehouse: Warehouse,
  boxes: Boxes,
  package: Package,
  truck: Truck,
  ship: Ship,
  anchor: Anchor,
  building: Building2,
}
export const SERVICE_ICON_KEYS = Object.keys(SERVICE_ICONS)
export function serviceIcon(key: string): IconType {
  return SERVICE_ICONS[key] ?? Container
}

export type Service = {
  id: string
  title: string
  mo_ta: string | null
  noi_dung: string | null
  icon: string
  sort: number
  active: boolean
  created_at: string
}

export type ServiceInput = {
  id?: string
  title: string
  mo_ta: string
  noi_dung: string
  icon: string
  sort: number
  active: boolean
}

// Dịch vụ đang bật (dùng ở trang Thông tin).
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from('services').select('*').eq('active', true)
        .order('sort', { ascending: true }).order('created_at', { ascending: true })
      if (error) throw error
      return data as Service[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Toàn bộ dịch vụ kể cả tắt (admin).
export function useServicesAdmin() {
  return useQuery({
    queryKey: ['services-admin'],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from('services').select('*')
        .order('sort', { ascending: true }).order('created_at', { ascending: true })
      if (error) throw error
      return data as Service[]
    },
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: async (): Promise<Service> => {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
      if (error) throw error
      return data as Service
    },
    enabled: !!id,
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['services'] })
  qc.invalidateQueries({ queryKey: ['services-admin'] })
}

export function useUpsertService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (s: ServiceInput) => {
      const row = {
        title: s.title.trim(),
        mo_ta: s.mo_ta.trim() || null,
        noi_dung: s.noi_dung.trim() || null,
        icon: s.icon,
        sort: s.sort,
        active: s.active,
      }
      const { error } = s.id
        ? await supabase.from('services').update(row).eq('id', s.id)
        : await supabase.from('services').insert(row)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}
