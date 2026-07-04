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

  // Hồ sơ cơ bản dựng NGAY từ session (không cần mạng) — để không kẹt màn "Đang tải"
  // và không bị đá về /login khi query hồ sơ chưa kịp về.
  function baseProfile(u: User): Profile {
    const meta = (u.user_metadata ?? {}) as { name?: string; phone?: string; cccd?: string }
    const emailPhone = (u.email ?? '').split('@')[0]
    const phone = meta.phone || emailPhone
    return { id: u.id, phone, name: meta.name?.trim() || phone, cccd: meta.cccd ?? null, role: 'driver', perms: [] }
  }

  // Đặt hồ sơ cơ bản ngay, rồi bổ sung role/perms từ bảng users (KHÔNG chặn UI, KHÔNG await).
  function loadProfile(u: User) {
    setProfile(prev => (prev && prev.id === u.id ? prev : baseProfile(u)))
    supabase.from('users').select('name, phone, cccd, role, perms').eq('id', u.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setProfile(p => (p && p.id === u.id) ? {
          ...p,
          name: data.name?.trim() || p.name,
          phone: data.phone || p.phone,
          cccd: data.cccd ?? p.cccd,
          role: data.role ?? p.role,
          perms: (data as { perms?: string[] }).perms ?? p.perms,
        } : p)
      }, () => { /* giữ hồ sơ cơ bản nếu lỗi mạng */ })
  }

  useEffect(() => {
    const demo = localStorage.getItem(DEMO_KEY)
    if (demo) {
      try { setProfile(JSON.parse(demo)); setLoading(false); return } catch { /* ignore */ }
    }
    if (!isSupabaseReady) { setLoading(false); return }

    let done = false
    const finish = () => { if (!done) { done = true; setLoading(false) } }
    // An toàn: không bao giờ kẹt "Đang tải" quá 6s dù mạng treo lúc máy vừa thức dậy.
    const timer = setTimeout(finish, 6000)

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) loadProfile(u)
      finish()
    }).catch(finish)

    // QUAN TRỌNG: callback KHÔNG async — tránh deadlock khoá auth của supabase-js khi refresh token.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      if (u) loadProfile(u)
      else if (!localStorage.getItem(DEMO_KEY)) setProfile(null)
      finish()
    })
    return () => { clearTimeout(timer); sub.subscription.unsubscribe() }
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
