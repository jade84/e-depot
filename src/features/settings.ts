import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type BankInfo = {
  bankId: string       // mã ngân hàng VietQR (VCB, TCB, ACB, MB, …)
  accountNo: string    // số tài khoản
  accountName: string  // tên chủ tài khoản (IN HOA, không dấu)
  bankName: string     // tên ngân hàng hiển thị
}

export const DEFAULT_BANK: BankInfo = {
  bankId: 'VCB',
  accountNo: '1234567890',
  accountName: 'CONG TY GREENLOGISTICS',
  bankName: 'Vietcombank',
}

// Đọc thông tin ngân hàng nhận thanh toán (settings key='bank_info').
export function useBankInfo() {
  return useQuery({
    queryKey: ['settings', 'bank_info'],
    queryFn: async (): Promise<BankInfo> => {
      const { data, error } = await supabase
        .from('settings').select('value').eq('key', 'bank_info').maybeSingle()
      if (error) throw error
      return { ...DEFAULT_BANK, ...((data?.value as Partial<BankInfo>) ?? {}) }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveBankInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (b: BankInfo) => {
      const { error } = await supabase.from('settings').upsert({
        key: 'bank_info',
        value: b,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'bank_info'] }),
  })
}

// ── Thuế VAT (%) — đơn giá bảng giá là CHƯA VAT, phí đơn = subtotal × (1+VAT) ──
export const DEFAULT_VAT = 10

export function useVatPercent() {
  return useQuery({
    queryKey: ['settings', 'vat_percent'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('settings').select('value').eq('key', 'vat_percent').maybeSingle()
      if (error) throw error
      const n = Number(data?.value)
      return Number.isFinite(n) ? n : DEFAULT_VAT
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveVatPercent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (percent: number) => {
      const { error } = await supabase.from('settings').upsert({
        key: 'vat_percent',
        value: percent,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'vat_percent'] }),
  })
}
