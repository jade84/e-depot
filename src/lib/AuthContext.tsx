import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseReady } from './supabase'

export type Profile = {
  id: string
  name: string
  phone: string            // số điện thoại — dùng để đăng nhập
  cccd?: string | null     // số CCCD/CMND (làm thủ tục tại depot)
  role?: string
  perms?: string[]         // quyền chi tiết (khi role != 'admin')
  demo?: boolean
}

export type SignUpInput = { phone: string; name: string; cccd: string; password: string }

type AuthState = {
  profile: Profile | null
  loading: boolean
  ready: boolean           // Supabase đã cấu hình chưa
  can: (perm: string) => boolean   // role='admin' full quyền; hoặc có perm cụ thể
  signIn: (phone: string, password: string) => Promise<{ error?: string }>
  signUp: (input: SignUpInput) => Promise<{ error?: string }>
  signInDemo: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)
const DEMO_KEY = 'edepot_demo_profile'

// Tài khoản là số điện thoại → map sang email nội bộ cho Supabase Auth
function toEmail(phone: string) {
  return phone.includes('@') ? phone : `${phone}@edepot.local`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u: User) {
    const meta = (u.user_metadata ?? {}) as { name?: string; phone?: string; cccd?: string }
    const emailPhone = (u.email ?? '').split('@')[0]
    // Đọc hồ sơ trong bảng users (có thể lỗi nếu thiếu cột → dùng metadata thay thế)
    const { data } = await supabase.from('users').select('name, phone, cccd, role, perms').eq('id', u.id).maybeSingle()
    const name = (data?.name?.trim() || meta.name?.trim() || '')
    const phone = (data?.phone || meta.phone || emailPhone)
    setProfile({
      id: u.id,
      phone,
      name: name || phone,
      cccd: data?.cccd ?? meta.cccd ?? null,
      role: data?.role ?? 'driver',
      perms: (data as { perms?: string[] } | null)?.perms ?? [],
    })
  }

  useEffect(() => {
    const demo = localStorage.getItem(DEMO_KEY)
    if (demo) {
      try { setProfile(JSON.parse(demo)); setLoading(false); return } catch { /* ignore */ }
    }
    if (!isSupabaseReady) { setLoading(false); return }

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      if (u) await loadProfile(u)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user
      if (u) await loadProfile(u)
      else if (!localStorage.getItem(DEMO_KEY)) setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(phone: string, password: string): Promise<{ error?: string }> {
    if (!isSupabaseReady) return { error: 'Chưa cấu hình Supabase. Dùng "Vào thử (demo)".' }
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(phone), password })
    if (error) return { error: 'Sai số điện thoại hoặc mật khẩu.' }
    return {}
  }

  async function signUp({ phone, name, cccd, password }: SignUpInput): Promise<{ error?: string }> {
    if (!isSupabaseReady) return { error: 'Chưa cấu hình Supabase.' }
    const { error } = await supabase.auth.signUp({
      email: toEmail(phone),
      password,
      options: { data: { phone, name, cccd } },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already')) return { error: 'Số điện thoại này đã đăng ký.' }
      return { error: error.message }
    }
    return {}
  }

  function signInDemo() {
    const p: Profile = { id: 'demo', name: 'Tài xế Demo', phone: '0900000000', cccd: '000000000000', demo: true }
    localStorage.setItem(DEMO_KEY, JSON.stringify(p))
    setProfile(p)
  }

  async function signOut() {
    localStorage.removeItem(DEMO_KEY)
    if (isSupabaseReady) await supabase.auth.signOut()
    setProfile(null)
  }

  function can(perm: string): boolean {
    if (!profile) return false
    if (profile.role === 'admin') return true
    return (profile.perms ?? []).includes(perm)
  }

  return (
    <AuthContext.Provider value={{ profile, loading, ready: isSupabaseReady, can, signIn, signUp, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
