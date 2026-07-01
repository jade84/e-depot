import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Khi chưa cấu hình Supabase (chưa tạo project), app vẫn chạy được ở chế độ DEMO.
export const isSupabaseReady = Boolean(url && anon)

// Tạo client an toàn kể cả khi thiếu env — chỉ dùng khi isSupabaseReady = true.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anon ?? 'placeholder-anon-key',
)
